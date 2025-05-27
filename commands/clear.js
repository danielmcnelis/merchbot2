
import { SlashCommandBuilder } from 'discord.js'
import { isProgrammer } from '../functions/utility.js'

export default {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Admin Only - Delete all posts in a channel. 🙈'),
	async execute(interaction) {
        try {
        	if (!isProgrammer(interaction.member)) {
                return interaction.channel.send({ content: "You do not have permission to do that."})
            } else {
                await interaction.reply({ content: 'Deleting messages, please wait....' })
                return setInterval(() => interaction.channel.bulkDelete(100), 5000) 
            }
        } catch (err) {
            console.log(err)
        }
	}
}