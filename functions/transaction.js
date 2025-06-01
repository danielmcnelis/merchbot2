
import { Binder, Wishlist, Card, ForgedInventory, ForgedSet, Player, ForgedPrint, Wallet, Info, Auction, Status } from '../database/index.js'
const merchbotId = '584215266586525696'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { Op } from 'sequelize'
// const { yescom } = require('../static/commands.json')
import emojis from '../static/emojis.json' with { type: 'json' }
const { gem, orb, swords, starchips, stardust, merchant, fry, mushroom, moai, rose, hook, egg, cactus, com, rar, sup, ult, scr, familiar, skull, battery, hmmm } = emojis
import { updateBinder } from './binder.js'
import { awardPacksToShop } from './packs.js'
const adminId = '194147938786738176'
import { client } from '../static/clients.js'
import { findCard } from './search.js'
import { selectPrint } from './print.js'
import { capitalize } from './utility.js'
// import { completeTask } from './diary.js'

const processTradeComponent = async (interaction, sender, recipient, quantity, print) => {
    const senderInv = await ForgedInventory.findOne({
        where: {
            forgedPrintId: print.id,
            playerId: sender.id
        }
    })

    if (senderInv.quantity < quantity) await interaction.channel.send(`ALERT: <@${sender.discordId}> no longer has ${quantity}${eval(print.rarity)}${print.cardCode} - ${print.cardName}.`)

    let recipientInv = await ForgedInventory.findOne({
        where: {
            forgedPrintId: print.id,
            playerId: recipient.id
        }
    })

    if (recipientInv) {
        recipientInv.quantity+=quantity
        await recipientInv.save()
    } else {
        recipientInv = await ForgedInventory.create({
            cardName: print.cardName,
            cardCode: print.cardCode,
            forgedPrintId: print.id,
            quantity: quantity,
            playerName: recipient.name,
            playerId: recipient.id
        })
    }
    

    senderInv.quantity-=quantity
    await senderInv.save()

    console.log('senderInv.quantity', senderInv.quantity)
    console.log('sender.id', sender.id)
    console.log('print.id', print.id)
    console.log('quantity', quantity)
    const binder = await Binder.findOne({
        where: {
            playerId: sender.id,
            forgedPrintId: print.id
        }
    })
    
    if (binder) {
        console.log('binder.quantity', binder.quantity)
        binder.quantity-=quantity
        await binder.save()
        console.log('binder.quantity', binder.quantity)
    
        if (binder.quantity <= 0) {
            console.log('!!binder', !!binder)
            await binder.destroy()
            console.log('destroyed binder')
        }
    }

    console.log('recipient.quantity', recipientInv.quantity)
    console.log('recipient.id', recipient.id)
    console.log('print.id', print.id)
    console.log('quantity', quantity)
    const wishlist = await Wishlist.findOne({
        where: {
            playerId: recipient.id,
            forgedPrintId: print.id
        }
    })
    
    if (wishlist) {
        console.log('wishlist.quantity', wishlist.quantity)
        wishlist.quantity-=quantity
        await wishlist.save()
        console.log('wishlist.quantity', wishlist.quantity)
    
        if (wishlist.quantity <= 0) {
            console.log('!!wishlist', !!wishlist)
            await wishlist.destroy()
            console.log('destroyed wishlist')
        }
    }

    return console.log(`${sender.name} traded ${quantity} ${print.cardCode} - ${print.cardName} to ${recipient.name}`)
}



