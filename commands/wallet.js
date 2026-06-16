
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Player, Wallet } from '../database/index.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const {FiC, stardust, starchips, amulets, bolts, cacti, crowns, orbs, sandals, feathers, gems, lotuses, capes, nets, roses } = emojis

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
            // if (wallet.amulets) results.push(`Amulets: ${wallet.amulets}${amulets}`)
            // if (wallet.bolts) results.push(`Bolts: ${wallet.bolts}${bolts}`)
            // if (wallet.cacti) results.push(`Cacti: ${wallet.cacti}${cacti}`)
            if (wallet.capes) results.push(`Capes: ${wallet.capes}${capes}`)
            // if (wallet.crowns) results.push(`Crowns: ${wallet.crowns}${crowns}`)
            if (wallet.feathers) results.push(`Feathers: ${wallet.feathers}${feathers}`)
            if (wallet.gems) results.push(`Gems: ${wallet.gems}${gems}`)
            if (wallet.lotuses) results.push(`Lotuses: ${wallet.lotuses}${lotuses}`)
            if (wallet.nets) results.push(`Nets: ${wallet.nets}${nets}`)
            // if (wallet.orbs) results.push(`Orbs: ${wallet.orbs}${orbs}`)
            if (wallet.roses) results.push(`Roses: ${wallet.roses}${roses}`)
            // if (wallet.sandals) results.push(`Sandals: ${wallet.sandals}${sandals}`)
        
            return await interaction.reply({ content: results.join('\n').toString()})
        } catch (err) {
            console.log(err)
        }
	}
}