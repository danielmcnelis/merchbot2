
const { Card, Player, Print, Set, Wallet, Diary, Info, Inventory, Auction, Status } = require('../db')
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
const { capitalize, isSameDay, isWithinXHours } = require('./utility.js')
const { announcementsChannelId, botSpamChannelId, shopChannelId, staffChannelId } = require('../static/channels.json')
const { completeTask } = require('./diary')


//GET SELLER CONFIRMATION
const getSellerConfirmation = async (message, invoice, buyingPlayer, sellingPlayer, shopSale = true, mention = false) => {
    const cards = shopSale ? invoice.cards : [invoice.card]
    const sellerId = sellingPlayer.id

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

// GET INVOICE MERCHBOT SALE
const getInvoiceMerchBotSale = async (message, line_items, sellingPlayer) => {
	const info = await Info.findOne({ where: { element: 'shop'} })
    const shopIsClosed = info.status === 'closed'
    const sellerId = sellingPlayer.id
    let total_price = 0
    const cards = []
    const card_codes = []
    const sellerInvs = []
    const quantities = []
    const prints = []
    let m6success

    for (let i = 0; i < line_items.length; i++) {
        const line_item = line_items[i]
		const args = line_item.split(' ').filter((el) => el !== '')
        const quantity = isFinite(args[0]) ? parseInt(args[0]) : 1    
        const query = isFinite(args[0]) ? args.slice(1).join(' ') : args.slice(0).join(' ')	

		if (!query) {
            message.channel.send(`Please specify the cards you wish to sell.`)
            return false
        }

		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) :
                    card_name ? await selectPrint(message, sellerId, card_name) :
                    null
        
        const count = print && print.set_code === 'CH1' ? await Inventory.findOne({ where: { printId: print.id } }) : true

        if (!print || !count) {
            message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
            return false
        }

		const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`

        if (card_codes.includes(card_code)) {
            message.channel.send(`You cannot list ${card} more than once.`)
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
            message.channel.send(`Sorry, you cannot sell ${card} until the current auction is over.`)
            return false
        }

		if (!sellerInv) {
            message.channel.send(`You do not have any copies of ${card}.`)
            return false
        }

		if (sellerInv.quantity < quantity) {
            message.channel.send(`You only have ${sellerInv.quantity} ${sellerInv.quantity > 1 ? 'copies' : 'copy'} of ${card}.`)
            return
        } 
	
		if (!!(print.rarity !== 'com' && quantity >= 5)) m6success = true

        total_price += Math.ceil(print.market_price * 0.7) * quantity
		card_codes.push(card_code)
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

// GET INVOICE MERCHBOT PURCHASE
const getInvoiceMerchBotPurchase = async (message, line_items, buyingPlayer) => {
    const buyerId = buyingPlayer.id
    let total_price = 0
    const cards = []
    const sellerInvs = []
    const quantities = []
    const prints = []
    let m4success

    const line_item = line_items[0]
    const args = line_item.split(' ').filter((el) => el !== '')
    const quantity = isFinite(args[0]) ? parseInt(args[0]) : 1    
    const query = isFinite(args[0]) ? args.slice(1).join(' ') : args.slice(0).join(' ')	

    if (!query) {
        message.channel.send(`Please specify the card you wish to buy.`)
        return false
    } 

    const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
    const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
    const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))

    const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) :
                card_name ? await selectPrint(message, buyerId, card_name) :
                null
    
    const count = print && print.set_code === 'CH1' ? await Inventory.findOne({ where: { printId: print.id } }) : true

    if (!print || !count) {
        message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
        return false
    }

    const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
    const auction = await Auction.findOne({ where: { printId: print.id }})

    if (auction) {
        message.channel.send(`Sorry, ${card} will not be available until the next auction.`)
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
        message.channel.send(`You cannot buy more than 3 copies of a card from The Shop.`)
        return false
    } 

    if (!merchbotInv) {
        message.channel.send(`Sorry, ${card} is out of stock.`)
        return false
    } 

    if (merchbotInv.quantity < quantity) {
        message.channel.send(`Sorry, I only have ${merchbotInv.quantity > 1 ? 'copies' : 'copy'} of ${card}.`)
        return
    } 

    if (!!(print.rarity === 'scr')) m4success = true

    total_price += Math.ceil(print.market_price * 1.1) * quantity 
    quantities.push(quantity)
    prints.push(print)
    sellerInvs.push(merchbotInv)
    cards.push(`${quantity} ${card}`)

    const invoice = {
        total_price,
        quantities,
        cards,
        prints,
        sellerInvs,
        m4success
    }

    return invoice
}

// GET INVOICE P2P SALE
const getInvoiceP2PSale = async (message, line_item, buyingPlayer, sellingPlayer) => {
    const sellerId = sellingPlayer.id
    const buyerId = buyingPlayer.id
    const authorIsSeller = message.author.id === sellerId
    const args = line_item.split(' ').filter((el) => el !== '')
    const quantity = isFinite(args[0]) ? parseInt(args[0]) : 1
    const total_price = parseInt(args[args.length - 1])
    let m4success

    if (!total_price) {
        message.channel.send(`Please specify your ${authorIsSeller ? 'asking price' : 'offer price'} at the end of the command.`)
        return false
    }

	if (buyingPlayer.wallet.stardust < total_price && buyerId !== merchbotId) {
        message.channel.send(`Sorry, ${authorIsSeller ? `${buyingPlayer.name} only has` : 'You only have'} ${buyingPlayer.wallet.stardust}${stardust}.`)
        return false
    } 

    const query = isFinite(args[0]) ? args.slice(1, -1).join(' ') : args.slice(0, -1).join(' ')

    if (!query) {
        message.channel.send(`Please specify the card(s) you wish to ${authorIsSeller ? 'sell' : 'buy'}.`)
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

    const print = valid_card_code && !walletField ? await Print.findOne({ where: { card_code: card_code }}) :
                card_name && !walletField ? await selectPrint(message, sellerId, card_name) :
                null
    
    const count = print && print.set_code === 'CH1' ? await Inventory.findOne({ where: { printId: print.id } }) : true

    if ((!print || !count) && !walletField) {
        message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
        return false
    }

	if (print && Math.ceil(print.market_price * 0.7) * quantity > total_price) {
        message.channel.send(`Sorry, you cannot ${authorIsSeller ? 'sell cards to' : 'buy cards from'} other players for less than what The Shop will pay for them.`)
        return false
    }

    if (print && print.rarity === 'scr') m4success = true

    const card = walletField ? `${quantity} ${eval(walletField)} ${capitalize(walletField)}` :
                `${quantity} ${eval(print.rarity)}${print.card_code} - ${print.card_name}`

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
        message.channel.send(`${authorIsSeller ? `You do not have any ${walletField ? '' : 'copies of '}` : shopSale ? 'Sorry, ' : `${buyingPlayer.name} does not have any${walletField ? '' : 'copies of '}`}${card}${shopSale ? ' is Out of Stock' : ''}.`)
        return false
    } 

    if (sellerInv && sellerInv.quantity < quantity || sellerWallet && sellerWallet[walletField] < quantity) {
        message.channel.send(`${authorIsSeller ? 'You only have' : shopSale ? 'I only have' : `${buyingPlayer} only has` } ${sellerInv ? sellerInv.quantity : sellerWallet[walletField]} ${card}${shopSale ? ' in stock.' : ''}.`)
        return false
    }

    const invoice = {
        total_price,
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

// PROCESS MERCHBOT SALE
const processMerchBotSale = async (message, invoice, buyingPlayer, sellingPlayer) => {
    const date = new Date()
	const time = date.getTime()
    const all_statuses = await Status.findAll()
    const new_changes = all_statuses.filter((status) => {
		const updatedAt = status.updatedAt
		const updatedTime = updatedAt.getTime()
		if (isWithinXHours(48, time, updatedTime)) return status
    })
	const affected_cards = new_changes.map((c) => c.name)

    const all_prints = await Print.findAll()
    const all_new_prints = all_prints.filter((print) => {
		const createdAt = print.createdAt
		const createdTime = createdAt.getTime()
		if (isWithinXHours(48, time, createdTime)) return print
    })
    const all_old_prints = all_prints.filter((print) => {
		const createdAt = print.createdAt
		const createdTime = createdAt.getTime()
		if (!isWithinXHours(48, time, createdTime)) return print
    })
    const all_new_print_names = all_new_prints.map((p) => p.card_name)
    const all_old_print_names = all_old_prints.map((p) => p.card_name)
    const all_new_reprint_names = all_new_print_names.filter((name) => all_old_print_names.includes(name))

    const authorIsSeller = message.author.id === sellingPlayer.id
    const total_price = invoice.total_price
    const cards = invoice.cards
    const quantities = invoice.quantities
    const prints = invoice.prints
    const sellerInvs = invoice.sellerInvs
    const buyerId = buyingPlayer.id

    if (!total_price || !cards.length || !quantities.length || !prints.length || !sellerInvs.length || !buyerId) {
        message.channel.send(`Error processing MerchBot Sale: missing needed information.`)
        return false
    }

	for (let i = 0; i < cards.length; i++) {
        const quantity = quantities[i]
        const print = prints[i]
        const sellerInv = sellerInvs[i]
        const price = authorIsSeller ? Math.ceil(print.market_price * 0.7) : Math.ceil(print.market_price * 1.1)

		const newPrice = quantity > 16 ? price / quantity :
                        ( price * quantity + ( (16 - quantity) * print.market_price ) ) / 16
            
        if (!affected_cards.includes(print.card_name) && !all_new_reprint_names.includes(print.card_name)) {
            print.market_price = newPrice
            await print.save()
        }
		
        const buyerCount = await Inventory.count({ 
			where: { 
				card_code: print.card_code,
				printId: print.id,
				playerId: buyerId
			}
		})

        if (!buyerCount) {
            await Inventory.create({ 
                card_code: print.card_code,
                printId: print.id,
                playerId: buyerId
            })
        }

		const buyerInv = await Inventory.findOne({ 
			where: { 
				card_code: print.card_code,
				printId: print.id,
				playerId: buyerId
			}
		})

        if (!buyerInv) {
            message.channel.send(`Database error: Could not find or create Buyer Inventory for: ${print.card_name}.`)
        }

        const auction = await Auction.findOne({ where: { printId: print.id }})

        if (auction) {
            auction.quantity += quantity
            await auction.save()
        } else if (authorIsSeller && buyerInv.quantity < 1) {
            await Auction.create({
                card_code: print.card_code,
                quantity: quantity,
                printId: print.id
            })
        } 

		buyerInv.quantity += quantity
		await buyerInv.save()

        sellerInv.quantity -= quantity
		await sellerInv.save()
	}

    buyingPlayer.wallet.stardust -= total_price
    await buyingPlayer.wallet.save()

    sellingPlayer.wallet.stardust += total_price
    await sellingPlayer.wallet.save()

    return true
}

// PROCESS P2P SALE
const processP2PSale = async (message, invoice, buyingPlayer, sellingPlayer) => {
    const date = new Date()
	const time = date.getTime()
    const all_statuses = await Status.findAll()
    const new_changes = all_statuses.filter((s) => {
		const updatedAt = s.updatedAt
		const updatedTime = updatedAt.getTime()
		if (isWithinXHours(48, time, updatedTime)) return s
    })
	const affected_cards = new_changes.map((c) => c.name)

    const all_prints = await Print.findAll()
    const all_new_prints = all_prints.filter((print) => {
		const createdAt = print.createdAt
		const createdTime = createdAt.getTime()
		if (isWithinXHours(48, time, createdTime)) return print
    })
    const all_old_prints = all_prints.filter((print) => {
		const createdAt = print.createdAt
		const createdTime = createdAt.getTime()
		if (!isWithinXHours(48, time, createdTime)) return print
    })
    const all_new_print_names = all_new_prints.map((p) => p.card_name)
    const all_old_print_names = all_old_prints.map((p) => p.card_name)
    const all_new_reprint_names = all_new_print_names.filter((name) => all_old_print_names.includes(name))

    const total_price = invoice.total_price
    const card = invoice.card
    const quantity = invoice.quantity
    const print = invoice.print
    const walletField = invoice.walletField
    const sellerInv = invoice.sellerInv

    const buyerId = buyingPlayer.id
    const sellerId = sellingPlayer.id
    const sellerWallet = sellingPlayer.wallet
    const buyerWallet = buyingPlayer.wallet

    if (!total_price || !card || !quantity || !((print && sellerInv) || walletField) || !buyerId || !sellerId || !buyerWallet || !sellerWallet) {
        message.channel.send(`Error processing P2P Sale: missing needed information.`)
        return false
    }

    if (print) {
        const newPrice = quantity >= 16 ? total_price / quantity :
                        ( total_price + ( (16 - quantity) * print.market_price ) ) / 16

        if (!affected_cards.includes(print.card_name) && !all_new_reprint_names.includes(print.card_name)) {
            print.market_price = newPrice
            await print.save()
        }

        const buyerCount = await Inventory.count({ 
            where: { 
                card_code: print.card_code,
                printId: print.id,
                playerId: buyerId
            }
        })
    
        if (!buyerCount) {
            await Inventory.create({ 
                card_code: print.card_code,
                printId: print.id,
                playerId: buyerId
            })
        }
    
        const buyerInv = await Inventory.findOne({ 
            where: { 
                card_code: print.card_code,
                printId: print.id,
                playerId: buyerId
            }
        })

        if (!buyerInv) {
            message.channel.send(`Database error: Could not find Buyer Inventory for: ${print.card_name}.`)
        }

        buyerInv.quantity += quantity
        await buyerInv.save()   

        sellerInv.quantity -= quantity
        await sellerInv.save()

        if (print.rarity === 'scr') completeTask(message.channel, buyerId, 'm4')
        if (print.set_code === 'APC' && buyerInv && buyerInv.quantity >= 3) completeTask(message.channel, buyerId, 'h5')

        buyerWallet.stardust -= total_price
        await buyerWallet.save()
    
        sellerWallet.stardust += total_price
        await sellerWallet.save()

    } else if (walletField) {
        buyerWallet[walletField] += quantity
        await buyerWallet.save()

        sellerWallet[walletField] -= quantity
        await sellerWallet.save()
        
        buyerWallet.stardust -= total_price
        await buyerWallet.save()
    
        sellerWallet.stardust += total_price
        await sellerWallet.save()
    } else {
        message.channel.send(`Error processing P2P Sale: missing needed information.`)
        return false
    }
 
    return true
}
 
module.exports = {
    getBuyerConfirmation,
    getSellerConfirmation,
    getInvoiceMerchBotPurchase,
    getInvoiceMerchBotSale,
    getInvoiceP2PSale,
    processMerchBotSale,
    processP2PSale
}
