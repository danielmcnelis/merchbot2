
const { Auction, Bid, Card, Match, Player, Tournament, Print, Set, Status, Wallet, Diary, Inventory, Arena, Trivia, Keeper, Gauntlet, Draft, Daily, Binder, Wishlist, Profile, Info } = require('../db')
const merchbotId = '584215266586525696'
const { Op } = require('sequelize')
const { nocom, yescom } = require('../static/commands.json')
const { downward, upward, forgestone, gem, orb, swords, beast, blue, bronze, DRT, fiend, thunder, zombie, skull, familiar, battery, cactus, cavebob, checkmark, closed, com, credits, cultured, diamond, dinosaur, DOC, LPK, egg, emptybox, evil, FiC, fire, fish, god, gold, hook, koolaid, leatherbound, legend, lmfao, mad, master, merchant, milleye, moai, mushroom, no, open, ORF, TEB, FON, warrior, spellcaster, dragon, plant, platinum, rar, red, reptile, rock, rocks, rose, sad, scr, silver, soldier, starchips, stardust, stare, stoned, stonks, sup, tix, ult, wokeaf, yellow, yes, ygocard } = require('../static/emojis.json')
const { awardPacksToShop } = require('./packs')
const adminId = '194147938786738176'
const { client } = require('../static/clients.js')
const { fpRole } = require('../static/roles.json')
const { announcementsChannelId, botSpamChannelId, shopChannelId, staffChannelId } = require('../static/channels.json')
const { completeTask } = require('./diary.js')
const { selectPrint } = require('./print.js')
const { findCard } = require('./search.js')
const { isWithinXHours } = require('./utility.js')
const decks = require('../static/decks.json')

// OPEN SHOP
const openShop = async () => {
	const shop = await Info.findOne({ where: { element: 'shop' }})
	if (!shop) return client.channels.cache.get(botSpamChannelId).send({ content: `Could not find game element: "shop".`})

	if (shop.status === 'open') {
		return client.channels.cache.get(botSpamChannelId).send({ content: `The Shop ${merchant} was already open. ${open}`})
	} else {
		shop.status = 'open'
		await shop.save()
        await processBids()
        updateShop()
        client.channels.cache.get(announcementsChannelId).send({ content: `Good morning, <@&${fpRole}>, The Shop ${merchant} is now open! ${open}`})
        const shopCountdown = getShopCountdown()
		return setTimeout(() => closeShop(), shopCountdown)
	} 
}

// CLOSE SHOP
const closeShop = async () => {
    const shop = await Info.findOne({ where: { element: 'shop' }})
	if (!shop) return client.channels.cache.get(botSpamChannelId).send({ content: `Could not find game element: "shop".`})
	if (shop.status === 'closed') {
		return client.channels.cache.get(botSpamChannelId).send({ content: `The Shop ${merchant} was already closed. ${closed}`})
	} else {
		shop.status = 'closed'
		await shop.save()

        const allBids = await Bid.findAll()
        for (let i = 0; i < allBids.length; i++) {
            const bid = allBids[i]
            await bid.destroy()
        }

        await restock()
		client.channels.cache.get(announcementsChannelId).send({ content: `Good evening, <@&${fpRole}>, The Shop ${merchant} is now closed! ${closed}`})
        const shopCountdown = getShopCountdown()
        return setTimeout(() => openShop(), shopCountdown)
	} 
}


