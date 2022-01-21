
//PRINT FUNCTIONS
const { com, rar, sup, ult, scr, stardust } = require('../static/emojis.json')
const { yescom } = require('../static/commands.json')
const { Op } = require('sequelize')
const { Auction, Info, Inventory, Print, Set } = require('../db/index.js')

const askForSetToPrint = async (message) => {
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `What set would you like to work on printing?`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then(async (collected) => {
        const set_code = collected.first().content.toUpperCase()
        const set = await Set.findOne({ where: { code: set_code }}) 
        if (!set) {
            message.channel.send({ content: `That set outline is not in the system.`})
            return false
        } else {
            const info = await Info.findOne({ where: { element: 'set_to_print'}})
            if (info) {
                info.status = set_code
                await info.save()
            } else {
                await Info.create({
                    element: 'set_to_print',
                    status: set_code
                })
            }

            return set
        }
    }).catch((err) => {
		console.log(err)
        member.user.send({ content: `Sorry, time's up.`})
        return false
    })
}

const askForCardSlot = async (message, card_name, card_id, set_code, set_id) => {
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `What number card is this in the set?`})
    await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then((collected) => {
        const card_slot = collected.first().content
        if (isNaN(card_slot)) return message.channel.send({ content: `Please provide a number.`})
        const zeros = card_slot < 10 ? '00' : card_slot < 100 ? '0' : ''
        const card_code = `${set_code}-${zeros}${card_slot}`
        return askForRarity(message, card_name, card_id, set_code, set_id, card_code, card_slot)
    }).catch((err) => {
		console.log(err)
        return member.user.send({ content: `Sorry, time's up.`})
    })
}

const askForRarity = async (message, set, currentPrints) => {
    if (set.type === 'starter_deck') {
        let ultras = 0
        currentPrints.forEach((print) => {
            if (print.rarity === 'ult') ultras++
        })

        if (ultras === 2) return 'com'
    }

    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `What rarity is this print?`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then((collected) => {
        const rarity = collected.first().content.toLowerCase()
        if (rarity !== 'com' && rarity !== 'rar' && rarity !== 'sup' && rarity !== 'ult' && rarity !== 'scr') {
            message.channel.send({ content: `Please specify a rarity.`})
            return false
        } else {
            return rarity
        }
    }).catch((err) => {
		console.log(err)
        member.user.send({ content: `Sorry, time's up.`})
        return false
    })
}

const collectNicknames = async (message, card_name) => {
    const filter = m => m.author.id === message.author.id
    message.channel.send({ content: `Type new nicknames for ${card_name} into the chat one at a time.\n\nThis collection will last 15s.`})
    const collector = await message.channel.awaitMessages({ filter,
        time: 15000
    }).catch((err) => {
        console.log(err)
    })

    return collector
}

//SELECT PRINT
const selectPrint = async (message, playerId, card_name, private = false, inInv = false, inAuc = false) => {
    const prints = inInv ? [...await Print.findAll({ 
        where: { card_name: card_name },
        order: [['createdAt', 'ASC']]
    })].filter(async (p) => {
        const count = await Inventory.count({ where: { playerId: playerId, card_code: p.card_code, quantity: { [Op.gt]: 0 } }})
        if (count && !p.draft && !p.hidden) return p
    }) : inAuc ? [...await Print.findAll({ 
        where: { card_name: card_name },
        order: [['createdAt', 'ASC']]
    })].filter(async (p) => {
        const count = await Auction.count({ where: { card_code: p.card_code }})
        if (count && !p.draft && !p.hidden) return p
    }) : [...await Print.findAll({ 
        where: { card_name: card_name },
        order: [['createdAt', 'ASC']]
    })].filter((p) => !p.draft && !p.hidden)

    const channel = private ? message.author : message.channel

    if (!prints.length) return null
    if (prints.length === 1) return prints[0]
    const options = prints.map((print, index) => `(${index + 1}) ${eval(print.rarity)}${print.card_code} - ${print.card_name}`)

    const filter = m => m.author.id === playerId
    channel.send({ content: `Please select a print:\n${options.join('\n').toString()}`}).catch((err) => console.log(err))
    return await channel.awaitMessages({ filter,
        max: 1,
        time: 15000
    }).then((collected) => {
        const response = collected.first().content
        const num = parseInt(response.match(/\d+/))
        if (!num || !prints[num - 1]) {
            message.channel.send({ content: `Sorry, ${response} is not a valid option.`})
            return null
        } else {
            return prints[num - 1]
        }
    }).catch((err) => {
		console.log(err)
        return null
    })
}


const askForAdjustConfirmation = async (message, card, market_price) => {
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `${card} is valued at ${market_price}${stardust}, do you wish to change it?`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then((collected) => {
        const response = collected.first().content.toLowerCase()
        return yescom.includes(response)
    }).catch((err) => {
		console.log(err)
        member.user.send({ content: `Sorry, time's up.`})
        return false
    })
}

const getNewMarketPrice = async (message) => {
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `What should the new market price be in ${stardust}?`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then((collected) => {  
        const response = collected.first().content
        const num = Math.round(parseInt(response) * 100) / 100
        if (isFinite(num) && num > 0) {
            return num
        } else {
            return false
        }
    }).catch((err) => {
		console.log(err)
        member.user.send({ content: `Sorry, time's up.`})
        return false
    })
}

module.exports = {
    askForAdjustConfirmation,
    askForCardSlot,
    askForRarity,
    askForSetToPrint,
    collectNicknames,
    getNewMarketPrice,
    selectPrint
}
