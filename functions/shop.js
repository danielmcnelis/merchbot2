
const { Auction, Bid, Card, Match, Player, Tournament, Print, Set, Wallet, Diary, Inventory, Arena, Trivia, Keeper, Gauntlet, Draft, Daily, Binder, Wishlist, Profile, Info } = require('../db')
const merchbotId = '584215266586525696'
const { Op } = require('sequelize')
const { nocom, yescom } = require('../static/commands.json')
const { gem, orb, swords, beast, blue, bronze, cactus, cavebob, checkmark, closed, com, credits, cultured, diamond, dinosaur, DOC, egg, emptybox, evil, FiC, fire, fish, god, gold, hook, koolaid, leatherbound, legend, lmfao, mad, master, merchant, milleye, moai, mushroom, no, open, ORF, TEB, warrior, spellcaster, dragon, plant, platinum, rar, red, reptile, rock, rocks, rose, sad, scr, silver, soldier, starchips, stardust, stare, stoned, sup, tix, ult, wokeaf, yellow, yes, ygocard } = require('../static/emojis.json')
const { awardPacksToShop } = require('./packs')
const adminId = '194147938786738176'
const { client } = require('../static/clients.js')
const { fpRole } = require('../static/roles.json')
const { announcementsChannelId, botSpamChannelId, shopChannelId, staffChannelId } = require('../static/channels.json')
const { completeTask } = require('./diary.js')
const { findCard } = require('./search.js')
const { selectPrint } = require('./print.js')
const decks = require('../static/decks.json')

// OPEN SHOP
const openShop = async () => {
	const shop = await Info.findOne({ where: { element: 'shop' }})
	if (!shop) return client.channels.cache.get(botSpamChannelId).send(`Could not find game element: "shop".`)

	if (shop.status === 'open') {
		return client.channels.cache.get(botSpamChannelId).send(`The Shop ${merchant} was already open. ${open}`)
	} else {
		shop.status = 'open'
		await shop.save()
        await processBids()
        updateShop()
        client.channels.cache.get(announcementsChannelId).send(`Good morning, <@&${fpRole}>, The Shop ${merchant} is now open! ${open}`)
        const shopCountdown = getShopCountdown()
		return setTimeout(() => closeShop(), shopCountdown)
	} 
}