// UNFREEZE
const unfreeze = async () => {
    const date = new Date()
	const time = date.getTime()
	const prints = await Print.findAll({ where: { frozen: true } })

    for (let i = 0; i < prints.length; i++) {
        const print = prints[i]
        const updatedAt = print.updatedAt
        if (!isWithinXHours(9, time, updatedAt)) {
            await print.save()

            const invs = await Inventory.findAll({ where: {
                printId: print.id,
                quantity: { [Op.gt]: 0 }
            }})
        
            const quants = invs.map((i) => i.quantity)
            const total = quants.length ? quants.reduce((a, b) => a + b) : 0
        
            const merchbot_inv = await Inventory.findOne({ where: {
                printId: print.id,
                quantity: { [Op.gt]: 0 },
                playerId: merchbotId
            }})
        
            const shop_pop = merchbot_inv ? merchbot_inv.quantity : 0
            const shop_percent = total ? shop_pop / total : 0
        
            const current_price = print.market_price
        
            if (shop_percent < 0.15) {
                const z_diff = ( 0.15 - shop_percent ) / 0.15
                console.log(`${print.card_code} - ${print.card_name} decayed UP (z_diff = ${z_diff}) from ${print.market_price} to ${print.market_price + (0.02 * current_price * z_diff)}`)
                print.market_price += 0.02 * current_price * z_diff
                if (z_diff > 0.3) {
                    print.trending_up = true
                } else {
                    print.trending_up = false
                }
                await print.save()
            } else if (shop_percent >= 0.15) {
                const z_diff = ( shop_percent - 0.15 ) / 0.85
                console.log(`${print.card_code} - ${print.card_name} decayed DOWN (z_diff = ${z_diff}) from ${print.market_price} to ${print.market_price - (0.06 * current_price * z_diff)}`)
                print.market_price -= 0.06 * current_price * z_diff 
                print.trending_up = false
                await print.save()
            }
        }
    }
}


// CLEAR DAILIES
const clearDailies = async () => {
    const dailies = await Daily.findAll()
    for (let i = 0; i < dailies.length; i++) {
        const daily = dailies[i]
        daily.fon_packs = 0
        await daily.save()
    }

    return setTimeout(async () => clearDailies(), 24 * 60 * 60 * 1000)
}


