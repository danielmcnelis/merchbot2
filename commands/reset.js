
import { InteractionContextType, SlashCommandBuilder } from 'discord.js'
import { Op } from 'sequelize'
import { Daily, ForgedInventory, ForgedSet, Player, Stats, Wallet } from '../database/index.js'
import { sendInventoryYDK } from '../functions/decks.js'
import { awardPacks, awardBox } from '../functions/packs.js'

export default {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription('Reset the game! 🆕')
    	.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
        try {
            await interaction.deferReply()
            const player = await Player.findByDiscordId(interaction.member.user.id)
            const fourteenDaysAgo = new Date(Date.now() - (14 * 24 * 60 * 60 * 1000))
            const count = await Wallet.findOne({ 
                where: {
                    playerId: player.id,
                    createdAt: {[Op.gte]: fourteenDaysAgo }
                }
            })

            if (count) return await interaction.editReply({ content: `Sorry, you are only allowed one reset every 14 days.` })
            
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

            const binders = await Binder.findAll({ where: { playerId: player.id }})
            for (let i = 0; i < binders.length; i++) {
                const binder = binders[i]
                await binder.destroy()
            }

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

            const wishlists = await Wishlist.findAll({ where: { playerId: player.id }})
            for (let i = 0; i < wishlists.length; i++) {
                const wishlist = wishlists[i]
                await wishlist.destroy()
            }

            return interaction.editReply({ content: `Your account has been successfully reset. All your cards have been donated to The Shop. Type **/play** to begin the game again`})    
        } catch (err) {
            console.log(err)
        }
	}
}