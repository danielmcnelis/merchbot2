
//PRINT FUNCTIONS
const { com, rar, sup, ult, scr, stardust } = require('../static/emojis.json')
const { yescom } = require('../static/commands.json')
const { Print } = require('../db/index.js')

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

const askForRarity = async (message, card_name, card_id, set_code, set_id, card_code, card_slot) => {
    const filter = m => m.author.id === message.member.user.id
	const msg = await message.channel.send(`What rarity is this print?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
        const rarity = collected.first().content.toLowerCase()
        if (rarity !== 'com' && rarity !== 'rar' && rarity !== 'sup' && rarity !== 'ult' && rarity !== 'scr') return message.channel.send(`Please specify a rarity.`)
        
        const market_price = rarity === 'com' ? 10 : rarity === 'rar' ? 20 : rarity === 'sup' ? 40 : rarity === 'ult' ? 80 : 160 
        const emoji = eval(rarity)

        const print = {
            card_name,
            card_id,
            set_code,
            setId: set_id,
            card_code,
            card_slot,
            rarity,
            market_price
        }

        await Print.create(print)

        return message.channel.send(`Created a new print: ${emoji}${card_code} - ${card_name} - ${stardust}${market_price}`)
    }).catch(err => {
        console.log(err)
        return member.user.send(`Sorry, time's up.`)
    })
}

const selectPrint = async (message, playerId, card_name) => {
    const prints = await Print.findAll({ 
        where: { card_name: card_name },
        order: [['createdAt', 'ASC']]
    })

    if (!prints.length) return null
    if (prints.length === 1) return prints[0]
    const options = prints.map((print, index) => `(${index + 1}) ${eval(print.rarity)}${print.card_code} - ${print.card_name}`)

    const filter = m => m.author.id === playerId
    const msg = await message.channel.send(`Please select a print:\n${options.join('\n')}`)
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
        if (isFinite(num)) return num
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
    getNewMarketPrice,
    selectPrint
}