// APPLY PRICE DECAY
const applyPriceDecay = async () => {
	const prints = await Print.findAll({ where: { frozen: false } })
    
    for (let i = 0; i < prints.length; i++) {
        const print = prints[i]

        const invs = await Inventory.findAll({ where: {
            printId: print.id,
            quantity: { [Op.gt]: 0 }
        }})
    
        const quants = invs.map((i) => i.quantity)
        const total = quants.length ? quants.reduce((a, b) => a + b) : 0
    
        const merchbotinv = await Inventory.findOne({ where: {
            printId: print.id,
            quantity: { [Op.gt]: 0 },
            playerId: merchbotId
        }})
    
        const shop_pop = merchbotinv ? merchbotinv.quantity : 0
        const shop_percent = total ? shop_pop / total : 0
    
        const current_price = print.market_price
    
        if (shop_percent < 0.15) {
            const z_diff = ( 0.15 - shop_percent ) / 0.15
            console.log(`${print.card_code} - ${print.card_name} decayed UP (z_diff = ${z_diff}) from ${print.market_price} to ${print.market_price + (0.02 * current_price * z_diff)}`)
            print.market_price += 0.02 * current_price * z_diff
            if (print.market_price >= 40 && z_diff > 0.3) {
                print.trending_up = true
            } else {
                print.trending_up = false
            }
            print.trending_down = false
            await print.save()
        } else if (shop_percent >= 0.15) {
            const z_diff = ( shop_percent - 0.15 ) / 0.85
            console.log(`${print.card_code} - ${print.card_name} decayed DOWN (z_diff = ${z_diff}) from ${print.market_price} to ${print.market_price - (0.06 * current_price * z_diff)}`)
            print.market_price -= 0.06 * current_price * z_diff 
            if (print.market_price >= 40 && z_diff > 0.3) {
                print.trending_down = true
            } else {
                print.trending_down = false
            }
            print.trending_up = false
            await print.save()
        }
    }

    return setTimeout(async () => applyPriceDecay(), 24 * 60 * 60 * 1000)
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


// GET MIDNIGHT COUNTDOWN
const getMidnightCountdown = () => {
	const date = new Date()
	const hours = date.getHours()
	const mins = date.getMinutes()
	const minsLeftInPeriod = 60 - mins
	const hoursLeftInPeriod = 23 - hours

    const midnightCountdown = ( hoursLeftInPeriod * 60 + minsLeftInPeriod ) * 60 * 1000
    return midnightCountdown
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
            announcementsChannel.send({ content: `${wallet.player.name} placed a ${bid.amount}${stardust} bid on ${print.card_name} but they were outbid.`})
            continue
        }
        if (wallet.stardust < bid.amount) {
            announcementsChannel.send({ content: `${wallet.player.name} would have won ${print.card_name} for ${bid.amount}${stardust} but they are too poor.`}) 
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
        announcementsChannel.send({ content: `<@${wallet.player.id}> won a copy of ${eval(print.rarity)}${print.card_code} - ${print.card_name} for ${bid.amount}${stardust}. Congratulations!`}) 
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
    if (!corePacksAwarded) client.channels.cache.get(shopChannelId).send({ content: `Error awarding ${core_count} packs to shop.`})
    if (!miniPacksAwarded) client.channels.cache.get(shopChannelId).send({ content: `Error awarding ${mini_count} packs to shop.`})
    else return postBids()
}

// CALCULATE BOX PRICE
const calcBoxPrice = async () => {
	const sets = await Set.findAll({ where: {
         currency: 'stardust',
         for_sale: true
    } })

	if(!sets.length) return	

    for (let i = 0; i < sets.length; i++) {
        const set = sets[i]
        const set_code = set.code

        if (set.type === 'core' || set.type === 'mini') {
            const commons = [...await Print.findAll({ where: { set_code: set_code, rarity: "com" } })].map((p) => Math.round(p.market_price) || 1)
            const rares = [...await Print.findAll({ where: { set_code: set_code, rarity: "rar" } })].map((p) => Math.round(p.market_price) || 1)
            const supers = [...await Print.findAll({ where: { set_code: set_code, rarity: "sup" } })].filter((p) => !p.card_code.includes('-SE')).map((p) => Math.round(p.market_price) || 1)
            const ultras = [...await Print.findAll({ where: { set_code: set_code, rarity: "ult" } })].map((p) => Math.round(p.market_price) || 1)
            const secrets = [...await Print.findAll({ where: { set_code: set_code, rarity: "scr" } })].map((p) => Math.round(p.market_price) || 1)
            
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
            set.unit_price = Math.round(avgPackPrice / 10) * 10  
            set.box_price = set.type === 'core' ? Math.round(21 * set.unit_price / 100) * 100 : null
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
                const market_price = Math.round(print.market_price) || 1
                const d1quantity = decks[deck1].cards[print.card_code] || 0
                const d2quantity = decks[deck2].cards[print.card_code] || 0
                deck1Price += (d1quantity * market_price)
                deck2Price += (d2quantity * market_price)
            }

            const avgDeckPrice = (deck1Price + deck2Price) / 2
            set.unit_price = Math.round(avgDeckPrice / 10) * 10
            await set.save()
        }
    }
}

// UPDATE SHOP
const updateShop = async () => {
    await calcBoxPrice()
    await unfreeze()
    const shopChannel = client.channels.cache.get(shopChannelId)
    shopChannel.bulkDelete(100).catch((err) => console.log(err))

    setTimeout(() => {
        shopChannel.bulkDelete(100).catch((err) => console.log(err))
    }, 2000)
    
    setTimeout(() => {
        shopChannel.bulkDelete(100).catch((err) => console.log(err))
    }, 4000)

    setTimeout(() => {
        shopChannel.bulkDelete(100).catch((err) => console.log(err))
    }, 6000)

    setTimeout(() => {
        shopChannel.bulkDelete(100).catch((err) => console.log(err))
    }, 8000)

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
                } else if (set.name === 'Starter Series 4') {
                    results.push(`${set.unit_price}${eval(set.currency)} - Reptile's Charm ${eval(set.emoji)} - Deck`)
                    results.push(`${set.unit_price}${eval(set.currency)} - Warrior's Legend ${eval(set.alt_emoji)} - Deck`)
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
            const buying_price = Math.floor(market_price * 0.7) > 0 ? Math.floor(market_price * 0.7) : 1
            const selling_price = Math.floor(market_price * 1.1) > buying_price ? Math.floor(market_price * 1.1) : buying_price + 1
            results.push(`${selling_price}${stardust}| ${buying_price}${stardust}-${eval(print.rarity)}${inv.card_code} - ${print.card_name} - ${inv.quantity}${print.frozen ? " - ??????" : print.trending_up ? ` - ${upward}` : ''}${print.trending_down ? ` - ${downward}` : ''}${excluded ? ` - ${no}` : ''}`) 
        }
    
        for (let i = 0; i < results.length; i += 10) {
           try {
               shopChannel.send({ content: results.slice(i, i+10).join('\n').toString() })
           } catch (err) {
               console.log(err)
           }
        }
    }, 9000)
}

