
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { isAdmin } from '../functions/utility.js'
import { closeShop } from '../functions/shop.js'

export default {
	data: new SlashCommandBuilder()
		.setName('close')
		.setDescription('Admin Only - Close The Shop 🌙')
    	.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        try {
            if (!isAdmin(interaction.member)) { 
                return interaction.reply({ content: "You do not have permission to do that."})
            } else {
                await closeShop(interaction)
                return interaction.reply({ content: 'Closing The Shop now.' })
            }
        } catch (err) {
            console.log(err)
        }
	}
}