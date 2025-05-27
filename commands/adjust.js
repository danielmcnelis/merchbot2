
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { ForgedPrint } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: "json" } 
import { isAdmin } from '../functions/utility.js'
const { com, rar, sup, ult, scr, stardust } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('adjust')
		.setDescription('Admin Only - Adjust price of a card. 🧮')
		.addNumberOption(option =>
            option
                .setName('print')
                .setDescription('Enter search query.')
				.setAutocomplete(true)
                .setRequired(true)
        )
        .addNumberOption(option =>
            option
                .setName('price')
                .setDescription('Enter new price.')
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
            if (!isAdmin(interaction.member)) return await interaction.reply({ content: "You do not have permission to do that."})
            
            const newPrice = interaction.options.getNumber('price')
            const printId = interaction.options.getNumber('print')
            const print = await ForgedPrint.findOne({ where: { id: printId }})
            if (!print) return await interaction.reply({ content: `Sorry, I could not find that print.`})

            const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Adjust-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Adjust-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `${card} is valued at ${print.marketPrice}${emojis.stardust}, do you wish to change it to ${newPrice}${emojis.stardust}?`, components: [row] })

            const filter = i => i.customId.startsWith('Adjust-') && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 60000 });
                    
                if (confirmation.customId.includes('Yes')) {
                    await print.update({ marketPrice: newPrice })
                    await confirmation.update({ content: `The price of ${card} has been changed to ${newPrice}${stardust}`, components: [] })
                } else {
                    return await confirmation.update({ content: 'Not a problem. No price change will be made.', components: [] })
                }
            } catch (err) {
                await interaction.editReply({ content: 'No price change will be made.', components: [] });
            }
        } catch (err) {
            console.log(err)
        }
	}
}