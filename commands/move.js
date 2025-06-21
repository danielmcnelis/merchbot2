
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Card, ForgedPrint, Status } from '../database/index.js'
import { Op } from 'sequelize'
import { convertDateToYYYYMMDD, isAdmin } from '../functions/utility.js'

export default {
	data: new SlashCommandBuilder()
		.setName('move')
		.setDescription('Admin Only - Move a card on the banlist! 🚨')
        .addStringOption(option =>
            option
                .setName('card')
                .setDescription('Enter search query.')
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('status')
                .setDescription('Select a new status.')
                .setRequired(true)
                .addChoices(
                    { name: 'Forbidden', value: 'forbidden' },
                    { name: 'Limited', value: 'limited' },
                    { name: 'Semi-Limited', value: 'semi-limited' },
                    { name: 'Unlimited', value: 'unlimited' },
                )
        )
    	.setContexts(InteractionContextType.Guild),
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
            if (!isAdmin(interaction.member)) return interaction.reply({ content: "You do not have permission to do that."})
            const cardName = interaction.options.getString('card')
            const card = await Card.findOne({ where: { name: cardName }})
            const newStatus = interaction.options.getString('status')

            const count = await ForgedPrint.count({ where: { cardName: cardName }})
            if (!count) return interaction.reply({ content: `Sorry, ${cardName} does not appear to be in Forged in Chaos.`})

            const oldStatusRow = await Status.findOne({ 
                where: {
                    cardName: cardName,
                    category: 'Forged'
                },
                order: [['createdAt', 'DESC']]
            })

            const oldStatus = oldStatusRow ? oldStatusRow.restriction : 'unlimited'
        
            const timestamp = new Date().getTime()

            const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId(`Move-${timestamp}-Yes`)
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId(`Move-${timestamp}-No`)
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: `Are you sure you wish to move ${cardName} from ${oldStatus} to ${newStatus}?`, components: [row] })

            const filter = i => i.customId.startsWith(`Move-${timestamp}`) && i.user.id === interaction.user.id;

            try {
                const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
                if (confirmation.customId.includes('Yes')) {
                    const today = new Date()
                    const month = today.toLocaleString('default', { month: 'long' })
                    const year = today.getFullYear()
                    
                    await Status.create({
                        cardName: cardName,
                        cardId: card.id,
                        restriction: newStatus,
                        previous: oldStatus,
                        banlist: `${month} ${year}`,
                        date: convertDateToYYYYMMDD(today),
                        category: 'Forged'
                    })
            
                    return await interaction.editReply({ content: `Okay, ${cardName} has been moved from ${oldStatus} to ${newStatus}.`, components: []})
                } else {
                    await interaction.editReply({ content: `Not a problem. ${cardName} will remain ${oldStatus}.`, components: []})
                }
            } catch (err) {
                console.log(err)
                await interaction.editReply({ content: `Sorry, time's up. ${cardName} will remain ${oldStatus}.`, components: []});
            }
        } catch (err) {
            console.log(err)
        }
	}
}