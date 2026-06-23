
import { SlashCommandBuilder } from 'discord.js'
import { ForgedInventory, ForgedPrint, ForgedSet, Player } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: 'json' }
const { AOD, COC, CTP, FON, LDM, WCR, greenmark, com, emptybox, rar, scr, sup, tres, ult, arena } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('pricelist')
		.setDescription('View the price list for a set. 📋')
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

            const allPrints = await ForgedPrint.findAll({ 
                where: {
                    forgedSetCode: setCode
                },
                order: [['marketPrice', 'DESC']]
            })

            if (!allPrints) return interaction.reply({ content: `No prints found in the database.`})

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
        
                const symbol = print.isFrozen ? ' - ❄️' : print.trendingUp ? ` - ${rising}` : print.trendingDown ? ` - ${falling}` : ''

                if (!inv) {
                    results.push(`${shopSellingPrice}${stardust}| ${shopBuyingPrice}${stardust}-${card} - Out of Stock${symbol}`)
                } else {
                    results.push(`${shopSellingPrice}${stardust}| ${shopBuyingPrice}${stardust}-${card} - ${inv.quantity}${symbol}`)
                }
            }

            for (let i = 0; i < results.length; i += 20) {
                if (results[i+21] && results[i+21].startsWith("\n")) {
                    interaction.user.send({ content: results.slice(i, i+21).join('\n').toString()})
                    i++
                } else {
                    interaction.user.send({ content: results.slice(i, i+20).join('\n').toString()})
                }
            }

            return interaction.reply({ content: `I messaged you the Price List you requested.`})
        } catch (err) {
            console.log(err)
        }
	}
}