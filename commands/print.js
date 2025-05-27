
import { SlashCommandBuilder } from 'discord.js'
import { Op } from 'sequelize'
import { isAdmin} from '../functions/utility.js'
import { Card, Info, ForgedPrint, ForgedSet } from '../database/index.js'
// import { askForSetToPrint } from '../functions/print.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { com, rar, sup, ult, scr, stardust } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('print')
		.setDescription('Admin Only - Print new cards! 🖨️')
		.addStringOption(str =>
            str
                .setName('name')
                .setDescription('Enter search query.')
				.setAutocomplete(true)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('rarity')
                .setDescription('Select a rarity (optional).')
                .setRequired(false)
                .addChoices(
					{ name: 'Common', value: 'com' },	
					{ name: 'Rare', value: 'rar' },	
					{ name: 'Super Rare', value: 'sup' },	
					{ name: 'Ultra Rare', value: 'ult' },		
					{ name: 'Secret Rare', value: 'scr' },	
			)
        ),
        async autocomplete(interaction) {
            try {
                const focusedValue = interaction.options.getFocused()

                const cards = await Card.findAll({
                    where: {
                        name: {[Op.iLike]: `${focusedValue}%`},
                    },
                    limit: 5,
                    order: [["name", "ASC"]]
                })

                await interaction.respond(
                    cards.map(card => ({ name: card.name, value: card.name })),
                )
            } catch (err) {
                console.log(err)
            }
        },
	async execute(interaction) {
        try {
            if (!isAdmin(interaction.member)) return interaction.reply({ content: `You do not have permission to do that.`})
            const info = await Info.findOne({ where: { element: 'set_to_print' }})
            const set = await ForgedSet.findOne({ where: { code: info?.status }})
            const setCode = set.code
            const currentCount = await ForgedPrint.count({ where: { forgedSetCode: setCode }})
            if (currentCount >= set.size) return interaction.reply({ content: `${currentCount} out of ${set.size} cards have been printed. There is no more room in the set.`})
            
            const cardName = interaction.options.getString('name')
            const card = await Card.findOne({ where: { name: cardName }})
            if (!card) return interaction.reply({ content: `I could not find "${cardName}" in the Format Library database.`})
        
            if (await ForgedPrint.count({ where: { forgedSetCode: setCode, cardName: cardName }})) {
                throw new Error(`${cardName} was already printed in ${setCode}`)
            }

            const currentPrints = await ForgedPrint.findAll({ where: { forgedSetCode: set.code }, order: [["cardSlot", "DESC"]]})
            const cardSlot = currentPrints.length ? currentPrints[0].cardSlot + 1 : set.type === 'core' ? 0 : 1
            const zeros = cardSlot < 10 ? '00' : cardSlot < 100 ? '0' : ''
            const cardCode = `${set.code}-${zeros}${cardSlot}`

            let rarity = interaction.options.getString('rarity')

            if (!rarity) {
                const rarity_matrix = ["scr"]
                if (set.type === 'core') {
                    for (let i = 0; i < set.commons; i++) {
                        rarity_matrix.push("com")
                    }
                
                    for (let i = 0; i < set.rares; i++) {
                        rarity_matrix.push("rar")
                    }
                
                    for (let i = 0; i < set.supers; i++) {
                        rarity_matrix.push("sup")
                    }
                
                    for (let i = 0; i < set.ultras; i++) {
                        rarity_matrix.push("ult")
                    }
                
                    for (let i = 1; i < set.secrets; i++) {
                        rarity_matrix.push("scr")
                    }
            
                    for (let i = 0; i < set.specials; i++) {
                        rarity_matrix.push("sup")
                    }
                }
            
                rarity = rarity_matrix[cardSlot]
            }

            if (!rarity) return interaction.reply({ content: `Something is wrong with the rarity.`})
                console.log('rarity', rarity)
        
            const marketPrice = rarity === 'com' ? 4 :
                rarity === 'rar' ? 12 :
                rarity === 'sup' ? 35 :
                rarity === 'ult' && set.code === "APC" ? 360 :
                rarity === 'ult' ? 202 :
                rarity === 'scr' ? 900 :
                20
        
            const print = {
                cardName: card.name,
                cardId: card.id,
                forgedSetCode: set.code,
                forgedSetName: set.name,
                forgedSetId: set.id,
                cardCode,
                cardSlot,
                rarity,
                marketPrice,
                trendingDown: false,
                trendingUp: false
            }
        
            await ForgedPrint.create(print)
        
            return interaction.reply({ content: `Created a new print: ${eval(rarity)}${cardCode} - ${cardName} - ${stardust}${marketPrice}`})
        } catch (err) {
            console.log(err)
            return interaction.reply({ content: `Error: Unable to print.`})
        }
	}
}