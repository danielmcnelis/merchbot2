
import { SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, Player } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const { com, rar, sup, ult, scr, starchips, stardust, downward, upward } = emojis
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
            const shopBuyingPrice = Math.floor(marketPrice * 0.7) > 0 ? Math.floor(marketPrice * 0.7) : 1			
            const shopSellingPrice = Math.floor(marketPrice * 1.1) > buyingPrice ? Math.floor(marketPrice * 1.1) : buyingPrice + 1
    
            if (!inv) {
                return interaction.reply({ content: `${shopSellingPrice}${stardust}| ${shopBuyingPrice}${stardust}-${card} - Out of Stock${print.trendingUp ? ` - ${upward}` : ''}${print.trendingDown ? ` - ${downward}` : ''}`})
            } else {
                return interaction.reply({ content: `${shopSellingPrice}${stardust}| ${shopBuyingPrice}${stardust}-${card} - ${inv.quantity}${print.trendingUp ? ` - ${upward}` : ''}${print.trendingDown ? ` - ${downward}` : ''}`})
            }
        } catch (err) {
            console.log(err)
        }
	}
}