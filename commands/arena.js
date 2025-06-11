
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
// import { isAdmin } from '../functions/utility.js'
// import { closeShop } from '../functions/shop.js'
import { ArenaEntry, Player } from '../database/index.js'
import { initiateArena } from '../functions/arena.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { arena } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('arena')
		.setDescription('Join The Arena! 🏆')
    	.setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        try {
            if (interaction.channel.id !== '1378129840691220631') return await interaction.reply({ content: `Try using **/arena** in the <#1378129840691220631> channel. ${arena}`})
            const player = await Player.findOne({ where: { discordId: interaction.user.id }})
            const alreadyIn = await ArenaEntry.count({ where: { playerId: player.id }})
            
            const isPlaying = await ArenaEntry.count({ where: { status: 'playing' }})
            if (isPlaying) return interaction.reply({ content: `Sorry, you cannot leave The Arena ${arena} after you have committed to it.` })
                
            const confirmationsInProgress = await ArenaEntry.count({ where: { status: 'confirming' }})
            if (confirmationsInProgress) return interaction.reply({ content: `Sorry, there are already 6 people going through the confirmation process.`})
                
            if (!alreadyIn) {
                const arenaEntry = await ArenaEntry.create({ 
                    playerName: player.name,
                    playerId: player.id,
                    status: 'pending',
                    isConfirmed: false
                })

                const count = await ArenaEntry.count()
                if (count === 6) {
                    await interaction.reply({ content: `You joined the Arena queue. ${arena}`})
                    return initiateArena(interaction)
                } else if (count > 6) {
                    await arenaEntry.destroy() 
                    if (confirmationsInProgress) return interaction.reply({ content: `Sorry, there are already 6 people going through the confirmation process.`})
                } else {
                    return interaction.reply({ content: `You joined the Arena queue. ${arena}`})
                }
            } else {
                const arenaEntry = await ArenaEntry.findOne({ where: { playerId: player.id }})
                await arenaEntry.destroy()
                return await interaction.reply({ content: `You left the Arena queue. ${arena}`})
            }
        } catch (err) {
            console.log(err)
        }
    }
}