//GET TRADER B PACKAGE
export const getTraderBConfirmation = async (interaction, proposalA, proposalB, traderA, traderB, traderAPackageSummary, traderBPackageSummary) => {
    const row = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
            .setCustomId(`Review-Trade-2of2-Yes`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Primary)
        )

        .addComponents(new ButtonBuilder()
            .setCustomId(`Review-Trade-2of2-No`)
            .setLabel('No')
            .setStyle(ButtonStyle.Primary)
        )

    await interaction.channel.send({ content: `<@${traderB.discordId}>, Please review both sides of the trade proposal with ${traderA.name} and then confirm "Yes" or "No" that you wish to trade. ${hmmm}\nYou will send:\n${traderBPackageSummary.join('\n')}\n\nYou will receive:\n${traderAPackageSummary.join('\n')}`, components: [row] })

    const filter = i => i.customId.startsWith('Review-Trade-2of2-') && i.user.id === traderB.discordId
    
    try {
        const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
        if (confirmation.customId.includes('Yes')) {
            // const processTradeComponent = async (interaction, sender, recipient, quantity, print) => {

            // PROCESS PROPOSAL A PRINT A TRADE COMPONENT
            const proposalAPrintA = await ForgedPrint.findOne({ where: { id: proposalA.forgedPrintAId }})
            const proposalAQuantityA = proposalA.quantityA
            await processTradeComponent(interaction, traderA, traderB, proposalAQuantityA, proposalAPrintA)

            if (proposalA.forgedPrintBId) {
                // PROCESS PROPOSAL A PRINT B TRADE COMPONENT
                const proposalAPrintB = await ForgedPrint.findOne({ where: { id: proposalA.forgedPrintBId }})
                const proposalAQuantityB = proposalA.quantityB
                await processTradeComponent(interaction, traderA, traderB, proposalAQuantityB, proposalAPrintB)
            }

            if (proposalA.forgedPrintCId) {
                // PROCESS PROPOSAL A PRINT C TRADE COMPONENT
                const proposalAPrintC = await ForgedPrint.findOne({ where: { id: proposalA.forgedPrintCId }})
                const proposalAQuantityC = proposalA.quantityC
                await processTradeComponent(interaction, traderA, traderB, proposalAQuantityC, proposalAPrintC)
            }

            if (proposalA.forgedPrintDId) {
                // PRODESS PROPOSAL A PRINT D TRADE DOMPONENT
                const proposalAPrintD = await ForgedPrint.findOne({ where: { id: proposalA.forgedPrintDId }})
                const proposalAQuantityD = proposalA.quantityD
                await processTradeComponent(interaction, traderA, traderB, proposalAQuantityD, proposalAPrintD)
            }

            if (proposalA.forgedPrintEId) {
                // PROEESS PROPOSAL A PRINT E TRAEE EOMPONENT
                const proposalAPrintE = await ForgedPrint.findOne({ where: { id: proposalA.forgedPrintEId }})
                const proposalAQuantityE = proposalA.quantityE
                await processTradeComponent(interaction, traderA, traderB, proposalAQuantityE, proposalAPrintE)
            }

            if (proposalA.stardustQuantity) {
                const traderAWallet = await Wallet.findOne({ where: { playerId: traderA.id }})
                const traderBWallet = await Wallet.findOne({ where: { playerId: traderB.id }})
                traderAWallet.stardust-=proposalA.stardustQuantity
                await traderAWallet.save()
                traderBWallet.stardust+=proposalA.stardustQuantity
                await traderBWallet.save()
            }

            // PROCESS PROPOSAL B PRINT A TRADE COMPONENT
            const proposalBPrintA = await ForgedPrint.findOne({ where: { id: proposalB.forgedPrintAId }})
            const proposalBQuantityA = proposalB.quantityA
            await processTradeComponent(interaction, traderB, traderA, proposalBQuantityA, proposalBPrintA)

            if (proposalB.forgedPrintBId) {
                // PROCESS PROPOSAL B PRINT B TRADE COMPONENT
                const proposalBPrintB = await ForgedPrint.findOne({ where: { id: proposalB.forgedPrintBId }})
                const proposalBQuantityB = proposalB.quantityB
                await processTradeComponent(interaction, traderB, traderA, proposalBQuantityB, proposalBPrintB)
            }

            if (proposalB.forgedPrintCId) {
                // PROCESS PROPOSAL B PRINT C TRADE COMPONENT
                const proposalBPrintC = await ForgedPrint.findOne({ where: { id: proposalB.forgedPrintCId }})
                const proposalBQuantityC = proposalB.quantityC
                await processTradeComponent(interaction, traderB, traderA, proposalBQuantityC, proposalBPrintC)
            }

            if (proposalB.forgedPrintDId) {
                // PRODESS PROPOSAL B PRINT D TRADE DOMPONENT
                const proposalBPrintD = await ForgedPrint.findOne({ where: { id: proposalB.forgedPrintDId }})
                const proposalBQuantityD = proposalB.quantityD
                await processTradeComponent(interaction, traderB, traderA, proposalBQuantityD, proposalBPrintD)
            }

            if (proposalB.forgedPrintEId) {
                // PROEESS PROPOSAL B PRINT E TRAEE EOMPONENT
                const proposalBPrintE = await ForgedPrint.findOne({ where: { id: proposalB.forgedPrintEId }})
                const proposalBQuantityE = proposalB.quantityE
                await processTradeComponent(interaction, traderB, traderA, proposalBQuantityE, proposalBPrintE)
            }

            if (proposalB.stardustQuantity) {
                const traderAWallet = await Wallet.findOne({ where: { playerId: traderA.id }})
                const traderBWallet = await Wallet.findOne({ where: { playerId: traderB.id }})
                traderAWallet.stardust+=proposalB.stardustQuantity
                await traderAWallet.save()
                traderBWallet.stardust-=proposalB.stardustQuantity
                await traderBWallet.save()
            }

            await proposalA.destroy()
            await proposalB.destroy()
            await confirmation.update({ components: [] })
            return confirmation.editReply({ content: `Success! <@${traderB.discordId}> traded:\n${traderBPackageSummary.join('\n')}\n\nTo <@${traderA.discordId}> for:\n${traderAPackageSummary.join('\n')}`, components: [] })
        } else {
            await proposalA.destroy()
            await proposalB.destroy()
            await confirmation.update({ components: [] })
            return confirmation.editReply({ content: `Not a problem. The transaction with ${traderB.name} has been cancelled.`, components: [] })
        }
    } catch (err) {
        console.log(err)
        await proposalA.destroy()
        await proposalB.destroy()
        return interaction.channel.send({ content: `Sorry, time's up. The transaction with ${traderB.name} has been cancelled.`, components: [] });
    }   
}