// CLOSE SHOP
const closeShop = async () => {
    const shop = await Info.findOne({ where: { element: 'shop' }})
	if (!shop) return client.channels.cache.get(botSpamChannelId).send(`Could not find game element: "shop".`)
	if (shop.status === 'closed') {
		return client.channels.cache.get(botSpamChannelId).send(`The Shop ${merchant} was already closed. ${closed}`)
	} else {
		shop.status = 'closed'
		await shop.save()

        const allBids = await Bid.findAll()
        for (let i = 0; i < allBids.length; i++) {
            const bid = allBids[i]
            await bid.destroy()
        }

        await restock()
		client.channels.cache.get(announcementsChannelId).send(`Good evening, <@&${fpRole}>, The Shop ${merchant} is now closed! ${closed}`)
        const shopCountdown = getShopCountdown()
        return setTimeout(() => openShop(), shopCountdown)
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

// GET SHOP COUNTDOWN
const getShopCountdown = () => {
	const date = new Date()
	const day = date.getDay()
	const hours = date.getHours()
	const mins = date.getMinutes()

	let hoursLeftInPeriod
	const minsLeftInPeriod = 60 - mins

	if ((day === 6 && hours >= 14) || day === 0 || day === 1 || (day === 2 && hours < 16)) {
        hoursLeftInPeriod = day === 6 ? 23 - hours + 24 * 2 + 16 :
			day === 0 ? 23 - hours + 24 + 16 :
			day === 1 ? 23 - hours + 16 :
			day === 2 ? 15 - hours :
			null
	} else if ((day === 2 && hours >= 16) || (day === 3 && hours < 8)) {
        hoursLeftInPeriod = day === 2 ? 23 - hours + 8 :
            day === 3 ? 7 - hours :
            null
    } else if ((day === 3 && hours >= 8) || day === 4 || (day === 5 && hours < 22)) {
        hoursLeftInPeriod = day === 3 ? 23 - hours + 24 + 22 :
			day === 4 ? 23 - hours + 22 :
			day === 5 ? 21 - hours :
			null
    } else if ((day === 5 && hours >= 22) || (day === 6 && hours < 14)) {
        hoursLeftInPeriod = day === 5 ? 23 - hours + 14 :
            day === 6 ? 13 - hours :
            null
    }

    const shopCountdown = ( hoursLeftInPeriod * 60 + minsLeftInPeriod ) * 60 * 1000
    return shopCountdown
}

//CHECK SHOP SHOULD BE
const checkShopShouldBe = () => {
	const date = new Date()
	const day = date.getDay()
	const hours = date.getHours()
    
    let shopShouldBe
    if ((day === 6 && hours >= 14) || day === 0 || day === 1 || (day === 2 && hours < 16)) {
        shopShouldBe = 'open'
    } else if ((day === 2 && hours >= 16) || (day === 3 && hours < 8)) {
        shopShouldBe = 'closed'
    } else if ((day === 3 && hours >= 8) || day === 4 || (day === 5 && hours < 22)) {
        shopShouldBe = 'open'
    } else if ((day === 5 && hours >= 22) || (day === 6 && hours < 14)) {
        shopShouldBe = 'closed'
    } else {
        return false
    }

    return shopShouldBe
}

// PROCESS BIDS
const processBids = async () => {
    const announcementsChannel = client.channels.cache.get(announcementsChannelId)
    const botSpamChannel = client.channels.cache.get(botSpamChannelId)
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
            announcementsChannel.send(`${wallet.player.name} placed a ${bid.amount}${stardust} bid on ${print.card_name} but they were outbid.`)
            continue
        }
        if (wallet.stardust < bid.amount) {
            announcementsChannel.send(`${wallet.player.name} would have won ${print.card_name} for ${bid.amount}${stardust} but they are too poor.`) 
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

        const newPrice = ( bid.amount + print.market_price ) / 2
        print.market_price = newPrice
        await print.save()

        await bid.destroy()

        if (print.rarity !== 'com' && print.rarity !== 'rar') completeTask(botSpamChannel, wallet.player.id, 'm5')
        if (print.rarity === 'scr') completeTask(botSpamChannel, wallet.player.id, 'm4', 4000)
        if (print.set_code === 'APC' && winnerInv && winnerInv.quantity >= 3) completeTask(botSpamChannel, wallet.player.id, 'h5', 4000)
        announcementsChannel.send(`<@${wallet.player.id}> won a copy of ${eval(print.rarity)}${print.card_code} - ${print.card_name} for ${bid.amount}${stardust}. Congratulations!`) 
    }

    const allAuctions = await Auction.findAll()
    for (let i = 0; i < allAuctions.length; i++) {
        const auction = allAuctions[i]
        await auction.destroy()
    }

    for (let i = 0; i < allBids.length; i++) {
        const bid = allBids[i]
        await bid.destroy()
    }
}

// RESTOCK
const restock = async () => {
	const allSetsForSale = await Set.findAll({ where: { for_sale: true }, order: [['createdAt', 'DESC']]})

	let weightedCount = 0
    let most_recent = false

	for (let i = 0; i < allSetsForSale.length; i++) {
		const set = allSetsForSale[i]
		if (set.type === 'core') {
            if (!most_recent) most_recent = 'core'
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
		} else if (set.type === 'mini') {
            if (!most_recent) most_recent = 'mini'
			if (set.currency === 'starchips') {
				weightedCount += (set.unit_sales * 2 / 3)
			} else {
				weightedCount += (set.unit_sales / 3)
			}
		}

        set.unit_sales = 0
        await set.save()
	}

    if (weightedCount < 1) weightedCount = 1
    const core_count = most_recent === 'core' ?  Math.ceil(weightedCount / 8) : Math.ceil(weightedCount / 16)
    const mini_count = Math.ceil(weightedCount * 3 / 32)
    const corePacksAwarded = await awardPacksToShop(core_count, core = true)
    const miniPacksAwarded = await awardPacksToShop(mini_count, core = false)
    if (!corePacksAwarded) client.channels.cache.get(shopChannelId).send(`Error awarding ${core_count} packs to shop.`)
    if (!miniPacksAwarded) client.channels.cache.get(shopChannelId).send(`Error awarding ${mini_count} packs to shop.`)
    else return postBids()
}

// CALCULATE BOX PRICE
const calcBoxPrice = async () => {
	const sets = await Set.findAll({ where: {
         currency: 'stardust',
         for_sale: true
    } })

	if(!sets.length) return console.log(`No sets are currently being sold for stardust.`)	

    for (let i = 0; i < sets.length; i++) {
        const set = sets[i]
        const set_code = set.code

        if (set.type === 'core' || set.type === 'mini') {
            const commons = await Print.findAll({ where: { set_code: set_code, rarity: "com" } }).map((p) => Math.ceil(parseInt(p.market_price)))
            const rares = await Print.findAll({ where: { set_code: set_code, rarity: "rar" } }).map((p) => Math.ceil(parseInt(p.market_price)))
            const supers = await Print.findAll({ where: { set_code: set_code, rarity: "sup", card_slot: { [Op.lt]: 200 } } }).map((p) => Math.ceil(parseInt(p.market_price)))
            const ultras = await Print.findAll({ where: { set_code: set_code, rarity: "ult" } }).map((p) => Math.ceil(parseInt(p.market_price)))
            const secrets = await Print.findAll({ where: { set_code: set_code, rarity: "scr" } }).map((p) => Math.ceil(parseInt(p.market_price)))
            const avgComPrice = commons.length ? commons.reduce((a, b) => a + b) / commons.length : 0
            const avgRarPrice = rares.length ? rares.reduce((a, b) => a + b) / rares.length : 0
            const avgSupPrice = supers.length ? supers.reduce((a, b) => a + b) / supers.length : 0
            const avgUltPrice = ultras.length ? ultras.reduce((a, b) => a + b) / ultras.length : 0
            const avgScrPrice = secrets.length ? secrets.reduce((a, b) => a + b) / secrets.length : 0
            const avgBoxPrice = (avgComPrice * set.commons_per_box) 
                + (avgRarPrice * set.rares_per_box) 
                + (avgSupPrice * set.supers_per_box) 
                + (avgUltPrice * set.ultras_per_box) 
                + (avgScrPrice * set.secrets_per_box) 
    
            const avgPackPrice = avgBoxPrice / set.packs_per_box
    
            console.log('10 * Math.round(1.1 * avgPackPrice / 10)', 10 * Math.round(1.1 * avgPackPrice / 10))
            console.log('100 * Math.round(21 * 1.1 * avgPackPrice / 100)', 100 * Math.round(21 * 1.1 * avgPackPrice / 100))
    
            set.unit_price = 10 * Math.round(1.1 * avgPackPrice / 10)
            set.box_price = 100 * Math.round(21 * 1.1 * avgPackPrice / 100)
            await set.save()
        } else if (set.type === 'starter_deck') {
            const prints = await Print.findAll({ where: { set_code: set_code }})
            let deck1Price = 0
            let deck2Price = 0
            let deck1
            let deck2

            const deck_names = Object.keys(decks)
            deck_names.forEach((d) => {
                if(decks[d].set_code === set_code) {
                    if (!deck1) deck1 = d
                    else deck2 = d
                }
            })
            
            for (let i = 0; i < prints.length; i++) {
                const print = prints[i]
                const market_price = print.market_price
                const d1quantity = decks[deck1].cards[print.card_code] || 0
                const d2quantity = decks[deck2].cards[print.card_code] || 0
                deck1Price += (d1quantity * Math.ceil(market_price))
                deck2Price += (d2quantity * Math.ceil(market_price))
            }

            const avgDeckPrice = (deck1Price + deck2Price) / 2
            set.unit_price = 10 * Math.round(1.1 * avgDeckPrice / 10)
            await set.save()
        }
    }
}

// UPDATE SHOP
const updateShop = async () => {
    await calcBoxPrice()
    const shopChannel = client.channels.cache.get(shopChannelId)
    shopChannel.bulkDelete(100)

    setTimeout(() => {
        shopChannel.bulkDelete(100)
    }, 2000)
    
    setTimeout(() => {
        shopChannel.bulkDelete(100)
    }, 4000)

    setTimeout(async () => {
        const results = [
            `Good day, The Shop ${merchant} is open. ${open}`,
            `\n${master} --- Core Products --- ${master}`
        ]
    
        const setsForSale = await Set.findAll({ 
            where: { 
                for_sale: true
             },
             order: [['createdAt', 'DESC']]
        })

        for (let i = 0; i < setsForSale.length; i++) {
            const set = setsForSale[i]
            if (set.type === 'core') {
                results.push(`${set.box_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Box`)
                if (set.specs_for_sale) results.push(`${set.spec_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - SE`)
                results.push(`${set.unit_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Pack`)
            } else if (set.type === 'mini') {
                results.push(`${set.unit_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Pack`)
            }
        }
    
        for (let i = 0; i < setsForSale.length; i++) {
            const set = setsForSale[i]
            if (set.type === 'starter_deck') {
                if (set.name === 'Starter Series 1') {
                    results.push(`${set.unit_price}${eval(set.currency)} - Fish's Ire ${eval(set.emoji)} - Deck`)
                    results.push(`${set.unit_price}${eval(set.currency)} - Rock's Foundation ${eval(set.alt_emoji)} - Deck`)
                } else if (set.name === 'Starter Series 2') {
                    results.push(`${set.unit_price}${eval(set.currency)} - Dinosaur's Power ${eval(set.emoji)} - Deck`)
                    results.push(`${set.unit_price}${eval(set.currency)} - Plant's Harmony ${eval(set.alt_emoji)} - Deck`)
                } else if (set.name === 'Starter Series 3') {
                    results.push(`${set.unit_price}${eval(set.currency)} - Dragon's Inferno ${eval(set.emoji)} - Deck`)
                    results.push(`${set.unit_price}${eval(set.currency)} - Spellcaster's Art ${eval(set.alt_emoji)} - Deck`)
                }
            }
        }

        const auctions = await Auction.findAll()
        const auction_printIds = auctions.map((a) => a.printId)

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
            const inv = shopInv[i]
            const print = inv.print
            const excluded = !!auction_printIds.includes(print.id)
            const market_price = print.market_price
            const selling_price = Math.ceil(market_price * 1.1)
            const buying_price = Math.ceil(market_price * 0.7)
            results.push(`${selling_price}${stardust}| ${buying_price}${stardust}-${eval(print.rarity)}${inv.card_code} - ${print.card_name} - ${inv.quantity}${excluded ? ` - ${no}` : ''}`) 
        }
    
        for (let i = 0; i < results.length; i += 10) shopChannel.send(results.slice(i, i+10))
    }, 5000)
}

