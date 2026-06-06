
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
// import { isAdmin } from '../functions/utility.js'
// import { closeShop } from '../functions/shop.js'
import { DraftEntry, Info, Player } from '../database/index.js'
import { initiateDraft } from '../functions/draft.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { draft } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('draft')
		.setDescription('Join The Draft! 🏆')
    	.setContexts(InteractionContextType.Guild),
    async execute(interaction) {
        try {
            const player = await Player.findOne({ where: { discordId: interaction.user.id }})
            const alreadyIn = await DraftEntry.count({ where: { playerId: player.id }})
            
            const isPlaying = await DraftEntry.count({ where: { status: 'playing' }})
            if (isPlaying) return interaction.reply({ content: `Sorry, you cannot leave The Draft ${draft} after you have committed to it.` })
                
            const confirmationsInProgress = await DraftEntry.count({ where: { status: 'confirming' }})
            if (confirmationsInProgress) return interaction.reply({ content: `Sorry, there are already 6 people going through the confirmation process.`})
                
            const draftIsActive = await Info.count({ where: { element: 'draft', status: 'active' }})
            if (draftIsActive) return interaction.reply({ content: `Sorry, you cannot join The Draft queue while there is an active Draft.`})
                
            if (!alreadyIn) {
                const DraftEntry = await DraftEntry.create({ 
                    playerName: player.name,
                    playerId: player.id,
                    status: 'pending',
                    isConfirmed: false
                })

                const count = await DraftEntry.count()
                if (count === 4) {
                    await interaction.reply({ content: `You joined the Draft queue. ${draft}`})
                    return initiateDraft(interaction)
                } else if (count > 4) {
                    await DraftEntry.destroy() 
                    if (confirmationsInProgress) return interaction.reply({ content: `Sorry, there are already 4 people going through the confirmation process.`})
                } else {
                    return interaction.reply({ content: `You joined the Draft queue. ${draft}`})
                }
            } else {
                const DraftEntry = await DraftEntry.findOne({ where: { playerId: player.id }})
                await DraftEntry.destroy()
                return await interaction.reply({ content: `You left the Draft queue. ${draft}`})
            }
        } catch (err) {
            console.log(err)
        }
    }
}