//GET SELLER CONFIRMATION
export const getSellerConfirmation = async (interaction, buyer, seller, quantity, print, card, price, buyersInv, sellersInv, buyersWallet, sellersWallet) => {
    const sellerDiscordId = seller.discordId

    const row = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
            .setCustomId(`Sell-Yes`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Primary)
        )

        .addComponents(new ButtonBuilder()
            .setCustomId(`Sell-No`)
            .setLabel('No')
            .setStyle(ButtonStyle.Primary)
        )

    await interaction.channel.send({ content: `<@${sellerDiscordId}> are you sure you want to sell ${quantity}${card} to ${buyer.name} for ${price}${stardust}? ${hmmm}`, components: [row] })

    const filter = i => i.customId.startsWith('Sell-') && i.user.id === sellerDiscordId
    
    try {
        const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
        if (confirmation.customId.includes('Yes')) {
            if (buyersInv) {
                buyersInv.quantity+=quantity
                await buyersInv.save()
            } else {
                await ForgedInventory.create({
                    cardName: print.cardName,
                    cardCode: print.cardCode,
                    forgedPrintId: print.id,
                    quantity: quantity,
                    playerName: buyer.name,
                    playerId: buyer.id
                })
            }

            sellersInv.quantity-=quantity
            await sellersInv.save()
            buyersWallet.stardust-=price
            await buyersWallet.save()
            sellersWallet.stardust+=price
            await sellersWallet.save()

            const newMarketPrice = calculateNewMarketPrice(quantity, price, print)
            await print.update({ marketPrice: newMarketPrice })

            await confirmation.update({ components: [] })
            return confirmation.editReply({ content: `<@${buyer.discordId}> bought ${quantity} ${card} from <@${sellerDiscordId}> for ${price}${stardust}!`})
        } else {
            await confirmation.update({ components: [] })
            await confirmation.editReply({ content: `Not a problem. The transaction with ${buyer.name} has been cancelled.`, components: [] })
        }
    } catch (err) {
        console.log(err)
        await interaction.channel.send({ content: `Sorry, time's up. The transaction with ${buyer.name} has been cancelled.`, components: [] });
    }   
}

