
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { ForgedPrint } from '../database/index.js'
import { Op } from 'sequelize'
import emojis from '../static/emojis.json' with { type: "json" } 
import { isAdmin } from '../functions/utility.js'
const { com, rar, sup, ult, scr, stardust } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('freeze')
		.setDescription('Admin Only - Freeze the price of a card. ❄️')
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
            
            const printId = interaction.options.getNumber('print')
            const print = await ForgedPrint.findOne({ where: { id: printId }})
            if (!print) return await interaction.reply({ content: `Sorry, I could not find that print.`})

            const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`

            const timestamp = new Date().getTime()

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Freeze-${timestamp}-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Freeze-${timestamp}-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            if (!print.isFrozen) {
                await interaction.reply({ content: `${card} is valued at ${print.marketPrice}${emojis.stardust}, do you wish to **freeze** the price? ❄️`, components: [row] })
            } else {
                await interaction.reply({ content: `${card} is valued at ${print.marketPrice}${emojis.stardust}, do you wish to **unfreeze** the price? ☀️`, components: [row] })
            }

            const filter = i => i.customId.startsWith(`Adjust-${timestamp}`) && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 60000 });
                    
                if (confirmation.customId.includes('Yes')) {
                    await print.update({ isFrozen: !print.isFrozen })
                    await confirmation.update({ content: `The price of ${card} has been ${print.isFrozen ? 'frozen' : 'unfrozen'}.`, components: [] })
                } else {
                    return await confirmation.update({ content: 'Not a problem. Nothing will be frozen/unfozen.', components: [] })
                }
            } catch (err) {
                await interaction.editReply({ content: 'Nothing will be frozen/unfozen.', components: [] });
            }
        } catch (err) {
            console.log(err)
        }
	}
}