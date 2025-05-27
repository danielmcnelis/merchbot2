
import { SlashCommandBuilder } from 'discord.js'
import { Daily, ForgedSet, Player, Wallet } from '../database/index.js'
import { awardPacks } from '../functions/packs.js'

export default {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play the game! 🎮'),
	async execute(interaction) {
        try {
            await interaction.deferReply()
            // console.log('interaction.member', interaction.member)
            const player = await Player.findByDiscordId(interaction.member.user.id)
            const walletExists = await Wallet.count({ where: { playerId: player.id }})
            if (walletExists) return await interaction.reply({ content: `Error: You already began the game!` })
            await Wallet.create({ playerId: player.id, playerName: player.name })
            await Daily.create({ playerId: player.id, playerName: player.name })
            const set = await ForgedSet.findOne({ where: { code: 'AOD' }})
            await awardPacks(interaction, interaction.member, set, 10)
            await interaction.editReply({ content: `${player.name} began the game! Please check your DMs for your first 10 packs, then try out the command **/inventory**!` })
        } catch (err) {
            console.log(err)
        }
	}
}