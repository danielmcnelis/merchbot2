
//PRINT FUNCTIONS
const { com, rar, sup, ult, scr, stardust } = require('../static/emojis.json')
const { Print } = require('../db/index.js')

const askForCardSlot = async (client, message, member, card_name, card_id, set_code, set_id) => {
    const filter = m => m.author.id === member.user.id
	const msg = await message.channel.send(`What number card is this in the set?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(async collected => {
        const card_slot = collected.first().content
        if (isNaN(card_slot)) return message.channel.send(`Please provide a number.`)
        const zeros = card_slot < 10 ? '00' : card_slot < 100 ? '0' : ''
        const card_code = `${set_code}-${zeros}${card_slot}`

        return askForRarity(client, message, member, card_name, card_id, set_code, set_id, card_code, card_slot)
    }).catch(err => {
        console.log(err)
        return member.user.send(`Sorry, time's up.`)
    })
}

const askForRarity = async (client, message, member, card_name, card_id, set_code, set_id, card_code, card_slot) => {
    const filter = m => m.author.id === member.user.id
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

module.exports = {
    askForCardSlot,
    askForRarity
}
