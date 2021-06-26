
const { Auction, Bid, Card, Match, Player, Tournament, Print, Set, Wallet, Diary, Inventory, Arena, Trivia, Keeper, Gauntlet, Draft, Daily, Binder, Wishlist, Profile, Info } = require('../db')
const merchbotId = '584215266586525696'
const { Op } = require('sequelize')
const { yescom } = require('../static/commands.json')
const { ygocard, pack, open, closed, DOC, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, ROCK, sad, mad, beast, dragon, machine, spellcaster, warrior, zombie, fish, rock, dinosaur, plant, reptile, starchips, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')
const { awardPacksToShop } = require('./packs')
const adminId = '194147938786738176'
const { client } = require('../static/clients.js')
const { fpRole } = require('../static/roles.json')
const { announcementsChannel, botSpamChannel, shopChannel } = require('../static/channels.json')

// OPEN SHOP
const openShop = async () => {
	const shop = await Info.findOne({ where: { element: 'shop' }})
	if (!shop) return client.channels.cache.get(botSpamChannel).send(`Could not find game element: "shop".`)

	if (shop.status === 'open') {
		return client.channels.cache.get(botSpamChannel).send(`The Shop ${merchant} was already open. ${open}`)
	} else {
		shop.status = 'open'
		await shop.save()
        await processBids()
        updateShop()
        return client.channels.cache.get(announcementsChannel).send(`Good morning, <@&${fpRole}>, The Shop ${merchant} is now open! ${open}`)
	} 
}

// CLOSE SHOP
const closeShop = async () => {
    const shop = await Info.findOne({ where: { element: 'shop' }})
	if (!shop) return client.channels.cache.get(botSpamChannel).send(`Could not find game element: "shop".`)
	if (shop.status === 'closed') {
		return client.channels.cache.get(botSpamChannel).send(`The Shop ${merchant} was already closed. ${closed}`)
	} else {
		shop.status = 'closed'
		await shop.save()

        const allAuctions = await Auction.findAll()
        for (let i = 0; i < allAuctions.length; i++) {
            const auction = allAuctions[i]
            await auction.destroy()
        }

        const allBids = await Bid.findAll()
        for (let i = 0; i < allBids.length; i++) {
            const bid = allBids[i]
            await bid.destroy()
        }

        await restock()
		return client.channels.cache.get(announcementsChannel).send(`Good evening, <@&${fpRole}>, The Shop ${merchant} is now closed! ${closed}`)
	} 
}

// CHECK SHOP OPEN
const checkShopOpen = async () => {
    const shopIsOpen = await Info.count({ where: {
        element: 'shop',
        status: 'open'
    } })

    return shopIsOpen
}

// PROCESS BIDS
const processBids = async () => {
    const channel = client.channels.cache.get(announcementsChannel)
    const allBids = await Bid.findAll({ include: Auction , order: [["amount", "DESC"]] })

    for (let i = 0; i < allBids.length; i++) {
        const bid = allBids[i]
        const wallet = await Wallet.findOne({ where: { playerId: bid.playerId }, include: Player })
        if (!wallet) continue

        const print = await Print.findOne({ where: { card_code: bid.card_code } })
        if (!print) continue

        const inv = await Inventory.findOne({ where: { 
            playerId: merchbotId,
            card_code: bid.card_code,
			quantity: { [Op.gt]: 0 }
         } })

        if (!inv) {
            channel.send(`${wallet.player.name} placed a ${bid.amount}${stardust} bid on ${print.card_name} but they were outbid.`)
            continue
        }
        if (wallet.stardust < bid.amount) {
            channel.send(`${wallet.player.name} would have won ${print.card_name} for ${bid.amount}${stardust} but they are too poor.`) 
            continue
        }
        
        const winnerInv = await Inventory.findOne({ where: {
            playerId: bid.playerId,
            card_code: bid.card_code
        }})

        if (winnerInv) {
            winnerInv.quantity++
            await winnerInv.save()
        } else {
            await Inventory.create({ 
                card_code: bid.card_code,
                quantity: 1,
                printId: print.id,
                playerId: bid.playerId
            })
        }

        wallet.stardust -= bid.amount
        await wallet.save()

        inv.quantity--
        await inv.save()

        const newPrice = ( bid.amount + 15 * print.market_price ) / 16
        print.market_price = newPrice
        await print.save()

        await bid.destroy()
        channel.send(`<@${wallet.player.id}> won a copy of ${eval(print.rarity)}${print.card_code} - ${print.card_name} for ${bid.amount}${stardust}. Congratulations!`) 
    }

    const allAuctions = await Auction.findAll()
    for (let i = 0; i < allAuctions.length; i++) {
        const auction = allAuctions[i]
        await auction.destroy()
    }
}

// RESTOCK
const restock = async () => {
	const allSetsForSale = await Set.findAll({ where: { for_sale: true }})
	const newbies = await Info.findOne({ where: { element: "newbies" }})

	let weightedCount = -10 * newbies.count

	for (let i = 0; i < allSetsForSale.length; i++) {
		const set = allSetsForSale[i]
		if (set.type === 'core' || set.type === 'mini') {
			if (set.currency === 'starchips') {
				weightedCount += set.unit_sales
			} else {
				weightedCount += (set.unit_sales / 2)
			}
		} else if (set.type === 'starter_deck') {
			if (set.currency === 'starchips') {
				weightedCount += (set.unit_sales * 5)
			} else {
				weightedCount += (set.unit_sales * 5 / 2)
			}
		}

        set.unit_sales = 0
        await set.save()
        newbies.count = 0
        await newbies.save()
	}

    if (weightedCount < 1) weightedCount = 1
	const count = Math.ceil(weightedCount / 8)
    const newlyInStock = await awardPacksToShop(count)
    if (!newlyInStock) return client.channels.cache.get(shopChannel).send(`Error awarding ${count} packs to shop.`)
    else return postBids(newlyInStock)
}

// UPDATE SHOP
const updateShop = async () => {
    const channel = client.channels.cache.get(shopChannel)
    channel.bulkDelete(100)

    setTimeout(() => {
        channel.bulkDelete(100)
    }, 2000)
    
    setTimeout(() => {
        channel.bulkDelete(100)
    }, 4000)

    setTimeout(async () => {
        const results = [
            `Good day, The Shop ${merchant} is open. ${open}`,
            `\n${master} --- Core Products --- ${master}`
        ]
    
        const setsForSale = await Set.findAll({ 
            where: { 
                for_sale: true
             }
        })

        for (let i = 0; i < setsForSale.length; i++) {
            const set = setsForSale[i]
            if (set.type === 'core') {
                results.push(`${set.box_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Box`)
                results.push(`${set.unit_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Pack`)
            }
        }
    
        for (let i = 0; i < setsForSale.length; i++) {
            const set = setsForSale[i]
            if (set.type === 'starter_deck') {
                if (set.name === 'Starter Series 1') {
                    results.push(`${set.unit_price}${eval(set.currency)} - Fish's Ire ${eval(set.emoji)} - Starter`)
                    results.push(`${set.unit_price}${eval(set.currency)} - Rock's Foundation ${eval(set.alt_emoji)} - Starter`)
                }
            }
        }

        const shopInv = await Inventory.findAll({ 
            where: { 
                playerId: merchbotId,
                quantity: {
                    [Op.gte]: 1
                }
             },
            include: Print,
            order: [[Print, 'market_price', 'DESC']]
        })

        results.push(`\n${ygocard} --- Single Cards --- ${ygocard}`)
    
        for (let i = 0; i < shopInv.length; i++) {
            const row = shopInv[i]
            const market_price = row.print.market_price
            const selling_price = Math.ceil(market_price * 1.1)
            const buying_price = Math.ceil(market_price * 0.7)
            results.push(`${selling_price}${stardust}| ${buying_price}${stardust}-${eval(row.print.rarity)}${row.card_code} - ${row.print.card_name} - ${row.quantity}`) 
        }
    
        for (let i = 0; i < results.length; i += 10) client.channels.cache.get(shopChannel).send(results.slice(i, i+10))
    }, 5000)
}

// POST BIDS
const postBids = async (newlyInStock) => {
    const channel = client.channels.cache.get(shopChannel)
    channel.bulkDelete(100)
    
    setTimeout(() => {
        channel.bulkDelete(100)
    }, 2000)
    
    setTimeout(() => {
        channel.bulkDelete(100)
    }, 4000)

    setTimeout(async () => {
        const results = [
            `Good evening, The Shop ${merchant} is closed. ${closed}`,
            `\n${master} --- Core Products --- ${master}`
        ]
    
        const setsForSale = await Set.findAll({ 
            where: { 
                for_sale: true
             }
        })

        for (let i = 0; i < setsForSale.length; i++) {
            const set = setsForSale[i]
            if (set.type === 'core') {
                results.push(`${set.box_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Box`)
                results.push(`${set.unit_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Pack`)
            }
        }
    
        for (let i = 0; i < setsForSale.length; i++) {
            const set = setsForSale[i]
            if (set.type === 'starter_deck') {
                if (set.name === 'Starter Series 1') {
                    results.push(`${set.unit_price}${eval(set.currency)} - Fish's Ire ${eval(set.emoji)} - Starter`)
                    results.push(`${set.unit_price}${eval(set.currency)} - Rock's Foundation ${eval(set.alt_emoji)} - Starter`)
                }
            }
        }

        results.push(`\n${ygocard} --- Singles Auction --- ${ygocard}`)
    
        if (!newlyInStock.length) results.push('N/A')
        for (let i = 0; i < newlyInStock.length; i++) {
            const card_code = newlyInStock[i]
            const row = await Inventory.findOne({
                where: {
                    playerId: merchbotId,
                    card_code
                }, include: Print
            })
            const market_price = row.print.market_price
            const selling_price = Math.ceil(market_price * 1.1)
            const buying_price = Math.ceil(market_price * 0.7)
            results.push(`${selling_price}${stardust}| ${buying_price}${stardust}-${eval(row.print.rarity)}${row.card_code} - ${row.print.card_name} - ${row.quantity}`) 
        }
    
        for (let i = 0; i < results.length; i += 10) channel.send(results.slice(i, i+10))
    }, 5000)
}

// ASK FOR DUMP CONFIRMATION
const askForDumpConfirmation = async (message, set_code, cards, compensation) => {
    cards.unshift(`Are you sure you want to sell the following ${set_code} ${eval(set_code)} cards:`)
    for (let i = 0; i < cards.length; i+=30) {
        message.channel.send(cards.slice(i, i+30).join("\n"))
    }
    const filter = m => m.author.id === message.author.id
    const msg = await message.channel.send(`To The Shop for ${compensation}${stardust}?`)
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 60000
    }).then(async collected => {
        if (yescom.includes(collected.first().content.toLowerCase())) {
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

// GET DUMP RARITY
const getDumpRarity = async (message) => {
    let rarity
    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`What rarity would you like to bulk sell?\n(1) all\n(2) common\n(3) rare\n(4) super\n(5) ultra\n(6) secret`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
		const response = collected.first().content.toLowerCase()
        if(response.includes('all') || response.includes('any') || response.includes('1')) rarity = 'all'
        else if(response.includes('com') || response.includes('2')) rarity = 'com' 
        else if(response.includes('rar') || response.includes('3')) rarity = 'rar'
        else if(response.includes('sur') || response.includes('4')) rarity = 'sup'
        else if(response.includes('ult') || response.includes('5')) rarity = 'ult'
        else if(response.includes('sec') || response.includes('scr') || response.includes('6')) rarity = 'scr'
        else rarity = 'unrecognized'
    }).catch(err => {
		console.log(err)
        return message.channel.send(`Sorry, time's up.`)
	})

    return rarity
}

// GET DUMP QUANTITY
const getDumpQuantity = async (message, rarity) => {
    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`How many of each ${rarity === 'all' ? 'card' : eval(rarity)} do you want to keep?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
		const response = Math.round(parseInt(collected.first().content.toLowerCase()))
        if (!isFinite(response) && response > 0) {
            message.channel.send(`Please provide a positive number.`)
            return false
        } else {
            return response
        }

    }).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}

module.exports = {
    askForDumpConfirmation,
    checkShopOpen,
    closeShop,
    getDumpRarity,
    getDumpQuantity,
    openShop,
    postBids,
    updateShop
}
