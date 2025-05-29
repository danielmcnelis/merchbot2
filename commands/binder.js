
import { SlashCommandBuilder } from 'discord.js'
import {ForgedPrint, Binder, Player, ForgedInventory} from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const {com, rar, sup, ult, scr, binder_emoji} = emojis
import channels from '../static/channels.json' with { type: 'json' }
const { marketPlaceChannelId, botSpamChannelId } = channels

export default {
	data: new SlashCommandBuilder()
		.setName('binder')
		.setDescription(`Add a card to your binder or view someone else's! 📔`)
        .addNumberOption(option =>
            option
                .setName('print')
                .setDescription('Enter search query.')
                .setAutocomplete(true)
                .setRequired(false)
        )
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('Tag the player to check.')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('empty')
                .setDescription('Empty entire binder.')
                .setRequired(false)
                .addChoices(
                    { name: 'Yes', value: 'yes' },
                    { name: 'No', value: 'no' },
                )
        ),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const prints = await ForgedPrint.findAll({
                    where: {
                        [Op.or]: {
                            cardName: {[Op.iLike]: `${focusedValue}%`},
                            cardCode: {[Op.iLike]: `${focusedValue}%`}
                        }
                    },
                    limit: 5,
                    order: [["cardName", "ASC"], ["createdAt", "ASC"]]
                })

                await interaction.respond(
                    prints.map(print => ({ name: `${print.cardName} (${print.cardCode})`, value: print.id })),
                )
            } catch (err) {
                console.log(err)
            }
        },
	async execute(interaction) {
        try {
            if (interaction.channel.id !== botSpamChannelId && interaction.channel.id !== marketPlaceChannelId) return interaction.reply({ content: `Command not valid outside of <#${marketPlaceChannelId}> or <#${botSpamChannelId}>.` })
            const user = interaction.options.getUser('player')
            const printId = interaction.options.getNumber('print')
            const empty = interaction.options.getString('empty')

            if (user) {
                const player = await Player.findByDiscordId(user.id)
                const prints = [...await Binder.findAll({
                    where: {
                        playerId: player.id
                    },
                    include: ForgedPrint,
                    order: [[ForgedPrint, "createdAt", "DESC"], ["cardCode", "ASC"]]
                })].map((b) => b.forgedPrint)

                const results = prints.map((print) => `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`)
                return interaction.reply({ content: `**${player.name}'s Binder ${binder_emoji}**\n${results.join('\n')}`})
            } else if (!user && printId) {
                const player = await Player.findByDiscordId(interaction.user.id)
                const print = await ForgedPrint.findOne({ where: { id: printId }})
                const binder = await Binder.findOne({ where: { playerId: player.id, forgedPrintId: printId } })
                if (binder) {
                    await binder.destroy()
                    return interaction.reply({ content: `You removed ${`${eval(print.rarity)}${print.cardCode} - ${print.cardName}`} from your binder. ${binder_emoji}` }) 
                } else {
                    const count = await Binder.count({ where: { playerId: player.id } }) 
                    if (count >= 9) return interaction.reply({ content: `You cannot have more than 9 cards in your binder. ${binder_emoji}`})
                    const inventory = await ForgedInventory.findOne({
                        where: {
                            quantity: {[Op.gte]: 1},
                            forgedPrintId: print.id,
                            playerId: player.id
                        }
                    })

                    if (inventory) {
                        await Binder.create({
                            cardName: print.cardName,
                            cardCode: print.cardCode,
                            forgedPrintId: print.id,
                            playerName: player.name,
                            playerId: player.id
                        })
    
                        return interaction.reply({ content: `You added ${`${eval(print.rarity)}${print.cardCode} - ${print.cardName}`} to your binder! ${binder_emoji}` }) 
                    } else {
                        return interaction.reply({ content: `You do not own any copies of ${`${eval(print.rarity)}${print.cardCode} - ${print.cardName}`}.` }) 
                    }
                }
            } else if (!user && !printId && empty !== 'yes') {
                const player = await Player.findByDiscordId(interaction.user.id)
                const prints = [...await Binder.findAll({
                    where: {
                        playerId: player.id
                    },
                    include: ForgedPrint,
                    order: [["cardCode", "ASC"]]
                })].map((b) => b.forgedPrint)

                const results = prints.map((print) => `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`)
                return interaction.reply({ content: `**${player.name}'s Binder ${binder_emoji}**\n${results.join('\n')}`})
            } else if (!user && !printId && empty === 'yes') {
                const player = await Player.findByDiscordId(interaction.user.id)
                const binders = await Binder.findAll({ where: { playerId: player.id }})
                for (let i = 0; i < binders.length; i++) {
                    await binders[i].destroy()
                }

                return interaction.reply({ content: `You emptied your entire binder! ${binder_emoji}`})
            }
        } catch (err) {
            console.log(err)
        }
	}
}