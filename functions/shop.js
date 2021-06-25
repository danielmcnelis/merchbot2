
const { Card, Match, Player, Tournament, Print, Set, Wallet, Diary, Inventory, Arena, Trivia, Keeper, Gauntlet, Draft, Daily, Binder, Wishlist, Profile, Info } = require('../db')
const merchbotId = '584215266586525696'
const { Op } = require('sequelize')
const { yescom } = require('../static/commands.json')
const { ygocard, pack, open, closed, DOC, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, ROCK, sad, mad, beast, dragon, machine, spellcaster, warrior, zombie, fish, rock, dinosaur, plant, reptile, starchips, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')
const { awardPacksToShop } = require('./packs')
const adminId = '194147938786738176'
const { client } = require('../static/clients.js')
const { shopChannel } = require('../static/channels.json')

const openShop = async (channel, error) => {
	const shop = await Info.findOne({ where: { element: 'shop' }})
	if (!shop) return channel.send(`Could not find game element: "shop".`)
	if (shop.status === 'open') {
		return channel.send(`The Shop status was already open. ${open}`)
	} else {
		shop.status = 'open'
		await shop.save()
        const permissionToProcessBids = error ? await askAdminToProcessBids(channel) : true
        if (permissionToProcessBids) await processBids()
		return channel.send(`The Shop status is now open. ${open}`)
	} 
}
const closeShop = async (channel, error) => {
    const shop = await Info.findOne({ where: { element: 'shop' }})
	if (!shop) return channel.send(`Could not find game element: "shop".`)
	if (shop.status === 'closed') {
		return channel.send(`The Shop status was already closed. ${close}`)
	} else {
		shop.status = 'closed'
		await shop.save()
        const permissionToRestock = error ? await askAdminToRestock(channel) : true
        if (permissionToRestock) await restock()
		return channel.send(`The Shop status is now closed. ${close}`)
	} 
}

const askAdminToRestock = async (channel) => {
    const filter = m => m.author.id === adminId
	const msg = await channel.send(`<@${adminId}>, The Shop was unexpectedly open. Now that it's closing, would you like The Shop to restock?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 20000
    }).then(async collected => {
        if (yescom.includes(collected.first().content.toLowerCase())) {
            return true
        } else {
            msg.channel.send(`No problem. Have a nice day.`)
            return false
        }  
    }).catch(err => {
		console.log(err)
        msg.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}

const askAdminToProcessBids = async (channel) => {
    const filter = m => m.author.id === adminId
	const msg = await channel.send(`<@${adminId}>, The Shop was unexpectedly closed. Now that it's opening, would you like The Shop to process bids?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 20000
    }).then(async collected => {
        if (yescom.includes(collected.first().content.toLowerCase())) {
            return true
        } else {
            msg.channel.send(`No problem. Have a nice day.`)
            return false
        }  
    }).catch(err => {
		console.log(err)
        msg.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}

const checkShopOpen = async () => {
    const shopIsOpen = await Info.count({ where: {
        element: 'shop',
        status: 'open'
    } })

    return shopIsOpen
}

const processBids = async () => {
    return console.log('processBids()')
}

const restock = async () => {
	const allSetsForSale = await Set.findAll({ where: { for_sale: true }})
	const newbies = await Info.findOne({ where: { element: "newbies" }})

	let weightedCount = 0
    weightedCount -= 10 * newbies.count

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
	}

    const channel = client.channels.cache.get(shopChannel)
	const count = Math.ceil(weightedCount / 8) > 0 ? Math.ceil(weightedCount / 8) : 1
    const newlyInStock = await awardPacksToShop(count)
    if (!newlyInStock) return channel.send(`Error awarding ${count} packs to shop.`)
    else return postBids(channel, newlyInStock)
}

const updateShop = async (channel) => {
    channel.bulkDelete(100)

    setTimeout(() => {
        channel.bulkDelete(100)
    }, 2000)
    
    setTimeout(() => {
        channel.bulkDelete(100)
    }, 4000)

    setTimeout(async () => {
        const results = [
            //`${merchant} --- The Magical MerchBot Shop --- ${merchant}`,
            `${master} --- Core Products --- ${master}`
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
    
        for (let i = 0; i < results.length; i += 10) channel.send(results.slice(i, i+10))
    }, 5000)
}

const postBids = async (channel, newlyInStock) => {
    console.log('newlyInStock', newlyInStock)
    channel.bulkDelete(100)
    
    setTimeout(() => {
        channel.bulkDelete(100)
    }, 2000)
    
    setTimeout(() => {
        channel.bulkDelete(100)
    }, 4000)

    setTimeout(async () => {
        const results = [
            `${master} ${merchant} --- The Magical MerchBot Shop --- ${merchant} ${master}`,
            `${pack} --- Core Products --- ${pack}`
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

        results.push(`\n${ygocard} --- Cards For Auction --- ${ygocard}`)
    
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

const getDumpRarity = async (message) => {
    let rarity
    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`What rarity would you like to bulk sell?\n(1) common\n(2) rare\n(3) super\n(4) ultra\n(5) secret\n(6) all`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
		const response = collected.first().content.toLowerCase()
        if(response.includes('com') || response.includes('1') && !response.includes('0')) rarity = 'com' 
        else if(response.includes('rar') || response.includes('2')) rarity = 'rar'
        else if(response.includes('sur') || response.includes('3')) rarity = 'sup'
        else if(response.includes('ult') || response.includes('4')) rarity = 'ult'
        else if(response.includes('sec') || response.includes('scr') || response.includes('5')) rarity = 'scr'
        else if(response.includes('all') || response.includes('any') || response.includes('6')) rarity = 'all'
        else rarity = 'unrecognized'
    }).catch(err => {
		console.log(err)
        return message.channel.send(`Sorry, time's up.`)
	})

    return rarity
}

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
