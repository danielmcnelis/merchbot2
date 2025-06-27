
import { SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, ForgedSet, Player } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const { AOD, FON, greenmark, com, emptybox, rar, scr, sup, tres, ult, arena } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('checklist')
		.setDescription('View your card checklist. 📋')
		.addStringOption(str =>
            str
                .setName('set')
                .setDescription('Enter set query.')
				.setAutocomplete(true)
                .setRequired(true)
        ),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const sets = await ForgedSet.findAll({
                    where: {
                        [Op.or]: {
                            name: {[Op.iLike]: `${focusedValue}%`},
                            code: {[Op.iLike]: `${focusedValue}%`}
                        }
                    },
                    limit: 5,
                    order: [["forSale", "DESC"], ["createdAt", "DESC"]]
                })

                await interaction.respond(
                    sets.map(set => ({ name: `${set.name} (${set.code})`, value: set.code })),
                )
            } catch (err) {
                console.log(err)
            }
        },
	async execute(interaction) {
        try {          
            const setCode = interaction.options.getString('set')
            if (!setCode) return interaction.reply({ content: `Please select a set from the auto-complete list.`})

            const player = await Player.findOne({ where: {discordId: interaction.user.id} })
            if (!player) return interaction.reply({ content: `You are not in the database.` })

            const inventory = await ForgedInventory.findAll({
                where: {
                    playerId: player.id,
                    cardCode: {
                        [Op.startsWith]: setCode
                    },
                    quantity: {
                        [Op.gte]: 1
                    }
                },
                include: [ForgedPrint],
                order: [['cardCode', 'ASC']]
            })

            const trips = await ForgedInventory.findAll({
                where: {
                    playerId: player.id,
                    cardCode: {
                        [Op.startsWith]: setCode
                    },
                    quantity: {
                        [Op.gte]: 3
                    }
                },
                include: [ForgedPrint],
                order: [['cardCode', 'ASC']]
            })

            const allPrints = await ForgedPrint.findAll({ 
                where: {
                    forgedSetCode: setCode
                },
                order: [['cardCode', 'ASC']]
            })

            if (!allPrints) return interaction.reply({ content: `No prints found in the database.`})

            const results = []
            const codes = []
            const cards = inventory.map((inv) => inv.forgedPrint.cardCode)
            const playsets = trips.map((trip) => trip.forgedPrint.cardCode)

            for (let i = 0; i < allPrints.length; i++) {
                const row = allPrints[i]
                const code = row.cardCode.slice(0,3)

                try {
                    if (!codes.includes(code)) {
                        codes.push(code)
                        const set = await ForgedSet.findOne({ where: { code } })
                        if (set) results.push(`${codes.length > 1 ? '\n' : ''}${eval(set.emoji)} --- ${set.name} --- ${eval(set.altEmoji)}`) 
                    }
                } catch (err) {
                    console.log(err)
                }

                const boxEmoji = playsets.includes(row.cardCode) ? tres : cards.includes(row.cardCode) ? greenmark : emptybox
                const count = (code === 'CH2') ? await ForgedInventory.count({ where: { printId: row.id } }) : true
                results.push(`${boxEmoji} ${eval(row.rarity)}${row.cardCode} - ${count ? row.cardName : '???'}`) 
            }

            for (let i = 0; i < results.length; i += 20) {
                if (results[i+21] && results[i+21].startsWith("\n")) {
                    interaction.user.send({ content: results.slice(i, i+21).join('\n').toString()})
                    i++
                } else {
                    interaction.user.send({ content: results.slice(i, i+20).join('\n').toString()})
                }
            }

            return interaction.reply({ content: `I messaged you the Checklist you requested.`})
        } catch (err) {
            console.log(err)
        }
	}
}