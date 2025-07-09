
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, Player } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const { com, rar, sup, ult, scr, starchips, stardust, falling, rising } = emojis
import channels from '../static/channels.json' with { type: 'json' }
const { marketPlaceChannelId, botSpamChannelId } = channels

export default {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('Display shop inventory and price of a card! 🕌')
		.addNumberOption(option =>
            option
                .setName('print')
                .setDescription('Enter search query.')
				.setAutocomplete(true)
                .setRequired(true)
        )
    	.setContexts(InteractionContextType.Guild),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const prints = await ForgedPrint.findAll({
                    where: {
                        [Op.or]: {
                            cardName: {[Op.iLike]: `%${focusedValue}%`},
                            cardCode: {[Op.iLike]: `%${focusedValue}%`}
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
            const printId = interaction.options.getNumber('print')
            const print = await ForgedPrint.findOne({ where: { id: printId }})
            const merchbot = await Player.findOne({ where: { discordId: '584215266586525696' }})
    
            const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`
            const inv = await ForgedInventory.findOne({ where: {
                forgedPrintId: print.id,
                playerId: merchbot.id,
                quantity: { [Op.gt]: 0 }
            }})
        
            const marketPrice = print.marketPrice
            const shopBuyingFactor = print.isFrozen ? 1 : 0.7
            const shopBuyingPrice = Math.floor(print.marketPrice * shopBuyingFactor) > 0 ? Math.floor(print.marketPrice * shopBuyingFactor) : 1	
            const shopSellingPrice = Math.floor(marketPrice * 1.1) > shopBuyingPrice ? Math.floor(marketPrice * 1.1) : shopBuyingPrice + 1
    
            const symbol = print.isFrozen ? '- ❄️' : print.trendingUp ? `- ${rising}` : print.trendingDown ? `- ${falling}` : ''

            if (!inv) {
                return interaction.reply({ content: `${shopSellingPrice}${stardust}| ${shopBuyingPrice}${stardust}-${card} - Out of Stock${symbol}`})
            } else {
                return interaction.reply({ content: `${shopSellingPrice}${stardust}| ${shopBuyingPrice}${stardust}-${card} - ${inv.quantity}${symbol}`})
            }
        } catch (err) {
            console.log(err)
        }
	}
}