// POST BIDS
const postBids = async () => {
    const shopChannel = client.channels.cache.get(shopChannelId)
    shopChannel.bulkDelete(100)
    
    setTimeout(() => {
        shopChannel.bulkDelete(100)
    }, 2000)
    
    setTimeout(() => {
        shopChannel.bulkDelete(100)
    }, 4000)

    setTimeout(async () => {
        const results = [
            `Good evening, The Shop ${merchant} is closed. ${closed}`,
            `\n${master} --- Core Products --- ${master}`
        ]
    
        const setsForSale = await Set.findAll({ 
            where: { 
                for_sale: true
             },
             order: [['createdAt', 'DESC']]
        })

        for (let i = 0; i < setsForSale.length; i++) {
            const set = setsForSale[i]
            if (set.type === 'core') {
                results.push(`${set.box_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Box`)
                if (set.specs_for_sale) results.push(`${set.spec_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - SE`)
                results.push(`${set.unit_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Pack`)
            } else if (set.type === 'mini') {
                results.push(`${set.unit_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Pack`)
            }
        }
    
        for (let i = 0; i < setsForSale.length; i++) {
            const set = setsForSale[i]
            if (set.type === 'starter_deck') {
                if (set.name === 'Starter Series 1') {
                    results.push(`${set.unit_price}${eval(set.currency)} - Fish's Ire ${eval(set.emoji)} - Deck`)
                    results.push(`${set.unit_price}${eval(set.currency)} - Rock's Foundation ${eval(set.alt_emoji)} - Deck`)
                } else if (set.name === 'Starter Series 2') {
                    results.push(`${set.unit_price}${eval(set.currency)} - Dinosaur's Power ${eval(set.emoji)} - Deck`)
                    results.push(`${set.unit_price}${eval(set.currency)} - Plant's Harmony ${eval(set.alt_emoji)} - Deck`)
                } else if (set.name === 'Starter Series 3') {
                    results.push(`${set.unit_price}${eval(set.currency)} - Dragon's Inferno ${eval(set.emoji)} - Deck`)
                    results.push(`${set.unit_price}${eval(set.currency)} - Spellcaster's Art ${eval(set.alt_emoji)} - Deck`)
                }
            }
        }

        results.push(`\n${ygocard} --- Singles Auction --- ${ygocard}`)

        const newlyInStock = await Auction.findAll({ 
            include: Print,
            order: [[Print, 'market_price', 'DESC']]
        })
    
        if (!newlyInStock.length) results.push('N/A')
        for (let i = 0; i < newlyInStock.length; i++) {
            const card_code = newlyInStock[i].card_code
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
    
        for (let i = 0; i < results.length; i += 10) shopChannel.send(results.slice(i, i+10))
    }, 5000)
}

// ASK FOR DUMP CONFIRMATION
const askForDumpConfirmation = async (message, set, cards, compensation) => {
    cards.unshift(`Are you sure you want to sell the following ${set.code} ${set.emoji === set.alt_emoji ? eval(set.emoji) : `${eval(set.emoji)} ${eval(set.alt_emoji)}`} cards:`)
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
        if (!Number.isInteger(response) || response < 0) {
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



// ASK FOR EXCLUSIONS
const askForExclusions = async (message, rarity, set_code) => {
    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`Do you want to exclude any cards?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
        const response = collected.first().content.toLowerCase()
        if (yescom.includes(response)) {
            return true
        } else if (nocom.includes(response)) {
            return false
        } else {
            message.channel.send(`I'll take that as a yes.`)
            return true
        }
    }).catch(err => {
		console.log(err)
        return false
	})

    return collected
}