//GET BUYER CONFIRMATION
export const getBuyerConfirmation = async (interaction, buyer, seller, quantity, print, card, price, buyersInv, sellersInv, buyersWallet, sellersWallet) => {
    const buyerDiscordId = buyer.discordId

    const row = new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
            .setCustomId(`Buy-Yes`)
            .setLabel('Yes')
            .setStyle(ButtonStyle.Primary)
        )

        .addComponents(new ButtonBuilder()
            .setCustomId(`Buy-No`)
            .setLabel('No')
            .setStyle(ButtonStyle.Primary)
        )

    await interaction.channel.send({ content: `<@${buyerDiscordId}> are you sure you want to buy ${quantity}${card} from ${seller.name} for ${price}${stardust}? ${hmmm}`, components: [row] })

    const filter = i => i.customId.startsWith('Buy-') && i.user.id === buyerDiscordId
    
    try {
        const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30000 })
        if (confirmation.customId.includes('Yes')) {
            if (buyersInv) {
                buyersInv.quantity+=quantity
                await buyersInv.save()
            } else {
                await ForgedInventory.create({
                    cardName: print.cardName,
                    cardCode: print.cardCode,
                    forgedPrintId: print.id,
                    quantity: quantity,
                    playerName: buyer.name,
                    playerId: buyer.id
                })
            }

            sellersInv.quantity-=quantity
            await sellersInv.save()
            buyersWallet.stardust-=price
            await buyersWallet.save()
            sellersWallet.stardust+=price
            await sellersWallet.save()

            const newMarketPrice = calculateNewMarketPrice(quantity, price, print)
            await print.update({ marketPrice: newMarketPrice })

            await confirmation.update({ components: [] })
            return confirmation.editReply({ content: `<@${buyerDiscordId}> bought ${quantity} ${card} from <@${seller.discordId}> for ${price}${stardust}!`})
        } else {
            await confirmation.update({ components: [] })
            await confirmation.editReply({ content: `Not a problem. The transaction with ${seller.name} has been cancelled.`, components: [] })
        }
    } catch (err) {
        console.log(err)
        await interaction.channel.send({ content: `Sorry, time's up. The transaction with ${seller.name} has been cancelled.`, components: [] });
    }
}