// POST BIDS
const postBids = async () => {
    await calcBoxPrice()
    await unfreeze()
    const shopChannel = client.channels.cache.get(shopChannelId)
    shopChannel.bulkDelete(100).catch((err) => console.log(err))
    
    setTimeout(() => {
        shopChannel.bulkDelete(100).catch((err) => console.log(err))
    }, 2000)
    
    setTimeout(() => {
        shopChannel.bulkDelete(100).catch((err) => console.log(err))
    }, 4000)

    setTimeout(() => {
        shopChannel.bulkDelete(100).catch((err) => console.log(err))
    }, 6000)

    setTimeout(() => {
        shopChannel.bulkDelete(100).catch((err) => console.log(err))
    }, 8000)

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
                } else if (set.name === 'Starter Series 4') {
                    results.push(`${set.unit_price}${eval(set.currency)} - Reptile's Charm ${eval(set.emoji)} - Deck`)
                    results.push(`${set.unit_price}${eval(set.currency)} - Warrior's Legend ${eval(set.alt_emoji)} - Deck`)
                }
            }
        }

        results.push(`\n???? --- Singles Auction --- ????`)

        const auctions = await Auction.findAll({ 
            include: Print,
            order: [[Print, 'market_price', 'DESC']]
        })
    
        const auction_printIds = auctions.map((a) => a.printId)

        if (!auctions.length) results.push('N/A')
        for (let i = 0; i < auctions.length; i++) {
            const card_code = auctions[i].card_code
            const inv = await Inventory.findOne({
                where: {
                    quantity: {
                        [Op.gte]: 1
                    },
                    playerId: merchbotId,
                    card_code
                }, include: Print
            })

            if (!inv) continue
            const market_price = inv.print.market_price
            const selling_price = Math.ceil(market_price * 1.1)
            const buying_price = Math.ceil(market_price * 0.7)
            results.push(`${selling_price}${stardust}| ${buying_price}${stardust}-${eval(inv.print.rarity)}${inv.card_code} - ${inv.print.card_name} - ${inv.quantity}`) 
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
            const inv = shopInv[i]
            const print = inv.print
            const excluded = !!auction_printIds.includes(print.id)
            if (excluded) continue
            const market_price = print.market_price
            const buying_price = Math.floor(market_price * 0.7) > 0 ? Math.floor(market_price * 0.7) : 1
            const selling_price = Math.floor(market_price * 1.1) > buying_price ? Math.floor(market_price * 1.1) : buying_price + 1
            results.push(`${selling_price}${stardust}| ${buying_price}${stardust}-${eval(print.rarity)}${inv.card_code} - ${print.card_name} - ${inv.quantity}${print.frozen ? " - ??????" : print.trending_up ? ` - ${upward}` : ''}${print.trending_down ? ` - ${downward}` : ''}`) 
        }
    
        for (let i = 0; i < results.length; i += 10) {
            shopChannel.send({ content: results.slice(i, i+10).join('\n').toString() })
        }
    }, 9000)
}

// ASK FOR DUMP CONFIRMATION
const askForDumpConfirmation = async (message, set, cards, compensation, count) => {
    const prompt = set && set.emoji === set.alt_emoji ? `${set.code} ${eval(set.emoji)}` :
    set && set.emoji !== set.alt_emoji ? `${set.code} ${eval(set.emoji)}${eval(set.alt_emoji)}` :
    ''

    cards.unshift(`Are you sure you want to sell the following ${count} ${prompt} cards:`)
    for (let i = 0; i < cards.length; i+=30) {
        message.channel.send({ content: cards.slice(i, i+30).join("\n")})
    }
    const filter = m => m.author.id === message.author.id
    message.channel.send({ content: `To The Shop for ${compensation}${stardust}?`})
    return await message.channel.awaitMessages({ filter,
        max: 1,
        time: 60000
    }).then((collected) => {
        const response = collected.first().content.toLowerCase()
        const confirmed = yescom.includes(response)
        if (!confirmed) message.channel.send(`Not a problem. Have a nice day.`)
        return confirmed
    }).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}