// GET EXCLUSIONS
const getExclusions = async (message, rarity, set) => {
    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`Please provide a list of ${rarity === 'all' ? '' : eval(rarity)}${set.code} ${set.emoji === set.alt_emoji ? eval(set.emoji) : `${eval(set.emoji)} ${eval(set.alt_emoji)}`} cards you do not want to bulk sell.`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 60000
    }).then(async collected => {
		const response = collected.first().content.toLowerCase()
        if (response.startsWith('!')) {
            message.channel.send(`Please do not respond with bot commands. Simply type what you would like to exclude.`)
            return false
        } else {
            return collected.first().content.split(';')
        }
    }).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}

// GET EXCLUDED PRINTS
const getExcludedPrintIds = async (message, rarity, set, exclusions, fuzzyPrints) => {
    const playerId = message.author.id
    const printIds = []

    for (let i = 0; i < exclusions.length; i++) {
        const query = exclusions[i].split(' ').filter((el) => el !== '').join(' ')
		const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
		const card_name = await findCard(query, fuzzyPrints)
		const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
	
		const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) :
                    card_name ? await selectPrint(message, playerId, card_name) :
                    null
		
        if (!print) {
            message.channel.send(`Sorry, I do not recognize the card: "${query}".`)
            return false
        }

        if (print.setId !== set.id || (rarity !== 'all' && print.rarity !== rarity)) {
            message.channel.send(`Sorry, "${query}" A.K.A. ${print.card_name} is not a ${rarity === 'all' ? '' : eval(rarity)}${set.code} ${set.emoji === set.alt_emoji ? eval(set.emoji) : eval(set.emoji), eval(set.alt_emoji)} card.`)
            return false
        }

        else printIds.push(print.id)
    }

    return printIds
}

