
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Player, Wallet } from '../database/index.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const {FiC, stardust, starchips, amulets, bolts, cacti, crowns, orbs, sandals } = emojis

export default {
	data: new SlashCommandBuilder()
		.setName('wallet')
		.setDescription('Inspect someone\'s wallet! 👛')
        .addUserOption(option =>
            option
                .setName('player')
                .setDescription('The player you want to check.')
                .setRequired(false)
        )
    	.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        try {
            const user = interaction.options.getUser('player') || interaction.user
            const player = await Player.findOne({ where: { discordId: user?.id } })
            const wallet = await Wallet.findOne({ where: { playerId: player.id }, include: Player})
            if (!wallet && player.id === interaction.user.id) return await interaction.reply({ content: `You are not in the database. Type **/play** to begin the game.`})
            if (!wallet && player.id !== interaction.user.id) return await interaction.reply({ content: `That user is not in the database.`})
        
            const results = [`${FiC} --- ${wallet.playerName}'s Wallet --- ${FiC}`]
            results.push(`Starchips: ${wallet.starchips}${starchips}`)
            results.push(`Stardust: ${wallet.stardust}${stardust}`)
            if (wallet.amulets) results.push(`Droplets: ${wallet.amulets}${amulets}`)
            if (wallet.bolts) results.push(`Mushrooms: ${wallet.bolts}${bolts}`)
            if (wallet.cacti) results.push(`Gems: ${wallet.cacti}${cacti}`)
            if (wallet.crowns) results.push(`Beads: ${wallet.crowns}${crowns}`)
            if (wallet.orbs) results.push(`Familiars: ${wallet.orbs}${orbs}`)
            if (wallet.sandals) results.push(`Bolts: ${wallet.sandals}${sandals}`)
        
            return await interaction.reply({ content: results.join('\n').toString()})
        } catch (err) {
            console.log(err)
        }
	}
}