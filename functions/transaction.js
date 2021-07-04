
const { Card, Player, Print, Set, Wallet, Diary, Inventory } = require('../db')
const merchbotId = '584215266586525696'
const { Op } = require('sequelize')
const { yescom } = require('../static/commands.json')
const { starchips, stardust, mushroom, moai, rose, hook, egg, cactus, com, rar, sup, ult, scr } = require('../static/emojis.json')
const { awardPacksToShop } = require('./packs')
const adminId = '194147938786738176'
const { client } = require('../static/clients.js')
const { fpRole } = require('../static/roles.json')
const { findCard } = require('./search.js')
const { selectPrint } = require('./print.js')
const { announcementsChannelId, botSpamChannelId, shopChannelId, staffChannelId } = require('../static/channels.json')
const { completeTask } = require('./diary')


//GET SELLER CONFIRMATION
const getSellerConfirmation = async (message, invoice, buyingPlayer, sellingPlayer, shopSale = true, mention = false) => {
    const cards = shopSale ? invoice.cards : [invoice.card]
    const sellerId = sellingPlayer.id
    console.log('cards', cards)
    console.log('sellerId', sellerId)

	const filter = m => m.author.id === sellerId
	const msg = await message.channel.send(
        `${mention ? `<@${sellerId}>, Do you agree` : 'Are you sure you want'} ` +
        `to sell${cards.length > 1 ? `:\n${cards.join('\n')}\nT` : ` ${cards[0]} t`}o ` +
        `${shopSale ? 'The Shop' : buyingPlayer.name} ` + 
        `for ${invoice.total_price}${stardust}?`
    )

	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		const response = collected.first().content.toLowerCase()
		if (yescom.includes(response)) {
			return true
		} else {
			message.channel.send(`No problem. Have a nice day.`)
			return false
		}
	}).catch(err => {
		console.log(err)
		message.channel.send(`Sorry, time's up.`)
        return false
	})

	return collected
}

//GET BUYER CONFIRMATION
const getBuyerConfirmation = async (message, invoice, buyingPlayer, sellingPlayer, shopSale, mention = false) => {
    const cards = shopSale ? invoice.cards : [invoice.card]
    const buyerId = buyingPlayer.id
    console.log('cards', cards)
    console.log('buyerId', buyerId)

	const filter = m => m.author.id === buyerId
	const msg = await message.channel.send(`${mention ? `<@${buyerId}>, Do you agree` : 'Are you sure you want'} to buy${cards.length > 1 ? `:\n${cards.join('\n')}\nF` : ` ${cards[0]} f`}rom ${sellingPlayer.id === merchbotId ? 'The Shop' : sellingPlayer.name} for ${invoice.total_price}${stardust}?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(async collected => {
		const response = collected.first().content.toLowerCase()
		if (yescom.includes(response)) {
			return true
		} else {
			message.channel.send(`No problem. Have a nice day.`)
			return false
		}
	}).catch(err => {
		console.log(err)
		message.channel.send(`Sorry, time's up.`)
        return false
	})

	return collected
}


