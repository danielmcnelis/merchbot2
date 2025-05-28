

// const {Builder, By, until} = require('selenium-webdriver')
// const firefox = require('selenium-webdriver/firefox')
import fs from 'fs'
import {AttachmentBuilder} from 'discord.js'
// const errors = require('../static/errors.json')
import emojis from '../static/emojis.json' with { type: 'json' }
const { soldier } = emojis
import { Op } from 'sequelize'
import { clearStatus, convertArrayToObject } from './utility.js'
import { fetchAllForgedCards, getInventorySummary } from './search.js'
import { Auction, Bid, Card, ForgedPrint, ForgedSet, Tournament, Status, ForgedInventory } from '../database/index.js'
import decks from '../static/decks.json' with { type: 'json' }
// const { exec } = require('child_process')

//GET SHOP DECK
export const getShopDeck = async (message, tribe = '') => {
    if(tribe.includes('dino')) return 'dinosaur' 
    if(tribe.includes('plant')) return 'plant'
    if(tribe.includes('fish')) return 'fish'
    if(tribe.includes('rock')) return 'rock'
    if(tribe.includes('drag')) return 'dragon'
    if(tribe.includes('spell') || tribe.includes('cast')) return 'spellcaster'
    if(tribe.includes('war')) return 'warrior'
    if(tribe.includes('rep')) return 'reptile'
    const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Please select a deck:\n(1) Reptile's Charm\n(2) Warrior's Legend\n(3) Dragon's Inferno\n(4) Spellcaster's Art\n(5) Dinosaur's Power\n(6) Plant's Harmony\n(7) Fish's Ire\n(8) Rock's Foundation`})
	return await message.channel.awaitMessages({ filter,
		max: 1,
		time: 15000
	}).then((collected) => {
        const response = collected.first().content.toLowerCase()
        const deck = response.includes('rep') || response.includes('1') ? 'reptile' :
            response.includes('war') || response.includes('2') ? 'warrior' :
            response.includes('drag') || response.includes('3') ? 'dragon' :
            response.includes('spell') || response.includes('cast') || response.includes('4') ? 'spellcaster' :
            response.includes('dino') || response.includes('5') ? 'dinosaur' :
            response.includes('plant') || response.includes('6') ? 'plant' :
            response.includes('fish') || response.includes('7') ? 'fish' :
            response.includes('rock') || response.includes('8') ? 'rock' :
            null

        return deck
	}).catch((err) => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
	})
}


// AWARD STARTER DECK
export const awardStarterDeck = async (playerId, starter) => {
    const keys = Object.keys(decks[starter].cards)

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const print = await Print.findOne( { where: { cardCode: key } })
        if (!print.id) return console.log(`${key} does not exist in the Print database.`)
    
        const inv = await Inventory.findOne({ where: { 
            cardCode: print.cardCode,
            printId: print.id,
            playerId: playerId
        }})
    
        if (inv) {
            inv.quantity += decks[starter].cards[key]
            await inv.save()
        } else {
            await Inventory.create({ 
                cardCode: print.cardCode,
                quantity: decks[starter].cards[key],
                printId: print.id,
                playerId: playerId
            })
        }
    }
}

//SAVE YDK
// export const saveYDK = async (player, url, tournamentName = 'other') => {
//     let deck_arr = []
//     const options = new firefox.Options()
//     options.addArguments("-headless")
//     const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build()

//     const get_deck = `
//         deck_arr = ["#created by ...", "#main"]

//         for (let i = 0; i < deck_filled_arr.length; i++) {
//             if (~~deck_filled_arr[i].data("serial_number") > 0) {
//                 deck_arr.push(deck_filled_arr[i].data("serial_number"))
//             }
//         }

//         deck_arr.push("#extra")
//         for (i = 0; i < extra_filled_arr.length; i++) {
//             if (~~extra_filled_arr[i].data("serial_number") > 0) {
//                 deck_arr.push(extra_filled_arr[i].data("serial_number"))   
//             }
//         }

//         deck_arr.push("!side")
//         for (i = 0; i < side_filled_arr.length; i++) {
//             if (~~side_filled_arr[i].data("serial_number") > 0) {
//                 deck_arr.push(side_filled_arr[i].data("serial_number"))
//             }
//         }

//         deck_arr.push("")
//         return deck_arr
//     `
    
//     try {      
//         console.log(`Loading ${player.tag}'s deck at ${url}...`)
//         await driver.get(url)
//         console.log('driver got Url')
//         await driver.wait(until.elementLocated(By.id('deckCard1')), 60000)
//         console.log('driver found deckCard1')
//         deck_arr = await driver.executeScript(get_deck)
//         console.log('driver executed script')
//     } catch (err) {
//         console.log(err)
//         try {
//             await driver.quit()
//             console.log('driver quit')
//             exec('killall firefox')
//             exec('killall /usr/lib/firefox/firefox')
//             await clearStatus('firefox')
//         } catch (err) {
//             console.log(err)
//         }
//     } finally {
//         try {
//             await driver.quit()
//             console.log('driver quit')
//             exec('killall firefox')
//             exec('killall /usr/lib/firefox/firefox')
//             await clearStatus('firefox')
//         } catch (err) {
//             console.log(err)
//         }
//     }
        
//     if (!deck_arr.length) return false
//     const file = deck_arr.join('\n')
//     const cards_arr = deck_arr.filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()
//     const cards_obj = convertArrayToObject(cards_arr)    

//     const forbiddenCardIds = [...await Status.findAll({ where: { current: 'forbidden' }})].map(s => s.konamiCode)
//     const limitedCardIds = [...await Status.findAll({ where: { current: 'limited' }})].map(s => s.konamiCode)
//     const semiLimitedCardIds = [...await Status.findAll({ where: { current: 'semi-limited' }})].map(s => s.konamiCode)
//     const allForgedCards = await fetchAllForgedCards()
//     const cardIds = allForgedCards.map(c => c.konamiCode)
//     const { singleIds, doubleIds, tripleIds } = await getInventorySummary(allForgedCards, player.id)
    
//     const illegalCards = []
//     const phantomCards = []
//     const forbiddenCards = []
//     const limitedCards = []
//     const semiLimitedCards = []
//     const unrecognizedCards = []

//     const keys = Object.keys(cards_obj)
//     for (let i = 0; i < keys.length; i++) {
//         let konamiCode = keys[i]
//         while (konamiCode.length < 8) konamiCode = '0' + konamiCode 
//         if (!cardIds.includes(konamiCode)) {
//             const card = await Card.findOne({ where: { konamiCode: konamiCode } })
//             if (card) {
//                 illegalCards.push(card.name)
//             } else {
//                 unrecognizedCards.push(konamiCode)
//             }
//         } else if (forbiddenCardIds.includes(konamiCode)) {
//             const card = await Card.findOne({ where: { konamiCode: konamiCode } })
//             if (card) forbiddenCards.push(card.name)
//         } else if (limitedCardIds.includes(konamiCode) && cards_obj[konamiCode] > 1) {
//             const card = await Card.findOne({ where: { konamiCode: konamiCode } })
//             if (card) limitedCards.push(card.name)
//         } else if (semiLimitedCardIds.includes(konamiCode) && cards_obj[konamiCode] > 2) {
//             const card = await Card.findOne({ where: { konamiCode: konamiCode } })
//             if (card) semiLimitedCards.push(card.name)
//         } else if (!tripleIds.includes(konamiCode) && cards_obj[konamiCode] >= 3) {
//             const card = await Card.findOne({ where: { konamiCode: konamiCode } })
//             if (card) phantomCards.push(card.name)
//         } else if (!doubleIds.includes(konamiCode) && cards_obj[konamiCode] >= 2) {
//             const card = await Card.findOne({ where: { konamiCode: konamiCode } })
//             if (card) phantomCards.push(card.name)
//         } else if (!singleIds.includes(konamiCode) && cards_obj[konamiCode] >= 1) {
//             const card = await Card.findOne({ where: { konamiCode: konamiCode } })
//             if (card) phantomCards.push(card.name)
//         } 
//     }

//     const tag = player.tag.replace(/[^\ws]/gi, "_").replace(/ /g,'')
//     fs.writeFile(`./decks/${tournamentName}/${tag}.ydk`, file, (err) => {
//         if(err) {
//             return console.log(err)
//         } else {
//             console.log(`${player.tag}'s deck was saved!`)
//         }
//     })

//     phantomCards.sort()
//     illegalCards.sort()
//     forbiddenCards.sort()
//     limitedCards.sort()
//     semiLimitedCards.sort()
//     unrecognizedCards.sort()

//     const issues = {
//         phantomCards,
//         illegalCards,
//         forbiddenCards,
//         limitedCards,
//         semiLimitedCards,
//         unrecognizedCards
//     }

//     return issues
// }

//SAVE ALL YDKs
export const saveAllYDK = async () => {
    const allDecks = await Tournament.findAll()

    for (let i = 0; i < allDecks.length; i++) {
        const member = {
            user: {
                username: allDecks[i].pilot
            }
        }

        const url = allDecks[i].url

        setTimeout(async function () {
            try {
                await saveYDK(member, url)
            } catch (err) {
                console.log(err)
            }
        }, (( i * 15000 ) + 1000))
    }
}

//CHECK DECK LIST
export const checkDeckList = async (client, message, member, formatName, formatEmoji, formatDate, formatList) => {  
    const filter = m => m.author.id === member.user.id
    const msg = await member.user.send({ content: `Please provide a duelingbook.com/deck link for the ${formatName} Format ${formatEmoji} deck you would like to check for legality.`}).catch((err) => console.log(err))
    if (!msg || !msg.channel) return false
    await msg.channel.awaitMessages({ 
        filter,
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const url = collected.first().content
        if (url.startsWith("https://www.duelingbook.com/deck") || url.startsWith("www.duelingbook.com/deck") || url.startsWith("duelingbook.com/deck")) {
            message.author.send({ content: 'Thanks. Please wait while I download the .YDK file. This can take up to 60 seconds.'})
            const issues = await saveYDK(message.author, url, formatDate, formatList)
            
            if (issues['illegalCards'].length || issues['forbiddenCards'].length || issues['limitedCards'].length || issues['semiLimitedCards'].length) {
                let response = `I'm sorry, ${message.author.username}, your deck is not legal for ${formatName} Format. ${formatEmoji}`
                if (issues['illegalCards'].length) response += `\n\nThe following cards are not included in this format:\n${issues['illegalCards'].join('\n')}`
                if (issues['forbiddenCards'].length) response += `\n\nThe following cards are forbidden:\n${issues['forbiddenCards'].join('\n')}`
                if (issues['limitedCards'].length) response += `\n\nThe following cards are limited:\n${issues['limitedCards'].join('\n')}`
                if (issues['semiLimitedCards'].length) response += `\n\nThe following cards are semi-limited:\n${issues['semiLimitedCards'].join('\n')}`
                
                return message.author.send({ content: response })
            } else {
                return message.author.send({ content: `Your ${formatName} Format ${formatEmoji} deck is perfectly legal. You are good to go! ${soldier}`})
            }
        } else {
            return message.author.send({ content: "Sorry, I only accept duelingbook.com/deck links." })      
        }
    }).catch((err) => {
		console.log(err)
        return message.author.send({ content: `Sorry, time's up. If you wish to try again, go back to the Discord server and use the **!check** command.` })
    })
}


//GET DECK TYPE
export const getDeckType = async (player, tournamentName = 'other') => {
    const file = `./decks/${tournamentName}/${player.tag.replace(/[^\ws]/gi, "_").replace(/ /g,'')}.ydk`
    const raw = fs.readFileSync(file, 'utf8')
    if (!raw) return
    const main = raw.split('#extra')[0]
    if (!main) return
    const arr = main.split('\n').filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()
    const ydk = convertArrayToObject(arr)
    const deckType =  'other'

    return deckType
}

// SEND INVENTORY YDK
export const sendInventoryYDK = async (interaction, player) => {
    const invs = await ForgedInventory.findAll({
        where: {
            playerId: player.id,
            quantity: {[Op.gt]: 0}
        },
        order: [['cardCode', 'ASC']]
    })

    const konamiCodes = []
    const mainKonamiCodes = []
    const sideKonamiCodes = []

    for (let i = 0; i < invs.length; i++) {
        const inv = invs[i]
        const card = await Card.findOne({ where: { name: inv.cardName } })
        const konamiCode = card.konamiCode
        if (inv.quantity >= 3) {
            konamiCodes.push(konamiCode, konamiCode, konamiCode)
        } else if (inv.quantity === 2) {
            konamiCodes.push(konamiCode, konamiCode)
        } else {
            konamiCodes.push(konamiCode)
        }
    }

    for (let i = 0; i < konamiCodes.length; i++) {
        const konamiCode = konamiCodes[i]
        if (i <= 60) {
            mainKonamiCodes.push(konamiCode)
        } else {
            sideKonamiCodes.push(konamiCode)
        }
    }

    const ydk = `#main\n${mainKonamiCodes.join('\n')}\n#extra\n!side\n${sideKonamiCodes.join('\n')}\n`
    const ydkFile = new AttachmentBuilder(Buffer.from(ydk), { name: `${player.name}_inventory.ydk` })
    return interaction.user.send({ files: [ydkFile] })
}