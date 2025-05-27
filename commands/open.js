
import { SlashCommandBuilder } from 'discord.js'
import { isAdmin } from '../functions/utility.js'
import { openShop } from '../functions/shop.js'

export default {
	data: new SlashCommandBuilder()
		.setName('open')
		.setDescription('Admin Only - Open The Shop ☀️'),
	async execute(interaction) {
        try {
            if (!isAdmin(interaction.member)) { 
                return interaction.reply({ content: "You do not have permission to do that."})
            } else {
                await openShop(interaction)
                return interaction.reply({ content: 'Opening The Shop now.' })
            }
        } catch (err) {
            console.log(err)
        }
	}
}