const getInvoiceMerchBotSale = async (message, line_items, buyingPlayer) => {
    const sellerId = message.author.id
    let total_price = 0
    const cards = []
    const sellerInvs = []
    const quantities = []
    const prints = []
    let m6success

    for (let i = 0; i < line_items.length; i++) {
        const line_item = line_items[i]
		const args = line_item.split(' ')
        const quantity = isFinite(args[0]) ? parseInt(args[0]) : 1    
        const query = isFinite(args[0]) ? args.slice(1).join(' ') : args.slice(0).join(' ')	

		if (!query) {
            message.channel.send(`Please specify the card(s) you wish to sell.`)
            return false
        } 

		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) :
                    card_name ? await selectPrint(message, sellerId, card_name) :
                    null
		
        if (!print) {
            message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
            return false
        }

        prints.push(print)

        total_price += Math.ceil(print.market_price * 0.7) * quantity
		const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

		const sellerInv = await Inventory.findOne({ 
			where: { 
				printId: print.id,
				playerId: sellerId,
				quantity: { [Op.gt]: 0 }
			}
		})

		if (!sellerInv) {
            message.channel.send(`You do not have any copies of ${card}.`)
            return false
        } 

		if (sellerInv.quantity < quantity) {
            message.channel.send(`You only have ${sellerInv.quantity} ${sellerInv.quantity > 1 ? 'copies' : 'copy'} of ${card}.`)
            return
        } 
	
		if (!!(print.rarity !== 'com' && quantity >= 5)) m6sucsess = !!(print.rarity !== 'com' && quantity >= 5)

		quantities.push(quantity)
		prints.push(print)
		sellerInvs.push(sellerInv)
		cards.push(`${quantity} ${card}`)
    
    }

    const invoice = {
        total_price,
        quantities,
        cards,
        prints,
        sellerInvs,
        m6success
    }

    return invoice
}