// GET BARTER DIRECTION
const getBarterDirection = async (message) => {
    const options = [
        `(1) A Card`,
        `(2) Vouchers`,
    ]

    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`What would you like to **receive** in this exchange?\n${options.join("\n")}`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
		const response = collected.first().content.toLowerCase()
        let direction
        if(response.includes('1') || response.includes('card')) {
            direction = 'get_card'
        } else if(response.includes('2') || response.includes('vouch')) {
            direction = 'get_vouchers'
        } else {
            message.channel.send(`You did not select a valid option.`)
            return false
        }

        return direction
    }).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}

// GET VOUCHER
const getVoucher = async (message) => {
    const options = [
        `(1) Mushrooms ${mushroom}`,
        `(2) Moai ${moai}`,
        `(3) Roses ${rose}`,
        `(4) Hooks ${hook}`,
        `(5) Eggs ${egg}`,
        `(6) Cacti ${cactus}`,
        `(7) Swords ${swords}`,
        `(8) Orbs ${orb}`,
        `(9) Gems ${gem}`
    ]

    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`Which Voucher would you like to exchange?\n${options.join("\n")}`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
		const response = collected.first().content.toLowerCase()
        let voucher
        if(response.includes('1') || response.includes('mush') || response.includes('shroom')) {
            voucher = 'mushroom'
        } else if(response.includes('2') || response.includes('moai')) {
            voucher = 'moai'
        } else if(response.includes('3') || response.includes('rose')) {
            voucher = 'rose'
        } else if(response.includes('4') || response.includes('hook')) {
            voucher = 'hook'
        } else if(response.includes('5') || response.includes('egg')) {
            voucher = 'egg'
        } else if(response.includes('6') || response.includes('cact')) {
            voucher = 'cactus'
        } else if(response.includes('7') || response.includes('sword')) {
            voucher = 'swords'
        } else if(response.includes('8') || response.includes('orb')) {
            voucher = 'orb'
        } else if(response.includes('9') || response.includes('gem')) {
            voucher = 'gem'
        } else {
            message.channel.send(`You did not select a valid option.`)
            return false
        }

        return voucher
    }).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}