// GET DUMP RARITY
const getDumpRarity = async (message) => {
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `What rarity would you like to bulk sell?\n(1) all\n(2) common\n(3) rare\n(4) super\n(5) ultra\n(6) secret`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        const rarity = response.includes('all') || response.includes('any') || response.includes('1') ? 'all' :
        response.includes('com') || response.includes('2') ? 'com' :
        response.includes('rar') || response.includes('3') ? 'rar' :
        response.includes('sup') || response.includes('4') ? 'sup' :
        response.includes('ult') || response.includes('5') ? 'ult' :
        response.includes('sec') || response.includes('scr') || response.includes('6') ? 'scr' :
        'unrecognized'

        return rarity
    }).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})
}

// GET DUMP QUANTITY
const getDumpQuantity = async (message, rarity) => {
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `How many of each ${rarity === 'all' ? 'card' : eval(rarity)} do you want to keep?`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then((collected) => {
        const response = collected.first().content.toLowerCase()
        const num = Math.round(parseInt(response))
        if (!Number.isInteger(num) || num < 0) {
            return false
        } else {
            return num
        }
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})
}



// ASK FOR EXCLUSIONS
const askForExclusions = async (message) => {
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `Do you want to exclude any cards?`})
    return await message.channel.awaitMessages({ 
        filter,
		max: 1,
        time: 15000
    }).then((collected) => {
		const response = collected.first().content.toLowerCase()
        if (yescom.includes(response)) {
            return true
        } else if (nocom.includes(response)) {
            return false
        } else {
            message.channel.send({ content: `I'll take that as a yes.`})
            return true
        }
	}).catch((err) => {
		console.log(err)
        return false
	})
}