const getInvoiceP2PSale = async (message, line_item, buyingPlayer) => {
    const sellerId = message.author.id
    const args = line_item.split(' ')
    const quantity = isFinite(args[0]) ? parseInt(args[0]) : 1
    const total_price = parseInt(args[args.length - 1])

    if (!total_price) {
        message.channel.send(`Please specify your asking price at the end of the command.`)
        return false
    }

	if (buyingPlayer.wallet.stardust < total_price) {
        message.channel.send(`Sorry, ${buyingPlayer.name} only has ${buyingPlayer.wallet.stardust}${stardust}.`)
        return false
    } 

    const query = isFinite(args[0]) ? args.slice(1, -1).join(' ') : args.slice(0, -1).join(' ')

    if (!query) {
        message.channel.send(`Please specify the card(s) you wish to sell.`)
        return false
    } 

    const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
    const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
    const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))

    let walletField
    if (query === 'cactus' || query === 'cactuses' || query === 'cacti') walletField = 'cactus'
    if (query === 'egg' || query === 'eggs') walletField = 'egg'
    if (query === 'hook' || query === 'hooks') walletField = 'hook'
    if (query === 'moai' || query === 'moais' ) walletField = 'moai'
    if (query === 'mushroom' || query === 'mushrooms') walletField = 'mushroom'
    if (query === 'rose' || query === 'roses' ) walletField = 'rose'

    const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) :
                card_name ? await selectPrint(message, sellerId, card_name) :
                null
    
    if (!print && !walletField) {
        message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
        return false
    }

	if (print && Math.ceil(print.market_price * 0.7) * quantity > total_price) {
        message.channel.send(`Sorry, you cannot sell cards to other players for less than what The Shop will pay for them.`)
        return false
    }

    const card = walletField ? `${eval(walletField)} ${capitalize(walletField)}` :
                `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

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

    if (!sellerInv && !sellerWallet) {
        message.channel.send(`You do not have any ${walletField ? '' : 'copies of '}${card}.`)
        return false
    } 

    if (sellerInv && sellerInv.quantity < quantity || sellerWallet && sellerWallet[walletField] < quantity) {
        message.channel.send(`You only have ${sellerInv ? sellerInv.quantity : sellerWallet[walletField]} ${card}.`)
        return false
    }

    const invoice = {
        total_price,
        quantity,
        card,
        print,
        walletField,
        sellerInv,
        sellerWallet
    }

    return invoice
}

const processMerchBotSale = async (message, invoice, buyingPlayer, sellingPlayer) => {
    const total_price = invoice.total_price
    const cards = invoice.cards
    const quantities = invoice.quantities
    const prints = invoice.prints
    const sellerInvs = invoice.invs
    const buyerId = buyingPlayer.id

    if (!price || !cards.length || !quantities.length || !prints.length || !sellerInvs.length || buyerId) {
        message.channel.send(`Error processing MerchBot Sale: missing needed information.`)
        return false
    }

	for (let i = 0; i < cards.length; i++) {
        const quantity = quantities[i]
        const print = prints[i]
        const sellerInv = sellerInvs[i]
        const price = Math.ceil(print.market_price * 0.7)

		const newPrice = quantity > 16 ? price / quantity :
                        ( price + ( (16 - quantity) * print.market_price ) ) / 16
		
		print.market_price = newPrice
		await print.save()
		
		let buyerInv = await Inventory.findOne({ 
			where: { 
				card_code: print.card_code,
				printId: print.id,
				playerId: buyerId
			}
		})

        if (!buyerInv) buyerInv = await Inventory.create({ 
            card_code: print.card_code,
            printId: print.id,
            playerId: buyerId
		})

		buyerInv.quantity += quantity
		await buyerInv.save()

        if (!buyerInv) {
            message.channel.send(`Database error: Could not find or create Buyer Inventory.`)
            return false
        }
 
        sellerInv.quantity -= quantity
		await sellerInv.save()
	}

    buyingPlayer.wallet.stardust -= total_price
    await buyingPlayer.wallet.save()

    sellingPlayer.wallet.stardust += total_price
    await sellingPlayer.wallet.save()

    return true
}

const processP2PSale = async (message, invoice, buyingPlayer, sellingPlayer) => {
    const total_price = invoice.total_price
    const card = invoice.card
    const quantity = invoice.quantity
    const print = invoice.print
    const walletField = invoice.walletField
    const sellerInv = invoice.sellerInv
    const sellerWallet = invoice.sellerWallet
    const buyerId = buyingPlayer.id

    if (!total_price || !card || !quantity || !((print && sellerInv) || walletField) ) {
        message.channel.send(`Error processing P2P Sale: missing needed information.`)
        return false
    }

    const newPrice = print && quantity > 16 ? total_price / quantity :
                    print && quantity <= 16 ? ( total_price + ( (16 - quantity) * print.market_price ) ) / 16 :
                    null
    
    if (print) {
        print.market_price = newPrice
        await print.save()
    }

    console.log( 'print.id',  print.id)
    console.log( 'print.card_code',  print.card_code)
    console.log( 'buyerId',  buyerId)
    
    let buyerInv = print ? await Inventory.findOne({ 
        where: { 
            card_code: print.card_code,
            printId: print.id,
            playerId: buyerId
        }
    }) : null

    if (!buyerInv && print) {
        buyerInv = await Inventory.create({ 
            card_code: print.card_code,
            printId: print.id,
            playerId: buyerId
        })
    }

    console.log('buyerInv.dataValues', buyerInv.dataValues)
    
    
    const buyerWallet = await Wallet.findOne({ where: { playerId: buyerId } })

    if (!buyerInv && !buyerWallet) {
        message.channel.send(`Database error: Could not find or create Buyer Inventory/Wallet.`)
        return false
    }

    if (buyerInv) {
        buyerInv.quantity += quantity
        await buyerInv.save()
    } else if (walletField) {
        buyerWallet[walletField] += quantity
        await buyerWallet.save()
    }

    if (print && print.rarity === 'scr') completeTask(message.channel, buyerId, 'm4')
    if (print && print.set_code === 'APC' && buyerInv && buyerInv.quantity >= 3) completeTask(message.channel, buyerId, 'h5')

    if (print) {
        sellerInv.quantity -= quantity
        await sellerInv.save()
    } else if (walletField) {
        sellerWallet[walletField] -= quantity
        await sellerWallet.save()
    }

    buyerWallet -= total_price
    await buyerWallet.save()

    sellerWallet.stardust += total_price
    await sellerWallet.save()

    return true
}
 

module.exports = {
    getBuyerConfirmation,
    getSellerConfirmation,
    getInvoiceMerchBotSale,
    getInvoiceP2PSale,
    processMerchBotSale,
    processP2PSale
}
