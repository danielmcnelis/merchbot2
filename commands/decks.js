
import { SlashCommandBuilder } from 'discord.js'
import arenas from '../static/arenas.json' with { type: 'json' }
const { decks } = arenas 
import { capitalize } from '../functions/utility.js'

export default {
    data: new SlashCommandBuilder()
        .setName('decks')
        .setDescription('Post the Arena decks. 🇬🇧'),
    async execute(interaction) {
        try {
            if (interaction.channel.name !== 'arena') return await interaction.reply({ content: `Try using **/decks** in channels like: <#1378129840691220631>.`})
            console.log('decks', decks)
                const deckUrls = Object.entries(decks).map((e) => `${capitalize(e[0])} - <${e[1].url}>`)            
            return await interaction.reply({ content: `The Arena Decks:\n` + deckUrls.join('\n').toString() })
        } catch (err) {
            console.log(err)
        }
    }
}
