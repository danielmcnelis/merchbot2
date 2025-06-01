
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import {ForgedPrint, Wishlist, Player} from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const {com, rar, sup, ult, scr, wishlist_emoji} = emojis
import channels from '../static/channels.json' with { type: 'json' }
const { marketPlaceChannelId, botSpamChannelId } = channels

export default {
	data: new SlashCommandBuilder()
		.setName('wishlist')
		.setDescription(`Add a card to your wishlist or view someone else's! 📜`)
        .addNumberOption(option =>
            option
                .setName('print')
                .setDescription('Enter search query.')
                .setAutocomplete(true)
                .setRequired(false)
        )
        .addNumberOption(option =>
            option
                .setName('quantity')
                .setDescription('How many do you want to acquire?')
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
                .setDescription('Delete entire wishlist.')
                .setRequired(false)
                .addChoices(
                    { name: 'Yes', value: 'yes' },
                    { name: 'No', value: 'no' },
                )
        )
    	.setContexts(InteractionContextType.Guild),
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
            const quantity = interaction.options.getNumber('quantity') || 1
            const empty = interaction.options.getString('empty')

            if (user) {
                const player = await Player.findByDiscordId(user.id)
                const prints = [...await Wishlist.findAll({
                    where: {
                        playerId: player.id
                    },
                    include: ForgedPrint,
                    order: [[ForgedPrint, "createdAt", "DESC"], ["cardCode", "ASC"]]
                })].map((b) => b.forgedPrint)

                const results = prints.map((print) => `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`)
                return interaction.reply({ content: `**${player.name}'s Wishlist ${wishlist_emoji}**\n${results.join('\n')}`})
            } else if (!user && printId) {
                const player = await Player.findByDiscordId(interaction.user.id)
                const print = await ForgedPrint.findOne({ where: { id: printId }})
                const wishlist = await Wishlist.findOne({ where: { playerId: player.id, forgedPrintId: printId } })
                if (wishlist) {
                    await wishlist.destroy()
                    return interaction.reply({ content: `You removed ${`${eval(print.rarity)}${print.cardCode} - ${print.cardName}`} from your wishlist. ${wishlist_emoji}` }) 
                } else {
                    const count = await Wishlist.count({ where: { playerId: player.id } }) 
                    if (count >= 10) return interaction.reply({ content: `You cannot have more than 10 cards on your wishlist. ${wishlist_emoji}`})
                    const inventory = await ForgedInventory.findOne({
                        where: {
                            forgedPrintId: print.id,
                            playerId: player.id
                        }
                    })

                    if (inventory && ((inventory.quantity + quantity) > 3)) {
                        return interaction.reply({ content: `You cannot acquire more than 3 copies of a card.` }) 
                    } else {
                        await Wishlist.create({
                            cardName: print.cardName,
                            cardCode: print.cardCode,
                            quantity: quantity,
                            forgedPrintId: print.id,
                            playerName: player.name,
                            playerId: player.id
                        })
    
                        return interaction.reply({ content: `You added ${`${eval(print.rarity)}${print.cardCode} - ${print.cardName}`} to your wishlist! ${wishlist_emoji}` }) 
                    }
                }
            } else if (!user && !printId && empty !== 'yes') {
                const player = await Player.findByDiscordId(interaction.user.id)
                const prints = [...await Wishlist.findAll({
                    where: {
                        playerId: player.id
                    },
                    include: ForgedPrint,
                    order: [["cardCode", "ASC"]]
                })].map((b) => b.forgedPrint)

                const results = prints.map((print) => `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`)
                return interaction.reply({ content: `**${player.name}'s Wishlist ${wishlist_emoji}**\n${results.join('\n')}`})
            } else if (!user && !printId && empty === 'yes') {
                const player = await Player.findByDiscordId(interaction.user.id)
                const wishlists = await Wishlist.findAll({ where: { playerId: player.id }})
                for (let i = 0; i < wishlists.length; i++) {
                    await wishlists[i].destroy()
                }

                return interaction.reply({ content: `You deleted your entire wishlist! ${wishlist_emoji}`})
            }
        } catch (err) {
            console.log(err)
        }
	}
}