// GET BARTER CARD
const getBarterCard = async (message, voucher, medium_complete) => {
    const wares = {
        mushroom: {
            original: [10, 'APC-001', `(1) ${ult}APC-001 - Desmanian Devil - 10 ${mushroom}`],
            unlocked: [
                10, 'DOC-180', `(2) ${ult}DOC-180 - Peropero Cerperus - 10 ${mushroom}`,
                10, 'TEB-135', `(3) ${ult}TEB-135 - Green Baboon, Defender of the Forest - 20 ${mushroom}`,
                20, 'ORF-046', `(4) ${ult}ORF-046 - X-Saber Airbellum - 20 ${mushroom}`
            ]
        },
        moai: {
            original: [10, 'APC-002', `(1) ${ult}APC-002 - Koa'ki Meiru Guardian - 10 ${moai}`],
            unlocked: [
                10, 'DOC-174', `(2) ${ult}DOC-174 - Block Golem - 10 ${moai}`
            ]
        },
        rose: {
            original: [10, 'APC-003', `(1) ${ult}APC-003 - Rose Lover - 10 ${rose}`],
            unlocked: [
                10, 'DOC-178', `(2) ${ult}DOC-178 - Mardel, Generaider Boss of Light - 10 ${rose}`,
                10, 'TEB-134', `(3) ${ult}TEB-134 - Dandylion - 10 ${rose}`
            ]
        },
        hook: {
            original: [10, 'APC-004', `(1) ${ult}APC-004 - Moray of Greed - 10 ${hook}`],
            unlocked: [
                10, 'DOC-181', `(2) ${ult}DOC-181 - Sharkraken - 10 ${hook}`,
                10, 'TEB-132', `(3) ${ult}TEB-132 - Citadel Whale - 10 ${hook}`
            ]
        },
        egg: {
            original: [10, 'APC-005', `(1) ${ult}APC-005 - Spacetime Transcendence - 10 ${egg}`],
            unlocked: [
                10, 'DOC-176', `(2) ${ult}DOC-176 - Giant Rex - 10 ${egg}`
            ]
        },
        cactus: {
            original: [10, 'APC-006', `(1) ${ult}APC-006 - Viper's Rebirth - 10 ${cactus}`],
            unlocked: [
                10, 'DOC-177', `(2) ${ult}DOC-177 - Ipiria - 10 ${cactus}`,
                10, 'DOC-182', `(3) ${ult}DOC-182 - Sinister Serpent - 10 ${cactus}`,
                10, 'DOC-185', `(4) ${ult}DOC-185 - Worm Xex - 10 ${cactus}`
            ]
        },
        swords: {
            original: [10, 'APC-007', `(1) ${ult}APC-007 - Sublimation Knight - 10 ${swords}`],
            unlocked: [
                20, 'ORF-047', `(2) ${ult}ORF-047 - Elemental HERO Nova Master - 20 ${swords}`,
                30, 'DOC-188', `(3) ${ult}DOC-188 - Reinforcement of the Army - 30 ${swords}`,
                40, 'TEB-136', `(4) ${ult}TEB-136 - Infernoble Knight - Roland - 40 ${swords}`
            ]
        },
        orb: {
            original: [10, 'APC-008', `(1) ${ult}APC-008 - Spellbook of Knowledge - 10 ${orb}`],
            unlocked: [
                10, 'TEB-130', `(2) ${ult}TEB-130 - Altergeist Meluseek - 10 ${orb}`,
                20, 'DOC-175', `(3) ${ult}DOC-175 - Breaker the Magical Warrior - 20 ${orb}`,
                20, 'TEB-137', `(4) ${ult}TEB-137 - Shaddoll Dragon - 20 ${orb}`
            ]
        },
        gem: {
            original: [10, 'APC-009', `(1) ${ult}APC-009 - Guardragon Cataclysm - 10 ${gem}`],
            unlocked: [,
                10, 'TEB-141', `(2) ${ult}TEB-141 - Dragon Ravine - 10 ${gem}`
            ]
        }
    }

    const options = medium_complete ? [wares[voucher].original, wares[voucher].unlocked] : [wares[voucher].original]
    if (options.length === 1) return options[0]
    const cards = options.map((o) => o[2])

    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`Which card would you like to barter for?\n${cards.join("\n")}`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
		const response = collected.first().content.toLowerCase()
        let index
        if(response.includes('1') || response.includes('APC')) {
            index = 0
        } else if(response.includes('2')) {
            index = 1
        } else if(response.includes('3')) {
            index = 2
        } else if(response.includes('4')) {
            index = 3
        } else {
            return false
        }

        const selected_option = options[index]
        return selected_option
    }).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}