// GET INVOICE MERCHBOT SALE
const getInvoiceMerchBotSale = async (message, line_items, sellingPlayer, fuzzyPrints) => {
	const info = await Info.findOne({ where: { element: 'shop'} })
    const shopIsClosed = info.status === 'closed'
    const sellerId = sellingPlayer.id
    let totalPrice = 0
    const cards = []
    const cardCodes = []
    const sellerInvs = []
    const quantities = []
    const prints = []
    let m6success

    for (let i = 0; i < line_items.length; i++) {
        const line_item = line_items[i]
		const args = line_item.split(' ').filter((el) => el !== '')
        const quantity = isFinite(args[0]) ? parseInt(args[0]) : 1    
        const query = isFinite(args[0]) ? args.slice(1).join(' ') : args.slice(0).join(' ')	

        if (quantity < 1) {
            message.channel.send({ content: `Sorry, ${quantity} is not a valid quantity.`})
            return false
        }
    
		if (!query) {
            message.channel.send({ content: `Please specify the cards you wish to sell.`})
            return false
        }

		const cardCode = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const cardName = await findCard(query, fuzzyPrints)
		const validCardCode = !!(cardCode.length === 7 && isFinite(cardCode.slice(-3)) && await ForgedSet.count({where: { code: cardCode.slice(0, 3) }}))
	
		const print = validCardCode ? await ForgedPrint.findOne({ where: { cardCode: cardCode }}) :
                    cardName ? await selectPrint(message, sellerId, cardName, discrete = false, inInv = true) :
                    null

        if (cardName && !print) {
            message.channel.send({ content: `You do not have any copies of ${cardName}.`})
            return false
        } else if (!print) {
            message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
            return false
        } else if (print.setCode === 'FPC') {
			message.channel.send({ content: `You cannot buy or sell prize cards.`})
			return false
		}


		const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`

        if (cardCodes.includes(cardCode)) {
            message.channel.send({ content: `You cannot list ${card} more than once.`})
            return false
        }

		const sellerInv = await Inventory.findOne({ 
			where: { 
				printId: print.id,
				playerId: sellerId,
				quantity: { [Op.gt]: 0 }
			}
		})

		const merchbotInv = await Inventory.count({ 
			where: { 
				printId: print.id,
				playerId: merchbotId,
				quantity: { [Op.gt]: 0 }
			}
		})

        const auction = await Auction.findOne({ where: { printId: print.id }})

        if ((auction || !merchbotInv) && shopIsClosed) {
            message.channel.send({ content: `Sorry, you cannot sell ${card} until the current auction is over.`})
            return false
        }

		if (!sellerInv) {
            message.channel.send({ content: `You do not have any copies of ${card}.`})
            return false
        }

		if (sellerInv.quantity < quantity) {
            message.channel.send({ content: `You only have ${sellerInv.quantity} ${sellerInv.quantity > 1 ? 'copies' : 'copy'} of ${card}.`})
            return
        } 
	
		if (!!(print.rarity !== 'com' && quantity >= 5)) m6success = true

        const buyingPrice = Math.floor(print.marketPrice * 0.7) > 0 ? Math.floor(print.marketPrice * 0.7) : 1
        totalPrice += buyingPrice * quantity
		cardCodes.push(cardCode)
		quantities.push(quantity)
		prints.push(print)
		sellerInvs.push(sellerInv)
		cards.push(`${quantity} ${card}`)
    }

    const invoice = {
        totalPrice,
        quantities,
        cards,
        prints,
        sellerInvs,
        m6success
    }

    return invoice
}

// GET INVOICE MERCHBOT PURCHASE
const getInvoiceMerchBotPurchase = async (message, line_items, buyingPlayer, fuzzyPrints) => {
    const info = await Info.findOne({ where: { element: 'shop' }})
    const shopIsClosed = info.status === 'closed'
    const buyerId = buyingPlayer.id
    let totalPrice = 0
    const cards = []
    const sellerInvs = []
    const quantities = []
    const prints = []
    let m4success

    const diary = buyingPlayer.diary
    const hardComplete = diary.h1 && diary.h2 && diary.h3 && diary.h4 && diary.h5 && diary.h6 && diary.h7 && diary.h8
    const discount = hardComplete ? (1 / 1.1) : 1

    const line_item = line_items[0]
    const args = line_item.split(' ').filter((el) => el !== '')
    const quantity = isFinite(args[0]) ? parseInt(args[0]) : 1    
    const query = isFinite(args[0]) ? args.slice(1).join(' ') : args.slice(0).join(' ')	

    if (quantity < 1) {
        message.channel.send({ content: `Sorry, ${quantity} is not a valid quantity.`})
        return false
    }

    if (!query) {
        message.channel.send({ content: `Please specify the card you wish to buy.`})
        return false
    } 

    const cardCode = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
    const cardName = await findCard(query, fuzzyPrints)
    const validCardCode = !!(cardCode.length === 7 && isFinite(cardCode.slice(-3)) && await ForgedSet.count({where: { code: cardCode.slice(0, 3) }}))

    const print = validCardCode ? await ForgedPrint.findOne({ where: { cardCode: cardCode }}) :
                cardName ? await selectPrint(message, buyerId, cardName) :
                null
    
    if (cardName && !print) {
        message.channel.send({ content: `You do not have any copies of ${cardName}.`})
        return false
    } else if (!print) {
        message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
        return false
    }

    const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`
    const auction = await Auction.findOne({ where: { printId: print.id }})

    if (auction) {
        message.channel.send({ content: `Sorry, ${card} will not be available until the ${shopIsClosed ? 'current auction is over' : 'next auction'}.`})
        return false
    }

    const merchbotInv = await Inventory.findOne({ 
        where: { 
            printId: print.id,
            playerId: merchbotId,
            quantity: { [Op.gt]: 0 }
        }
    })

    const buyerInv = await Inventory.findOne({ 
        where: { 
            printId: print.id,
            playerId: buyerId,
            quantity: { [Op.gt]: 0 }
        }
    })

    if (buyerInv && (buyerInv.quantity + quantity > 3) || quantity > 3 ) {
        message.channel.send({ content: `You cannot buy more than 3 copies of a card from The Shop.`})
        return false
    } 

    if (!merchbotInv) {
        message.channel.send({ content: `Sorry, ${card} is out of stock.`})
        return false
    } 

    if (merchbotInv.quantity < quantity) {
        message.channel.send({ content: `Sorry, I only have ${merchbotInv.quantity > 1 ? 'copies' : 'copy'} of ${card}.`})
        return
    } 

    if (!!(print.rarity === 'scr')) m4success = true

    const buyingPrice = Math.floor(print.marketPrice * 0.7) > 0 ? Math.floor(print.marketPrice * 0.7) : 1
    const sellingPrice = Math.floor(print.marketPrice * 1.1 * discount) > buyingPrice ? Math.floor(print.marketPrice * 1.1 * discount) : buyingPrice + 1
    totalPrice += sellingPrice * quantity 
    quantities.push(quantity)
    prints.push(print)
    sellerInvs.push(merchbotInv)
    cards.push(`${quantity} ${card}`)

    const invoice = {
        totalPrice,
        quantities,
        cards,
        prints,
        sellerInvs,
        m4success
    }

    return invoice
}

// GET INVOICE P2P SALE
const getInvoiceP2PSale = async (message, line_item, buyingPlayer, sellingPlayer, fuzzyPrints) => {
    const sellerId = sellingPlayer.id
    const buyerId = buyingPlayer.id
    const authorIsSeller = message.author.id === sellerId
    const args = line_item.split(' ').filter((el) => el !== '')
    const quantity = isFinite(args[0]) ? parseInt(args[0]) : 1
    const totalPrice = parseInt(args[args.length - 1])
    let m4success

    if (quantity < 1) {
        message.channel.send({ content: `Sorry, ${quantity} is not a valid quantity.`})
        return false
    }

    if (!totalPrice) {
        message.channel.send({ content: `Please specify your ${authorIsSeller ? 'asking price' : 'offer price'} at the end of the command.`})
        return false
    }

    if (totalPrice < 1) {
        message.channel.send({ content: `You cannot pay less than 1${stardust} for any items.`})
        return false
    }

	if (buyingPlayer.wallet.stardust < totalPrice && buyerId !== merchbotId) {
        message.channel.send({ content: `Sorry, ${authorIsSeller ? `${buyingPlayer.name} only has` : 'You only have'} ${buyingPlayer.wallet.stardust}${stardust}.`})
        return false
    } 

    const query = isFinite(args[0]) ? args.slice(1, -1).join(' ') : args.slice(0, -1).join(' ')

    if (!query) {
        message.channel.send({ content: `Please specify the card(s) you wish to ${authorIsSeller ? 'sell' : 'buy'}.`})
        return false
    } 

    const cardCode = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
    const cardName = await findCard(query, fuzzyPrints)
    const validCardCode = !!(cardCode.length === 7 && isFinite(cardCode.slice(-3)) && await ForgedSet.count({where: { code: cardCode.slice(0, 3) }}))

    let walletField
    if (query === 'cactus' || query === 'cactuses' || query === 'cacti') walletField = 'cactus'
    if (query === 'egg' || query === 'eggs') walletField = 'egg'
    if (query === 'hook' || query === 'hooks') walletField = 'hook'
    if (query === 'moai' || query === 'moais' ) walletField = 'moai'
    if (query === 'mushroom' || query === 'mushrooms') walletField = 'mushroom'
    if (query === 'rose' || query === 'roses' ) walletField = 'rose'
    if (query === 'gem' || query === 'gems' ) walletField = 'gem'
    if (query === 'orb' || query === 'orbs' ) walletField = 'orb'
    if (query === 'sword' || query === 'swords' ) walletField = 'swords'
    if (query === 'skull' || query === 'skulls' ) walletField = 'skull'
    if (query === 'familiar' || query === 'familiars' ) walletField = 'familiar'
    if (query === 'battery' || query === 'batteries' ) walletField = 'battery'

    const print = validCardCode && !walletField ? await ForgedPrint.findOne({ where: { cardCode: cardCode }}) :
                cardName && !walletField ? await selectPrint(message, sellerId, cardName, discrete = false, inInv = true) :
                null
    
    if (cardName && !print && !walletField) {
        message.channel.send({ content: `You do not have any copies of ${cardName}.`})
        return false
    } else if (!print && !walletField) {
        message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
        return false
    }

	if (print && Math.ceil(print.marketPrice * 0.7) * quantity > totalPrice) {
        message.channel.send({ content: `Sorry, you cannot ${authorIsSeller ? 'sell cards to' : 'buy cards from'} other players for less than what The Shop will pay for them.`})
        return false
    }

    if (print && print.rarity === 'scr') m4success = true

    const card = walletField ? `${quantity} ${eval(walletField)} ${capitalize(walletField)}` :
                `${quantity} ${eval(print.rarity)}${print.cardCode} - ${print.cardName}`

    const sellerInv = print ? await Inventory.findOne({ 
        where: { 
            printId: print.id,
            playerId: sellerId,
            quantity: { [Op.gt]: 0 }
        }
    }) : null
    
    const sellerWallet = print ? await Wallet.findOne({ where: { 
        playerId: sellerId 
    }}) : await Wallet.findOne({ where: { 
        [walletField]: { [Op.gt]: 0 },
        playerId: sellerId 
    }})

    if ((!sellerInv && print) && (!sellerWallet && walletField)) {
        message.channel.send({ content: `${authorIsSeller ? `You do not have any ${walletField ? '' : 'copies of '}` : shopSale ? 'Sorry, ' : `${buyingPlayer.name} does not have any${walletField ? '' : 'copies of '}`}${card}${shopSale ? ' is Out of Stock' : ''}.`})
        return false
    } 

    if (sellerInv && sellerInv.quantity < quantity || sellerWallet && sellerWallet[walletField] < quantity) {
        message.channel.send({ content: `${authorIsSeller ? 'You only have' : `${sellingPlayer.name} only has` } ${sellerInv ? `${sellerInv.quantity} ${card}` : `${sellerWallet[walletField]} ${eval(walletField)}`}.`})
        return false
    }

    const invoice = {
        totalPrice,
        quantity,
        card,
        print,
        walletField,
        sellerInv,
        sellerWallet,
        m4success
    }

    return invoice
}

// CALCULATE NEW MARKET PRICE
export const calculateNewMarketPrice = (quantity, price, print) => {
    const newMarketPrice = quantity > 16 ? price / quantity :
        ( price * quantity + ( (16 - quantity) * print.marketPrice ) ) / 16

    return newMarketPrice
}

// PROCESS MERCHBOT SALE
const processMerchBotSale = async (message, invoice, buyingPlayer, sellingPlayer) => {
    const authorIsSeller = message.author.id === sellingPlayer.id
    const totalPrice = invoice.totalPrice
    const cards = invoice.cards
    const quantities = invoice.quantities
    const prints = invoice.prints
    const sellerInvs = invoice.sellerInvs
    const buyerId = buyingPlayer.id

    if (!totalPrice || !cards.length || !quantities.length || !prints.length || !sellerInvs.length || !buyerId) {
        message.channel.send({ content: `Error processing MerchBot Sale: missing needed information.`})
        return false
    }

	for (let i = 0; i < cards.length; i++) {
        const quantity = quantities[i]
        const print = prints[i]
        const sellerInv = sellerInvs[i]
        const price = authorIsSeller ? Math.ceil(print.marketPrice * 0.7) : Math.ceil(print.marketPrice * 1.1)

		const newPrice = quantity > 16 ? price / quantity :
                        ( price * quantity + ( (16 - quantity) * print.marketPrice ) ) / 16
		
        const buyerCount = await Inventory.count({ 
			where: { 
				cardCode: print.cardCode,
				printId: print.id,
				playerId: buyerId
			}
		})

        if (!buyerCount) {
            await Inventory.create({ 
                cardCode: print.cardCode,
                printId: print.id,
                playerId: buyerId
            })
        }

		const buyerInv = await Inventory.findOne({ 
			where: { 
				cardCode: print.cardCode,
				printId: print.id,
				playerId: buyerId
			}
		})

        if (!buyerInv) {
            message.channel.send({ content: `Database error: Could not find or create Buyer Inventory for: ${print.cardName}.`})
        }

        const auction = await Auction.findOne({ where: { printId: print.id }})

        if (auction) {
            auction.quantity += quantity
            await auction.save()
        } else if (authorIsSeller && buyerInv.quantity < 1) {
            await Auction.create({
                cardCode: print.cardCode,
                quantity: quantity,
                printId: print.id
            })
        } 

		buyerInv.quantity += quantity
		await buyerInv.save()

        sellerInv.quantity -= quantity
		await sellerInv.save()

        if (authorIsSeller) await updateBinder(sellingPlayer)
	}

    buyingPlayer.wallet.stardust -= totalPrice
    await buyingPlayer.wallet.save()

    sellingPlayer.wallet.stardust += totalPrice
    await sellingPlayer.wallet.save()

    return true
}

// PROCESS P2P SALE
const processP2PSale = async (message, invoice, buyingPlayer, sellingPlayer) => {
    const totalPrice = invoice.totalPrice
    const card = invoice.card
    const quantity = invoice.quantity
    const print = invoice.print
    const walletField = invoice.walletField
    const sellerInv = invoice.sellerInv

    const buyerId = buyingPlayer.id
    const sellerId = sellingPlayer.id
    const sellerWallet = sellingPlayer.wallet
    const buyerWallet = buyingPlayer.wallet

    if (!totalPrice || !card || !quantity || !((print && sellerInv) || walletField) || !buyerId || !sellerId || !buyerWallet || !sellerWallet) {
        message.channel.send({ content: `Error processing P2P Sale: missing needed information.`})
        return false
    }

    if (print) {
        const newPrice = quantity >= 16 ? totalPrice / quantity :
                        ( totalPrice + ( (16 - quantity) * print.marketPrice ) ) / 16

        const buyerCount = await Inventory.count({ 
            where: { 
                cardCode: print.cardCode,
                printId: print.id,
                playerId: buyerId
            }
        })
    
        if (!buyerCount) {
            await Inventory.create({ 
                cardCode: print.cardCode,
                printId: print.id,
                playerId: buyerId
            })
        }
    
        const buyerInv = await Inventory.findOne({ 
            where: { 
                cardCode: print.cardCode,
                printId: print.id,
                playerId: buyerId
            }
        })

        if (!buyerInv) {
            message.channel.send({ content: `Database error: Could not find Buyer Inventory for: ${print.cardName}.`})
        }

        buyerInv.quantity += quantity
        await buyerInv.save()   

        sellerInv.quantity -= quantity
        await sellerInv.save()

        await updateBinder(sellingPlayer)

        // if (print.rarity === 'scr') completeTask(message.channel, buyerId, 'm4')
        // if (print.setCode === 'APC' && buyerInv && buyerInv.quantity >= 3) completeTask(message.channel, buyerId, 'h5')

        buyerWallet.stardust -= totalPrice
        await buyerWallet.save()
    
        sellerWallet.stardust += totalPrice
        await sellerWallet.save()

    } else if (walletField) {
        buyerWallet[walletField] += quantity
        await buyerWallet.save()

        sellerWallet[walletField] -= quantity
        await sellerWallet.save()
        
        buyerWallet.stardust -= totalPrice
        await buyerWallet.save()
    
        sellerWallet.stardust += totalPrice
        await sellerWallet.save()
    } else {
        message.channel.send({ content: `Error processing P2P Sale: missing needed information.`})
        return false
    }
 
    return true
}