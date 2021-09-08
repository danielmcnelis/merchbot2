
//PRINT FUNCTIONS
const { com, rar, sup, ult, scr, stardust } = require('../static/emojis.json')
const { yescom } = require('../static/commands.json')
const { Op } = require('sequelize')
const { Auction, Info, Inventory, Print, Set } = require('../db/index.js')

const askForSetToPrint = async (message) => {
    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`What set would you like to work on printing?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
        const set_code = collected.first().content.toUpperCase()
        const set = await Set.findOne({ where: { code: set_code }}) 
        if (!set) {
            message.channel.send(`That set outline is not in the system.`)
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
    }).catch(err => {
        console.log(err)
        member.user.send(`Sorry, time's up.`)
        return false
    })

    return collected
}

const askForCardSlot = async (message, card_name, card_id, set_code, set_id) => {
    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`What number card is this in the set?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
        const card_slot = collected.first().content
        if (isNaN(card_slot)) return message.channel.send(`Please provide a number.`)
        const zeros = card_slot < 10 ? '00' : card_slot < 100 ? '0' : ''
        const card_code = `${set_code}-${zeros}${card_slot}`

        return askForRarity(message, card_name, card_id, set_code, set_id, card_code, card_slot)
    }).catch(err => {
        console.log(err)
        return member.user.send(`Sorry, time's up.`)
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
	const msg = await message.channel.send(`What rarity is this print?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
        const rarity = collected.first().content.toLowerCase()
        if (rarity !== 'com' && rarity !== 'rar' && rarity !== 'sup' && rarity !== 'ult' && rarity !== 'scr') {
            message.channel.send(`Please specify a rarity.`)
            return false
        } else {
            return rarity
        }
    }).catch(err => {
        console.log(err)
        member.user.send(`Sorry, time's up.`)
        return false
    })

    return collected
}

const collectNicknames = async (message, card_name) => {
    const filter = m => m.author.id === message.author.id
    const msg = await message.channel.send(`Type new nicknames for ${card_name} into the chat one at a time.\n\nThis collection will last 15s.`)
    const collected = await msg.channel.awaitMessages(filter, {
        time: 15000
    }).then(collected => {
        return collected
    }).catch(err => {
        console.log(err)
        return
    })

    return collected
}

//SELECT PRINT
const selectPrint = async (message, playerId, card_name, private = false, inInv = false, inAuc = false) => {
    const prints = inInv ? await Print.findAll({ 
        where: { card_name: card_name },
        order: [['createdAt', 'ASC']]
    }).filter(async (p) => {
        const count = await Inventory.count({ where: { card_code: p.card_code, quantity: { [Op.gt]: 0 } }})
        if (count) return p
    }) : inAuc ? await Print.findAll({ 
        where: { card_name: card_name },
        order: [['createdAt', 'ASC']]
    }).filter(async (p) => {
        const count = await Auction.count({ where: { card_code: p.card_code }})
        if (count) return p
    }) : await Print.findAll({ 
        where: { card_name: card_name },
        order: [['createdAt', 'ASC']]
    })

    const channel = private ? message.author : message.channel

    if (!prints.length) return null
    if (prints.length === 1) return prints[0]
    const options = prints.map((print, index) => `(${index + 1}) ${eval(print.rarity)}${print.card_code} - ${print.card_name}`)

    const filter = m => m.author.id === playerId
    const msg = await channel.send(`Please select a print:\n${options.join('\n')}`)
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 15000
    }).then(collected => {
        const num = parseInt(collected.first().content.match(/\d+/))
        if (!num || !prints[num - 1]) {
            message.channel.send(`Sorry, ${collected.first().content} is not a valid option.`)
            return null
        }
        else return prints[num - 1]
    }).catch(err => {
        console.log(err)
        return null
    })

    return collected
}


const askForAdjustConfirmation = async (message, card, market_price) => {
    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`${card} is valued at ${market_price}${stardust}, do you wish to change it?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
        if (yescom.includes(collected.first().content.toLowerCase())) return true
        else return false
    }).catch(err => {
        console.log(err)
        member.user.send(`Sorry, time's up.`)
        return false
    })

    return collected
}

const getNewMarketPrice = async (message) => {
    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`What should the new market price be in ${stardust}?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
        const num = Math.round(parseInt(collected.first().content) * 100) / 100
        if (isFinite(num) && num > 0) return num
        else return false
    }).catch(err => {
        console.log(err)
        member.user.send(`Sorry, time's up.`)
        return false
    })

    return collected
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
