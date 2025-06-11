
import { SlashCommandBuilder } from 'discord.js'
import { Card, ForgedInventory, ForgedPrint, ForgedSet, Player } from '../database/index.js'
import { Op } from 'sequelize'
import { isMod } from '../functions/utility.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const {com, rar, sup, ult, scr, AOD, arena} = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('inventory')
		.setDescription('View your inventory! 🏬')
        .addStringOption(str =>
            str
                .setName('set')
                .setDescription('Enter set query.')
				.setAutocomplete(true)
                .setRequired(false)
        )
        .addStringOption(str =>
            str
                .setName('card')
                .setDescription('Enter card query.')
				.setAutocomplete(true)
                .setRequired(false)
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Tag the user to check.')
                .setRequired(false)
        ),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused(true)

                if (focusedValue.name === 'set') {
                    const sets = await ForgedSet.findAll({
                        where: {
                            [Op.or]: {
                                name: {[Op.iLike]: `${focusedValue.value}%`},
                                code: {[Op.iLike]: `${focusedValue.value}%`}
                            }
                        },
                        limit: 5,
                        order: [["createdAt", "DESC"]]
                    })
    
                    await interaction.respond(
                        sets.map(set => ({ name: `${set.name} (${set.code})`, value: set.code })),
                    )
                } else if (focusedValue.name === 'card') {
                    const prints = await ForgedPrint.findAll({
                        where: {
                            cardName: {[Op.iLike]: `${focusedValue.value}%`},
                        },
                        limit: 5,
                        order: [["cardName", "ASC"]]
                    })

                    await interaction.respond(
                        prints.map(print => ({ name: print.cardName, value: print.cardName })),
                    )
                }
            } catch (err) {
                console.log(err)
            }
        },
	async execute(interaction) {
        try {       
            const discordId = interaction.options.getUser('user')?.id || interaction.user.id
            const inspectingOtherUser = discordId !== interaction.user.id
            const userIsMod = isMod(interaction.member)
            if (!userIsMod && inspectingOtherUser) return await interaction.reply({ content: `You do not have permission to do that.` })
            const player = await Player.findByDiscordId(discordId)
            const setCode = interaction.options.getString('set')
            const cardName = interaction.options.getString('card')

            const prints = setCode && cardName ? (
                await ForgedPrint.findAll({ where: { cardName: cardName, forgedSetCode: setCode }, order: [["cardCode", "ASC"]] })
            ) : setCode && !cardName ? (
                await ForgedPrint.findAll({ where: { forgedSetCode: setCode }, order: [["cardCode", "ASC"]]})
            ) : !setCode && cardName ? (
                await ForgedPrint.findAll({ where: { cardName: cardName },  order: [["forgedSetId", "ASC"]]})
            ) : (
                await ForgedPrint.findAll({ order: [["forgedSetId", "ASC"], ["cardCode", "ASC"]] })
            )
 
            const results = [`${player.name}'s Inventory:`]
            const setCodes = []

            for (let i = 0; i < prints.length; i++) {
                const print = prints[i]
                if (!setCodes.includes(print.forgedSetCode)) {
                    const set = await ForgedSet.findOne({ where: { code: print.forgedSetCode } })
                    results.push(`${eval(set.emoji)} --- ${set.name} --- ${eval(set.altEmoji)}`)
                    setCodes.push(print.forgedSetCode)
                }

                const inventory = await ForgedInventory.findOne({
                    where: {
                        playerId: player.id,
                        forgedPrintId: print.id,
                        quantity: {
                            [Op.gte]: 1
                        }
                    }
                })

                if (inventory || cardName) {
                    results.push(`${eval(print.rarity)}${print.cardCode} - ${print.cardName} - ${inventory?.quantity || 0}`)
                } else {
                    continue
                }
            }

            for (let i = 0; i < results.length; i += 30) {
                if (results[i+31] && results[i+31].startsWith("\n")) {
                    interaction.user.send({ content: results.slice(i, i+31).join('\n').toString()})
                    i++
                } else {
                    interaction.user.send({ content: results.slice(i, i+30).join('\n').toString()})
                }
            }

            return interaction.reply({ content: `I messaged you the Inventory you requested.`})
        } catch (err) {
            console.log(err)
        }
	}
}