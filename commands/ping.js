
import { SlashCommandBuilder } from 'discord.js'

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with 🏓!'),
	async execute(interaction) {
        try {
            await interaction.reply({ content: '🏓' })
        } catch (err) {
            console.log(err)
        }
	}
}