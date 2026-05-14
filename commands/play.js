
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Daily, ForgedSet, Player, Stats, Wallet } from '../database/index.js'
import { sendInventoryYDK } from '../functions/decks.js'
import { awardPacks, awardBox } from '../functions/packs.js'

export default {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play the game! 🎮')
    	.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        try {
            await interaction.deferReply()
            const player = await Player.findByDiscordId(interaction.member.user.id)
            const walletExists = await Wallet.count({ where: { playerId: player.id }})
            if (walletExists) return await interaction.reply({ content: `Error: You already began the game!` })
            await Daily.create({ playerId: player.id, playerName: player.name })
            await Stats.create({ 
                playerId: player.id, 
                playerName: player.name, 
                formatName: 'Forged in Chaos', 
                formatId: 197, 
                elo: 400, 
                bestElo: 400, 
                classicElo: 400, 
                seasonalElo: 400, 
                bestSeasonalElo: 400, 
                serverId: '414551319031054346' 
            })

            function daysSince(previousDate) {
                const currentDate = new Date()
                const previousTime = previousDate.getTime()
                const currentTime = currentDate.getTime()
                const differenceInMilliseconds = currentTime - previousTime
                const daysDifference = Math.floor(differenceInMilliseconds / (1000 * 60 * 60 * 24))
                return daysDifference
              }
              
            const previousDate = new Date('2026-05-13')
            const days = daysSince(previousDate)
            let starchips = 50 + (10 * days)
            if (starchips > 600) starchips = 600
            let stardust = 100 + 100 * days
            if (stardust > 6000) stardust = 6000
            await Wallet.create({ playerId: player.id, playerName: player.name, starchips, stardust })

            const set = await ForgedSet.findOne({ where: { code: 'LDM' }})
            // await interaction.editReply({ content: `${player.name} began the game! Please check your DMs for your first 12 packs, then use the command **/inventory** to view your inventory! Also, make sure to read <#1488566625690194075> and check out **/wallet**!` })
            await interaction.editReply({ content: `${player.name} began the game! Please check your DMs for your first 8 packs and a YDK file of your starting inventory! Also, make sure to read <#1488566625690194075> and check out **/wallet**!` })
            await awardPacks(interaction.channel, interaction.member, set, 8)
            // await awardBox(interaction.channel, interaction.member, set, 24)
            return await sendInventoryYDK(interaction, player)
        } catch (err) {
            console.log(err)
        }
	}
}