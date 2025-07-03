
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Daily, ForgedInventory, ForgedSet, Player, Stats, Wallet } from '../database/index.js'
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
            
            const invs = await ForgedInventory.findAll({ where: { playerId: player.id }, order: [["cardCode", "ASC"]] })

            for (let i = 0; i < invs.length; i++) {
                const inv = invs[i]
                const quantity = inv.quantity
                const forgedPrintId = inv.forgedPrintId

                const merchbotInv = await ForgedInventory.findOne({
                    where: {
                        forgedPrintId: forgedPrintId,
                        playerId: 'ZXyLL1wTcEZXSZYtegEuTr'
                    }
                })

                if (merchbotInv) {
                    const newQuantity = merchbotInv.quantity + quantity
                    await merchbotInv.update({ quantity: newQuantity })
                } else {
                    await ForgedInventory.create({ 
                        cardName: inv.cardName,
                        cardCode: inv.cardCode,
                        forgedPrintId: forgedPrintId,
                        quantity: quantity,
                        playerName: 'MerchBot',
                        playerId: 'ZXyLL1wTcEZXSZYtegEuTr'
                    })
                }

                console.log(`Donating ${quantity} ${inv.cardCode} to MerchBot.`)
                console.log(`Destroying ${player.name}'s ${inv.cardCode} Inventory.`)
                await inv.destroy()
            }

            player.stats = 500
            player.backup = 0
            player.wins = 0
            player.losses = 0
            player.vanquished_foes = 0
            player.best_stats = 500
            player.current_streak = 0
            player.longest_streak = 0
            player.arena_wins = 0
            player.arena_losses = 0
            player.arena_stats = 500
            player.arena_backup = 0
            player.keeper_wins = 0
            player.keeper_losses = 0
            player.keeper_stats = 500
            player.keeper_backup = 0
            player.draft_wins = 0
            player.draft_losses = 0
            player.draft_stats = 500
            player.draft_backup = 0
            player.gauntlet_wins = 0
            player.gauntlet_losses = 0
            player.gauntlet_stats = 500
            player.gauntlet_backup = 0
            player.pauper_wins = 0
            player.pauper_losses = 0
            player.pauper_stats = 500
            player.pauper_backup = 0
            await player.save()

            const binder = await Binder.findOne({ where: { playerId: player.id }})
            if (binder) await binder.destroy()

            const daily = await Daily.findOne({ where: { playerId: player.id }})
            if (daily) await daily.destroy()

            // const diary = await Diary.findOne({ where: { playerId: player.id }})
            // if (diary) await diary.destroy()

            // const knowledges = await Knowledge.findAll({ where: { playerId: player.id }})
            
            // for (let i = 0; i < knowledges.length; i++) {
            //     const knowledge = knowledges[i]
            //     await knowledge.destroy()
            // }

            // const profile = await Profile.findOne({ where: { playerId: player.id }})
            // if (profile) await profile.destroy()

            const wallet = await Wallet.findOne({ where: { playerId: player.id }})
            if (wallet) await wallet.destroy()

            const wishlist = await Wishlist.findOne({ where: { playerId: player.id }})
            if (wishlist) await wishlist.destroy()

            const date = new Date()
            await Reset.create({ 
                date: date,
                playerId: player.id
            })
            
            player.lastReset = date
            await player.save()

            // return message.channel.send({ content: `Your account has been successfully reset. All your cards and progress have been wiped.`})
            
            await interaction.editReply({ content: `${player.name} began the game! Please check your DMs for your first 24 packs and use the command **/inventory** to view your inventory!` })
            return
        } catch (err) {
            console.log(err)
        }
	}
}