// GET TRADE-IN CARD
const getTradeInCard = async (message, medium_complete) => {
    const options = [
        [10, 'APC-001', `(1) ${ult}APC-001 - Desmanian Devil - 10 ${mushroom}`, 'mushroom'],
        [10, 'APC-002', `(2) ${ult}APC-002 - Koa'ki Meiru Guardian - 10 ${moai}`, 'moai'],
        [10, 'APC-003', `(3) ${ult}APC-003 - Rose Lover - 10 ${rose}`, 'rose'],
        [10, 'APC-004', `(4) ${ult}APC-004 - Moray of Greed - 10 ${hook}`, 'hook'],
        [10, 'APC-005', `(5) ${ult}APC-005 - Spacetime Transcendence - 10 ${egg}`, 'egg'],
        [10, 'APC-006', `(6) ${ult}APC-006 - Viper's Rebirth - 10 ${cactus}`, 'cactus'],
        [10, 'APC-007', `(7) ${ult}APC-007 - Sublimation Knight - 10 ${swords}`, 'swords'],
        [10, 'APC-008', `(8) ${ult}APC-008 - Spellbook of Knowledge - 10 ${orb}`, 'orb'],
        [10, 'APC-009', `(9) ${ult}APC-009 - Guardragon Cataclysm - 10 ${gem}`, 'gem']
    ]

    const cards = options.map((o) => o[2])

    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`Which card would you like to trade-in?\n${cards.join("\n")}`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
		const response = collected.first().content.toLowerCase()
        let index
        if(response.includes('1') || response.includes('APC-001') || response.includes('devil') || response.includes('desm')) {
            index = 0
        } else if(response.includes('2') || response.includes('APC-002') || response.includes('koa') || response.includes('guardian')) {
            index = 1
        } else if(response.includes('3') || response.includes('APC-003') || response.includes('rose') || response.includes('lover')) {
            index = 2
        } else if(response.includes('4') || response.includes('APC-004') || response.includes('moray') || response.includes('greed')) {
            index = 3
        } else if(response.includes('5') || response.includes('APC-005') || response.includes('space') || response.includes('trans')) {
            index = 4
        } else if(response.includes('6') || response.includes('APC-006') || response.includes('viper') || response.includes('rebirth')) {
            index = 5
        } else if(response.includes('7') || response.includes('APC-007') || response.includes('sublim') || response.includes('knight')) {
            index = 6
        } else if(response.includes('8') || response.includes('APC-008') || response.includes('book') || response.includes('know')) {
            index = 7
        } else if(response.includes('9') || response.includes('APC-009') || response.includes('drag') || response.includes('cata')) {
            index = 8
        } else {
            message.channel.send(`You did not select a valid option.`)
            return false
        }

        const selected_option = options[index]
        return selected_option
    }).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}


// ASK FOR BARTER CONFIRMATION
const askForBarterConfirmation = async (message, voucher, card, price, direction) => {
    const prompt = direction === 'get_card' ? `Are you sure you want to exchange ${price} ${eval(voucher)} for a copy of ${card}?` :
        `Are you sure you want to exchange a copy of ${card} for ${price} ${eval(voucher)}?`
        
    const filter = m => m.author.id === message.author.id
    const msg = await message.channel.send(prompt)
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 15000
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


module.exports = {
    askForBarterConfirmation,
    askForDumpConfirmation,
    askForExclusions,
    checkShopOpen,
    checkShopShouldBe,
    closeShop,
    getBarterCard,
    getBarterDirection,
    getDumpRarity,
    getDumpQuantity,
    getExclusions,
    getExcludedPrintIds,
    getTradeInCard,
    getShopCountdown,
    getVoucher,
    openShop,
    postBids,
    updateShop
}
