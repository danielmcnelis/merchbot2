
import { SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, ForgedSet, Player } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const { AOD, COC, CTP, FON, LDM, WCR, MYA, greenmark, com, emptybox, rar, scr, sup, tres, ult, arena, stardust, rising, falling } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('populations')
		.setDescription('View the card populations for a set. 📋')
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
            interaction.deferReply() 
            const setCode = interaction.options.getString('set')
            if (!setCode) return interaction.editReply({ content: `Please select a set from the auto-complete list.`})

            const player = await Player.findOne({ where: {discordId: interaction.user.id} })
            if (!player) return interaction.editReply({ content: `You are not in the database.` })

            const allPrints = await ForgedPrint.findAll({ 
                where: {
                    forgedSetCode: setCode
                },
                order: [['cardCode', 'ASC']]
            })

            if (!allPrints) return interaction.editReply({ content: `No prints found in the database.`})

            const results = []
            const codes = []

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

                const print = await allPrints[i]
                const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`

                let population = 0
                const invs = await ForgedInventory.findAll({ where: {
                    forgedPrintId: print.id,
                    quantity: { [Op.gt]: 0 }
                }})

                for (let j = 0; j < invs.length; j++) {
                    const inv = invs[j]
                    const quantity = inv.quantity
                    population += quantity
                }
                    
                results.push(`${card} - ${population}`)
            }

            for (let i = 0; i < results.length; i += 20) {
                if (results[i+21] && results[i+21].startsWith("\n")) {
                    interaction.user.send({ content: results.slice(i, i+21).join('\n').toString()})
                    i++
                } else {
                    interaction.user.send({ content: results.slice(i, i+20).join('\n').toString()})
                }
            }

            return interaction.editReply({ content: `I messaged you the Card Populations you requested.`})
        } catch (err) {
            console.log(err)
        }
	}
}