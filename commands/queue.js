
import { SlashCommandBuilder } from 'discord.js'
import { ArenaEntry } from '../database/index.js'

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Post the Arena queue. 🇬🇧'),
    async execute(interaction) {
        try {
            if (interaction.channel.name !== 'arena') return await interaction.reply({ content: `Try using **/queue** in channels like: <#1378129840691220631>.`})
            const queue = [...await ArenaEntry.findAll()].map((entry) => entry.playerName)
            
            if (!queue.length) {
                return await interaction.reply({ content: `The Arena queue is empty.`})
            } else {
                return await interaction.reply({ content: `The Arena Queue:\n` + queue.join('\n').toString() })
            }
        } catch (err) {
            console.log(err)
        }
    }
}
