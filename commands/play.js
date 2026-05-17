
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Daily, ForgedSet, Player, Stats, Wallet } from '../database/index.js'
import { sendInventoryYDK } from '../functions/decks.js'
import { awardFirstEightPacks, awardPacks, awardBox } from '../functions/packs.js'

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
            if (walletExists) return await interaction.editReply({ content: `Error: You already began the game!` })
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
                let daysDifference = Math.floor(differenceInMilliseconds / (1000 * 60 * 60 * 24))
                if (daysDifference < 0) daysDifference = 0
                console.log('daysDifference', daysDifference)
                return daysDifference
            }
              
            const previousDate = new Date('2026-05-15 00:05:00+00')
            const days = daysSince(previousDate)
            let starchips = 10 + (20 * (days - 1))
            if (starchips > 500) starchips = 500
            let stardust = 100 + (200 * (days - 1))
            if (stardust > 5000) stardust = 5000
            await Wallet.create({ playerId: player.id, playerName: player.name, starchips, stardust })

            const set = await ForgedSet.findOne({ where: { code: 'LDM' }})
            // await interaction.editReply({ content: `${player.name} began the game! Please check your DMs for your first 12 packs, then use the command **/inventory** to view your inventory! Also, make sure to read <#1488566625690194075> and check out your **/wallet**!` })
            await interaction.editReply({ content: `${player.name} began the game! Please check your DMs for your first 8 packs and a YDK file of your starting inventory! Also, make sure to read <#1488566625690194075> and check out your **/wallet**!` })
            await awardFirstEightPacks(interaction.channel, interaction.member, set)
            // await awardBox(interaction.channel, interaction.member, set, 24)
            return await sendInventoryYDK(interaction, player)
        } catch (err) {
            console.log(err)
        }
	}
}