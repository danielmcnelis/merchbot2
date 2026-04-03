
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ForgedPrint, Trade, Transaction } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const { FiC, com, rar, sup, ult, scr } = emojis
import channels from '../static/channels.json' with { type: 'json' }
const { marketPlaceChannelId, botSpamChannelId } = channels

export default {
	data: new SlashCommandBuilder()
		.setName('transactions')
		.setDescription('View transaction history for a card! 📒')
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
            const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`

            const results = [`**__${card} - Transaction History__**`]

            const trades = await Trade.findAll({
                where: {
                    itemName: printId.toString()
                },
                include: Transaction,
                order: [["createdAt", "DESC"]],
                limit: 25
            })
            

            for (let i = 0; i < trades.length; i++) {
                const trade = trades[i]
                results.push(`- Transaction ${trades.length - i} - ${trade.createdAt.toLocaleString()}\n${trade.transaction.description}`)
            }

            for (let i = 0; i < results.length; i += 5) {
                interaction.user.send({ content: results.slice(i, i+5).join('\n').toString()})
            }

            return interaction.reply({ content: `I messaged you the transaction summaries for ${card}. ${FiC}`})            
        } catch (err) {
            console.log(err)
        }
	}
}