// GET EXCLUSIONS
const getExclusions = async (message, rarity, set) => {
    const filter = m => m.author.id === message.member.user.id
    const prompt = set && set.emoji === set.alt_emoji ? `${set.code} ${eval(set.emoji)}` :
        set && set.emoji !== set.alt_emoji ? `${set.code} ${eval(set.emoji)}${eval(set.alt_emoji)}` :
        ''

	message.channel.send({ content: `Please provide a list of ${rarity === 'all' ? '' : eval(rarity)}${prompt} cards you do not want to bulk sell.`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 60000
    }).then((collected) => {
		const response = collected.first().content.toLowerCase()
        if (response.startsWith('!')) {
            message.channel.send({ content: `Please do not respond with bot commands. Simply type what you would like to exclude.`})
            return false
        } else {
            return response.split(';')
        }
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})
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
                    card_name && set ? await Print.findOne({ where: { card_name: card_name, set_code: set.code }}) :
                    card_name && !set ? await selectPrint(message, playerId, card_name) :
                    null
		
        if (!print) {
            message.channel.send({ content: `Sorry, I do not recognize the card: "${query}".`})
            return false
        }

        if ((set && print.setId !== set.id) || (rarity !== 'all' && print.rarity !== rarity)) {
            message.channel.send({ content: `Sorry, "${query}" A.K.A. ${print.card_name} is not a ${rarity === 'all' ? '' : eval(rarity)}${set.code} ${set.emoji === set.alt_emoji ? eval(set.emoji) : eval(set.emoji), eval(set.alt_emoji)} card.`})
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
	message.channel.send({ content: `What would you like to **receive** in this exchange?\n${options.join("\n")}`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then((collected) => {
        const response = collected.first().content.toLowerCase()
        if(response.includes('1') || response.includes('card')) {
            return 'get_card'
        } else if(response.includes('2') || response.includes('vouch')) {
            return 'get_vouchers'
        } else {
            message.channel.send({ content: `You did not select a valid option.`})
            return false
        }
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})
}

// GET VOUCHER
const getVoucher = async (message) => {
    const options = [
        `(1) Forgestones ${forgestone}`,
        `(2) Mushrooms ${mushroom}`,
        `(3) Moai ${moai}`,
        `(4) Roses ${rose}`,
        `(5) Hooks ${hook}`,
        `(6) Eggs ${egg}`,
        `(7) Cacti ${cactus}`,
        `(8) Swords ${swords}`,
        `(9) Orbs ${orb}`,
        `(10) Gems ${gem}`,
        `(11) Skulls ${skull}`,
        `(12) Familiars ${familiar}`,
        `(13) Batteries ${battery}`
    ]

    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `Which Voucher would you like to exchange?\n${options.join("\n")}`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then((collected) => {
        const response = collected.first().content.toLowerCase()
        let voucher
        if(response.includes('10') || response.includes('gem')) {
            voucher = 'gem'
        } else if(response.includes('11') || response.includes('skull')) {
            voucher = 'skull'
        } else if(response.includes('12') || response.includes('familiar')) {
            voucher = 'familiar'
        } else if(response.includes('13') || response.includes('batter')) {
            voucher = 'battery'
        } else if(response.includes('1') || response.includes('forge') || response.includes('stone')) {
            voucher = 'forgestone'
        } else if(response.includes('2') || response.includes('mush') || response.includes('shroom')) {
            voucher = 'mushroom'
        }else if(response.includes('3') || response.includes('moai')) {
            voucher = 'moai'
        } else if(response.includes('4') || response.includes('rose')) {
            voucher = 'rose'
        } else if(response.includes('5') || response.includes('hook')) {
            voucher = 'hook'
        } else if(response.includes('6') || response.includes('egg')) {
            voucher = 'egg'
        } else if(response.includes('7') || response.includes('cact')) {
            voucher = 'cactus'
        } else if(response.includes('8') || response.includes('sword')) {
            voucher = 'swords'
        } else if(response.includes('9') || response.includes('orb')) {
            voucher = 'orb'
        } else {
            message.channel.send({ content: `You did not select a valid option.`})
            return false
        }
    
        return voucher
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})
}


// GET TRIBE
const getTribe = async (message, player) => {
    const options = [
        `(1) Beast ${beast}`,
        `(2) Rock ${rock}`,
        `(3) Plant ${plant}`,
        `(4) Fish ${fish}`,
        `(5) Dinosaur ${dinosaur}`,
        `(6) Reptile ${reptile}`,
        `(7) Warrior ${warrior}`,
        `(8) Spellcaster ${spellcaster}`,
        `(9) Dragon ${dragon}`,
        `(10) Zombie ${zombie}`,
        `(11) Fiend ${fiend}`,
        `(12) Thunder ${thunder}`
    ]

    const filter = m => m.author.id === player.id
	message.channel.send({ content: `${player.name}, which Tribe did you battle alongside?\n${options.join("\n")}`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 30000
    }).then((collected) => {
        const response = collected.first().content.toLowerCase()
        let voucher
        if(response.includes('10') || response.includes('zom')) {
            voucher = 'skull'
        } else if(response.includes('11') || response.includes('fiend')) {
            voucher = 'familiar'
        } else if(response.includes('12') || response.includes('thunder')) {
            voucher = 'battery'
        } else if(response.includes('1') || response.includes('beast')) {
            voucher = 'mushroom'
        } else if(response.includes('2') || response.includes('rock')) {
            voucher = 'moai'
        }else if(response.includes('3') || response.includes('plan')) {
            voucher = 'rose'
        } else if(response.includes('4') || response.includes('fish')) {
            voucher = 'hook'
        } else if(response.includes('5') || response.includes('dino')) {
            voucher = 'egg'
        } else if(response.includes('6') || response.includes('rep')) {
            voucher = 'cactus'
        } else if(response.includes('7') || response.includes('war')) {
            voucher = 'swords'
        } else if(response.includes('8') || response.includes('cast')) {
            voucher = 'orb'
        } else if(response.includes('9') || response.includes('drag')) {
            voucher = 'gem'
        } else {
            message.channel.send({ content: `You did not select a valid option.`})
            return false
        }

        return voucher
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})
}


// GET BARTER CARD
const getBarterCard = async (message, voucher, medium_complete) => {
    const wares = {
        mushroom: {
            original: [[10, 'APC-001', `(1) ${ult}APC-001 - Desmanian Devil - 10 ${mushroom}`]],
            unlocked: [
                [10, 'DOC-180', `(2) ${ult}DOC-180 - Peropero Cerperus - 10 ${mushroom}`],
                [10, 'TEB-135', `(3) ${ult}TEB-135 - Green Baboon, Defender of the Forest - 10 ${mushroom}`],
                [10, 'ORF-046', `(4) ${ult}ORF-046 - X-Saber Airbellum - 10 ${mushroom}`]
            ]
        },
        moai: {
            original: [[10, 'APC-002', `(1) ${ult}APC-002 - Koa'ki Meiru Guardian - 10 ${moai}`]],
            unlocked: [
                [10, 'DOC-174', `(2) ${ult}DOC-174 - Block Golem - 10 ${moai}`]
            ]
        },
        rose: {
            original: [[10, 'APC-003', `(1) ${ult}APC-003 - Rose Lover - 10 ${rose}`]],
            unlocked: [
                [10, 'DOC-178', `(2) ${ult}DOC-178 - Mardel, Generaider Boss of Light - 10 ${rose}`],
                [10, 'TEB-134', `(3) ${ult}TEB-134 - Dandylion - 10 ${rose}`]
            ]
        },
        hook: {
            original: [[10, 'APC-004', `(1) ${ult}APC-004 - Moray of Greed - 10 ${hook}`]],
            unlocked: [
                [10, 'DOC-181', `(2) ${ult}DOC-181 - Sharkraken - 10 ${hook}`],
                [10, 'TEB-132', `(3) ${ult}TEB-132 - Citadel Whale - 10 ${hook}`]
            ]
        },
        egg: {
            original: [[10, 'APC-005', `(1) ${ult}APC-005 - Spacetime Transcendence - 10 ${egg}`]],
            unlocked: [
                [10, 'DOC-176', `(2) ${ult}DOC-176 - Giant Rex - 10 ${egg}`]
            ]
        },
        cactus: {
            original: [[10, 'APC-006', `(1) ${ult}APC-006 - Viper's Rebirth - 10 ${cactus}`]],
            unlocked: [
                [10, 'DOC-177', `(2) ${ult}DOC-177 - Ipiria - 10 ${cactus}`],
                [10, 'DOC-182', `(3) ${ult}DOC-182 - Sinister Serpent - 10 ${cactus}`],
                [10, 'DOC-185', `(4) ${ult}DOC-185 - Worm Xex - 10 ${cactus}`]
            ]
        },
        swords: {
            original: [[10, 'APC-007', `(1) ${ult}APC-007 - Sublimation Knight - 10 ${swords}`]],
            unlocked: [
                [10, 'ORF-047', `(2) ${ult}ORF-047 - Elemental HERO Nova Master - 10 ${swords}`],
                [10, 'DOC-188', `(3) ${ult}DOC-188 - Reinforcement of the Army - 10 ${swords}`],
                [10, 'TEB-136', `(4) ${ult}TEB-136 - Infernoble Knight - Roland - 10 ${swords}`]
            ]
        },
        orb: {
            original: [[10, 'APC-008', `(1) ${ult}APC-008 - Spellbook of Knowledge - 10 ${orb}`]],
            unlocked: [
                [10, 'TEB-130', `(2) ${ult}TEB-130 - Altergeist Meluseek - 10 ${orb}`],
                [10, 'TEB-137', `(3) ${ult}TEB-137 - Shaddoll Dragon - 10 ${orb}`],
                [10, 'DOC-175', `(4) ${ult}DOC-175 - Breaker the Magical Warrior - 10 ${orb}`]
            ]
        },
        gem: {
            original: [[10, 'APC-009', `(1) ${ult}APC-009 - Guardragon Cataclysm - 10 ${gem}`]],
            unlocked: [
                [10, 'TEB-141', `(2) ${ult}TEB-141 - Dragon Ravine - 10 ${gem}`]
            ]
        },
        skull: {
            original: [[10, 'APC-010', `(1) ${ult}APC-010 - Gozuki - 10 ${skull}`]],
            unlocked: []
        },
        familiar: {
            original: [[10, 'APC-011', `(1) ${ult}APC-011 - Graff, Malebranche of the Burning Abyss - 10 ${familiar}`]],
            unlocked: []
        },
        battery: {
            original: [[10, 'APC-012', `(1) ${ult}APC-012 - Thunder Dragondark - 10 ${battery}`]],
            unlocked: []
        }
    }

    if (!wares[voucher]) return false
    const options = medium_complete ? [...wares[voucher].original, ...wares[voucher].unlocked] : [...wares[voucher].original]
    if (options.length === 1) return options[0]
    const cards = options.map((o) => o[2])
    
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `Which card would you like to barter for?\n${cards.join("\n")}`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then((collected) => {
		const response = collected.first().content
        const index = response.includes('1') || response.includes('APC') ? 0 :
            response.includes('2') ? 1 :
            response.includes('3') ? 2 :
            response.includes('4') ? 3 :
            null

        const selected_option = options[index]
        return selected_option
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})
}



// GET BARTER QUERY
const getBarterQuery = async (message) => {
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `Which card would you like to exchange ${forgestone} for?`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then((collected) => {
        const response = collected.first().content
		return response
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})
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
        [10, 'APC-009', `(9) ${ult}APC-009 - Guardragon Cataclysm - 10 ${gem}`, 'gem'],
        [10, 'APC-010', `(10) ${ult}APC-010 - Gozuki - 10 ${skull}`, 'skull'],
        [10, 'APC-011', `(11) ${ult}APC-011 - Graff, Malebranche of the Burning Abyss - 10 ${familiar}`, 'familiar'],
        [10, 'APC-012', `(12) ${ult}APC-012 - Thunder Dragondark - 10 ${battery}`, 'battery']
    ]

    const cards = options.map((o) => o[2])

    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `Which card would you like to trade-in?\n${cards.join("\n")}`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then((collected) => {
        const response = collected.first().content.toLowerCase()
        let index
        if(response.includes('10') || response.includes('APC-010') || response.includes('gozu')) {
            index = 9
        } else if(response.includes('11') || response.includes('APC-011') || response.includes('graff') || response.includes('burning')) {
            index = 10
        } else if(response.includes('12') || response.includes('APC-012') || response.includes('thunder') || response.includes('tdrag')) {
            index = 11
        } else if(response.includes('1') || response.includes('APC-001') || response.includes('devil') || response.includes('desm')) {
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
            message.channel.send({ content: `You did not select a valid option.`})
            return false
        }
    
        const selected_option = options[index]
        return selected_option	
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})
}


// ASK FOR BARTER CONFIRMATION
const askForBarterConfirmation = async (message, voucher, card, price, direction) => {
    const prompt = direction === 'get_card' ? `Are you sure you want to exchange ${price} ${eval(voucher)} for a copy of ${card}?` :
        `Are you sure you want to exchange a copy of ${card} for ${price} ${eval(voucher)}?`
        
    const filter = m => m.author.id === message.author.id
    message.channel.send({ content: prompt })
    return await message.channel.awaitMessages({ filter,
        max: 1,
        time: 15000
    }).then((collected) => {
        const response = collected.first().content.toLowerCase()
        return yescom.includes(response)
    }).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}


module.exports = {
    applyPriceDecay,
    askForBarterConfirmation,
    askForDumpConfirmation,
    askForExclusions,
    checkShopOpen,
    checkShopShouldBe,
    clearDailies,
    closeShop,
    getBarterCard,
    getBarterQuery,
    getBarterDirection,
    getDumpRarity,
    getDumpQuantity,
    getExclusions,
    getExcludedPrintIds,
    getMidnightCountdown,
    getShopCountdown,
    getTradeInCard,
    getTribe,
    getVoucher,
    openShop,
    postBids,
    updateShop
}
