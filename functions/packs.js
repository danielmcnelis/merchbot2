
const { Auction, Bid, Print, Set, Inventory } = require('../db')
const { getRandomElement, getRandomSubset } = require('./utility.js')
const { botSpamChannel } = require('../static/channels.json')
const { client } = require('../static/clients.js')
const merchbotId = '584215266586525696'
const { blue, red, stoned, stare, wokeaf, koolaid, cavebob, evil, DOC, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, ROCK, sad, mad, beast, dragon, machine, spellcaster, warrior, zombie, starchips, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')

const awardPack = async (message, set, num) => {
    if (!set) return console.log('No set found.')

	const commons = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "com"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const rares = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "rar"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const supers = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "sup"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const ultras = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "ult"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const secrets = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "scr"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

    const results = []

    for (let j = 0; j < num; j++) {
        const yourCommons = set.commons_per_pack > 1 ? getRandomSubset(commons, set.commons_per_pack) : set.secrets_per_pack === 1 ? [getRandomElement(commons)] : []
        const yourRares = set.rares_per_pack > 1 ? getRandomSubset(rares, set.rares_per_pack) : set.rares_per_pack === 1 ? [getRandomElement(rares)] : []
        const yourSupers = set.supers_per_pack > 1 ? getRandomSubset(supers, set.supers_per_pack) : set.supers_per_pack === 1 ? [getRandomElement(supers)] : []
        const yourUltras = set.ultras_per_pack > 1 ? getRandomSubset(ultras, set.ultras_per_pack) : set.ultras_per_pack === 1 ? [getRandomElement(ultras)] : []
        const yourSecrets = set.secrets_per_pack > 1 ? getRandomSubset(secrets, set.secrets_per_pack) : set.secrets_per_pack === 1 ? [getRandomElement(secrets)] :  []
    
        const odds = []
        if (!yourCommons.length) for (let i = 0; i < set.commons_per_box; i++) odds.push("commons")
        if (!yourRares.length) for (let i = 0; i < set.rares_per_box; i++) odds.push("rares")
        if (!yourSupers.length) for (let i = 0; i < set.supers_per_box; i++) odds.push("supers")
        if (!yourUltras.length) for (let i = 0; i < set.ultras_per_box; i++) odds.push("ultras")
        if (!yourSecrets.length) for (let i = 0; i < set.secrets_per_box; i++) odds.push("secrets")
    
        const luck = getRandomElement(odds)
        const yourFoil = getRandomElement(eval(luck))
    
        const yourPack = [...yourCommons.sort(), ...yourRares.sort(), ...yourSupers.sort(), ...yourUltras.sort(), ...yourSecrets.sort(), yourFoil]
    
        results.push(`\n${eval(set.emoji)} - ${set.name} Pack${j > 0 ? j + 1 : ''} - ${eval(set.alt_emoji)}`)
    
        for (let i = 0; i < yourPack.length; i++) {
            const print = await Print.findOne({ where: {
                card_code: yourPack[i]
            }})
    
            if (!print.id) return console.log(`${card} does not exist in the Print database.`)
            results.push(`${eval(print.rarity)}${print.card_code} - ${print.card_name}`)
    
            const inv = await Inventory.findOne({ where: { 
                card_code: print.card_code,
                printId: print.id,
                playerId: message.member.id
            }})
    
            if (inv) {
                inv.quantity++
                await inv.save()
            } else {
                await Inventory.create({ 
                    card_code: print.card_code,
                    quantity: 1,
                    printId: print.id,
                    playerId: message.member.id
                })
            }
        }
    }

    message.member.send(results.join('\n'))
    return message.channel.send(`<@${message.member.id}> was awarded ${num === 1 ? 'a' : num} ${num === 1 ? 'Pack' : 'Packs'}. Congratulations!`)
}

const awardPacksToShop = async (num) => {
	const channel = client.channels.cache.get(botSpamChannel)
    if (!channel) return console.log('Could not find #bot-spam channel.')

    const coreSets = await Set.findAll({ where: {
        type: 'core'
    }, order: [["createdAt", "DESC"]]})

    if (!coreSets.length) return console.log('No core sets found.')
    const set = coreSets[0]

	const commons = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "com"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const rares = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "rar"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const supers = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "sup"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const ultras = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "ult"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

	const secrets = await Print.findAll({ 
		where: {
			setId: set.id,
			rarity: "scr"
		},
		order: [['card_slot', 'ASC']]
	}).map(function(print) {
		return print.card_code
	})

    const results = []
    const newlyInStock = []

    for (let j = 0; j < num; j++) {
        const yourCommons = set.commons_per_pack > 1 ? getRandomSubset(commons, set.commons_per_pack) : set.secrets_per_pack === 1 ? [getRandomElement(commons)] : []
        const yourRares = set.rares_per_pack > 1 ? getRandomSubset(rares, set.rares_per_pack) : set.rares_per_pack === 1 ? [getRandomElement(rares)] : []
        const yourSupers = set.supers_per_pack > 1 ? getRandomSubset(supers, set.supers_per_pack) : set.supers_per_pack === 1 ? [getRandomElement(supers)] : []
        const yourUltras = set.ultras_per_pack > 1 ? getRandomSubset(ultras, set.ultras_per_pack) : set.ultras_per_pack === 1 ? [getRandomElement(ultras)] : []
        const yourSecrets = set.secrets_per_pack > 1 ? getRandomSubset(secrets, set.secrets_per_pack) : set.secrets_per_pack === 1 ? [getRandomElement(secrets)] :  []
    
        const odds = []
        if (!yourCommons.length) for (let i = 0; i < set.commons_per_box; i++) odds.push("commons")
        if (!yourRares.length) for (let i = 0; i < set.rares_per_box; i++) odds.push("rares")
        if (!yourSupers.length) for (let i = 0; i < set.supers_per_box; i++) odds.push("supers")
        if (!yourUltras.length) for (let i = 0; i < set.ultras_per_box; i++) odds.push("ultras")
        if (!yourSecrets.length) for (let i = 0; i < set.secrets_per_box; i++) odds.push("secrets")
    
        const luck = getRandomElement(odds)
        const yourFoil = getRandomElement(eval(luck))
    
        const yourPack = [...yourCommons.sort(), ...yourRares.sort(), ...yourSupers.sort(), ...yourUltras.sort(), ...yourSecrets.sort(), yourFoil]
    
        results.push(`\n${eval(set.emoji)} - ${set.name} Pack${num > 0 ? ` ${j + 1}` : ''} - ${eval(set.alt_emoji)}`)
    
        for (let i = 0; i < yourPack.length; i++) {
            const print = await Print.findOne({ where: {
                card_code: yourPack[i]
            }})
    
            if (!print.id) return console.log(`${card} does not exist in the Print database.`)
            results.push(`${eval(print.rarity)}${print.card_code} - ${print.card_name}`)
    
            const inv = await Inventory.findOne({ where: { 
                card_code: print.card_code,
                printId: print.id,
                playerId: merchbotId
            }})
    
            const auction = await Auction.findOne({ where: { 
                card_code: print.card_code
            }})

            if (auction) {
                auction.quantity++
                await auction.save()
            }

            if (!inv || inv.quantity === 0) {
                newlyInStock.push(print.card_code)
                await Auction.create({
                    card_code: print.card_code,
                    printId: print.id
                })
            } 

            if (inv) {
                inv.quantity++
                await inv.save()
            } else {
                await Inventory.create({ 
                    card_code: print.card_code,
                    quantity: 1,
                    printId: print.id,
                    playerId: merchbotId
                })
            }
        }
    }

    newlyInStock.sort()
    channel.send(`<@${merchbotId}> opened ${num === 1 ? 'a' : num} ${num === 1 ? 'Pack' : 'Packs'} of ${set.name} ${eval(set.emoji)}!`)

    for (let i = 0; i < results.length; i += 30) {
        if (results[i+30] && results[i+30].includes(set.emoji)) {
            channel.send(results.slice(i, i+31))
            i++
        } else {
            channel.send(results.slice(i, i+30))
        }
    }
    
    return newlyInStock
}

module.exports = {
    awardPack,
    awardPacksToShop
}
