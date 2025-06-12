
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
// import { isAdmin } from '../functions/utility.js'
// import { closeShop } from '../functions/shop.js'
import { ArenaEntry, Player } from '../database/index.js'
import { initiateArena } from '../functions/arena.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { arena } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('drop')
		.setDescription('Drop out of The Arena.')
    	.setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        try {
            if (interaction.channel.id !== '1378129840691220631') return await interaction.reply({ content: `Try using **/arena** in the <#1378129840691220631> channel. ${arena}`})
            const player = await Player.findOne({ where: { discordId: interaction.user.id }})
            const entry = await ArenaEntry.findOne({ where: { playerId: player.id }})
            if (!entry) return interaction.reply({ content: `Hmm, it seems you are not in The Arena. ${arena}`})
            if (!entry.isActive) return interaction.reply({ content: `Hmmm, it seems that you already dropped from The Arena. ${arena}` })            
            if (entry.isPlaying) return interaction.reply({ content: `Sorry, you cannot drop out of The Arena ${arena} while you are playing. Ask a mod for a no-show.` })
            await entry.update({ isActive: false })
            return interaction.reply({ content: `You dropped out of The Arena. ${arena} We hope to see you again.` })
        } catch (err) {
            console.log(err)
        }
    }
}