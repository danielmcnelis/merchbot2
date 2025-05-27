
//PRINT FUNCTIONS
import emojis from '../static/emojis.json' with { type: 'json' }
const { com, rar, sup, ult, scr, stardust } = emojis
import commands from '../static/commands.json' with { type: 'json' }
const { yescom } = commands
import { Op } from 'sequelize'
import { Auction, Info, ForgedInventory, ForgedPrint, ForgedSet } from '../database/index.js'

export const askForSetToPrint = async (message) => {
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `What set would you like to work on printing?`})
    return await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then(async (collected) => {
        const setCode = collected.first().content.toUpperCase()
        const set = await ForgedSet.findOne({ where: { code: setCode }}) 
        if (!set) {
            message.channel.send({ content: `That set outline is not in the system.`})
            return false
        } else {
            const info = await Info.findOne({ where: { element: 'set_to_print'}})
            if (info) {
                info.status = setCode
                await info.save()
            } else {
                await Info.create({
                    element: 'set_to_print',
                    status: setCode
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

export const askForCardSlot = async (message, cardName, cardId, setCode, setId) => {
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `What number card is this in the set?`})
    await message.channel.awaitMessages({ filter,
		max: 1,
        time: 15000
    }).then((collected) => {
        const cardSlot = collected.first().content
        if (isNaN(cardSlot)) return message.channel.send({ content: `Please provide a number.`})
        const zeros = cardSlot < 10 ? '00' : cardSlot < 100 ? '0' : ''
        const cardCode = `${setCode}-${zeros}${cardSlot}`
        return askForRarity(message, cardName, cardId, setCode, setId, cardCode, cardSlot)
    }).catch((err) => {
		console.log(err)
        return member.user.send({ content: `Sorry, time's up.`})
    })
}

export const askForRarity = async (message, set, currentPrints) => {
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

export const collectNicknames = async (message, cardName) => {
    const filter = m => m.author.id === message.author.id
    message.channel.send({ content: `Type new nicknames for ${cardName} into the chat one at a time.\n\nThis collection will last 15s.`})
    const collector = await message.channel.awaitMessages({ filter,
        time: 15000
    }).catch((err) => {
        console.log(err)
    })

    return collector
}

//SELECT PRINT
export const selectPrint = async (message, playerId, cardName, discrete = false, inInv = false, inAuc = false) => {
    const prints = inInv ? [...await ForgedPrint.findAll({ 
        where: { cardName: cardName },
        order: [['createdAt', 'ASC']]
    })].filter(async (p) => {
        const count = await ForgedInventory.count({ where: { playerId: playerId, cardCode: p.cardCode, quantity: { [Op.gt]: 0 } }})
        if (count && !p.draft && !p.hidden) return p
    }) : inAuc ? [...await ForgedPrint.findAll({ 
        where: { cardName: cardName },
        order: [['createdAt', 'ASC']]
    })].filter(async (p) => {
        const count = await Auction.count({ where: { cardCode: p.cardCode }})
        if (count && !p.draft && !p.hidden) return p
    }) : [...await ForgedPrint.findAll({ 
        where: { cardName: cardName },
        order: [['createdAt', 'ASC']]
    })].filter((p) => !p.draft && !p.hidden)

    const channel = discrete ? message.author : message.channel

    if (!prints.length) return null
    if (prints.length === 1) return prints[0]
    const options = prints.map((print, index) => `(${index + 1}) ${eval(print.rarity)}${print.cardCode} - ${print.cardName}`)

    const filter = m => m.author.id === playerId
    const msg = await channel.send({ content: `Please select a print:\n${options.join('\n').toString()}`}).catch((err) => console.log(err))
    return await msg.channel.awaitMessages({ filter,
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


export const askForAdjustConfirmation = async (message, card, marketPrice) => {
    const filter = m => m.author.id === message.member.user.id
	message.channel.send({ content: `${card} is valued at ${marketPrice}${stardust}, do you wish to change it?`})
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

export const getNewMarketPrice = async (message) => {
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
