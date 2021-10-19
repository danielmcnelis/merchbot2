

const {Builder, By, until} = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
const fs = require('fs')
const errors = require('../static/errors.json')
const { soldier } = require('../static/emojis.json')
const { Op } = require('sequelize')
const { convertArrayToObject } = require('./utility.js')
const { fetchAllForgedCards, getInventorySummary } = require('./search.js')
const { Auction, Bid, Card, Print, Set, Inventory,  Tournament, Status } = require('../db')
const decks = require('../static/decks.json')

//GET SHOP DECK
const getShopDeck = async (message, deck = '') => {
    if(deck.includes('dino')) return 'dinosaur' 
    if(deck.includes('plant')) return 'plant'
    if(deck.includes('fish')) return 'fish'
    if(deck.includes('rock')) return 'rock'
    if(deck.includes('drag')) return 'dragon'
    if(deck.includes('spell') || deck.includes('cast')) return 'spellcaster'
    if(deck.includes('war')) return 'warrior'
    if(deck.includes('rep')) return 'reptile'
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Please select a deck:\n(1) Reptile's Charm\n(2) Warrior's Legend\n(3) Dragon's Inferno\n(4) Spellcaster's Art\n(5) Dinosaur's Power\n(6) Plant's Harmony\n(7) Fish's Ire\n(8) Rock's Foundation`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(collected => {
        let deck
		const response = collected.first().content.toLowerCase()
        if(response.includes('rep') || response.includes('1')) deck = 'reptile' 
        else if(response.includes('war') || response.includes('2')) deck = 'warrior'
        if(response.includes('drag') || response.includes('3')) deck = 'dragon' 
        else if(response.includes('spell') || response.includes('cast') || response.includes('4')) deck = 'spellcaster'
        else if(response.includes('dino') || response.includes('5')) deck = 'dinosaur' 
        else if(response.includes('plant') || response.includes('6')) deck = 'plant'
        else if(response.includes('fish') || response.includes('7')) deck = 'fish'
        else if(response.includes('rock') || response.includes('8')) deck = 'rock'
        else message.channel.send(`Please specify a valid deck.`)
        return deck
	}).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}



// AWARD STARTER DECK
const awardStarterDeck = async (playerId, starter) => {
    const keys = Object.keys(decks[starter].cards)

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const print = await Print.findOne( { where: { card_code: key } })
        if (!print.id) return console.log(`${key} does not exist in the Print database.`)
    
        const inv = await Inventory.findOne({ where: { 
            card_code: print.card_code,
            printId: print.id,
            playerId: playerId
        }})
    
        if (inv) {
            inv.quantity += decks[starter].cards[key]
            await inv.save()
        } else {
            await Inventory.create({ 
                card_code: print.card_code,
                quantity: decks[starter].cards[key],
                printId: print.id,
                playerId: playerId
            })
        }
    }
}

//SAVE YDK
const saveYDK = async (player, url, tournamentName = 'other') => {
    const options = new firefox.Options()
    options.addArguments("-headless")
    const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build()

    try {
        console.log(`Loading ${player.tag}'s deck at ${url}...`)
        const get_deck = `
            deck_arr = ["#created by ...", "#main"]

            for (let i = 0; i < deck_filled_arr.length; i++) {
                if (~~deck_filled_arr[i].data("serial_number") > 0) {
                    deck_arr.push(deck_filled_arr[i].data("serial_number"))
                }
            }

            deck_arr.push("#extra")
            for (i = 0; i < extra_filled_arr.length; i++) {
                if (~~extra_filled_arr[i].data("serial_number") > 0) {
                    deck_arr.push(extra_filled_arr[i].data("serial_number"))   
                }
            }

            deck_arr.push("!side")
            for (i = 0; i < side_filled_arr.length; i++) {
                if (~~side_filled_arr[i].data("serial_number") > 0) {
                    deck_arr.push(side_filled_arr[i].data("serial_number"))
                }
            }

            deck_arr.push("")
            return deck_arr
        `
        
		await driver.get(url)
		await driver.wait(until.elementLocated(By.id('deck_card1')))
		const deck_arr = await driver.executeScript(get_deck)
        const file = deck_arr.join('\n')
        const cards_arr = deck_arr.filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()
        const cards_obj = convertArrayToObject(cards_arr)    

        const forbiddenCardIds = await Status.findAll({ where: { current: 'forbidden' }}).map(s => s.konami_code)
        const limitedCardIds = await Status.findAll({ where: { current: 'limited' }}).map(s => s.konami_code)
        const semiLimitedCardIds = await Status.findAll({ where: { current: 'semi-limited' }}).map(s => s.konami_code)
        const allForgedCards = await fetchAllForgedCards()
        const cardIds = allForgedCards.map(c => c.konami_code)
        const { singleIds, doubleIds, tripleIds } = await getInventorySummary(allForgedCards, player.id)
       
        const illegalCards = []
        const forbiddenCards = []
        const limitedCards = []
        const semiLimitedCards = []
        const unrecognizedCards = []

        const keys = Object.keys(cards_obj)
        for (let i = 0; i < keys.length; i++) {
            let konami_code = keys[i]
            while (konami_code.length < 8) konami_code = '0' + konami_code 
            if (!cardIds.includes(konami_code)) {
                const card = await Card.findOne({ where: { konami_code: konami_code } })
                if (card) {
                    illegalCards.push(card.name)
                } else {
                    unrecognizedCards.push(konami_code)
                }
            } else if (forbiddenCardIds.includes(konami_code)) {
                const card = await Card.findOne({ where: { konami_code: konami_code } })
                if (card) forbiddenCards.push(card.name)
            } else if (limitedCardIds.includes(konami_code) && cards_obj[konami_code] > 1) {
                const card = await Card.findOne({ where: { konami_code: konami_code } })
                if (card) limitedCards.push(card.name)
            } else if (semiLimitedCardIds.includes(konami_code) && cards_obj[konami_code] > 2) {
                const card = await Card.findOne({ where: { konami_code: konami_code } })
                if (card) semiLimitedCards.push(card.name)
            } else if (!tripleIds.includes(konami_code) && cards_obj[konami_code] >= 3) {
                const card = await Card.findOne({ where: { konami_code: konami_code } })
                if (card) phantomCards.push(card.name)
            } else if (!doubleIds.includes(konami_code) && cards_obj[konami_code] >= 2) {
                const card = await Card.findOne({ where: { konami_code: konami_code } })
                if (card) phantomCards.push(card.name)
            } else if (!singleIds.includes(konami_code) && cards_obj[konami_code] >= 1) {
                const card = await Card.findOne({ where: { konami_code: konami_code } })
                if (card) phantomCards.push(card.name)
            } 
        }

        const tag = player.tag.replace(/[^\w\s]/gi, "_").replace(/ /g,'')
		fs.writeFile(`./decks/${tournamentName}/${tag}.ydk`, file, (err) => {
			if(err) {
				return console.log(err)
			} else {
                console.log(`${player.tag}'s deck was saved!`)
            }
		})

        phantomCards.sort()
        illegalCards.sort()
        forbiddenCards.sort()
        limitedCards.sort()
        semiLimitedCards.sort()
        unrecognizedCards.sort()

        const issues = {
            phantomCards,
            illegalCards,
            forbiddenCards,
            limitedCards,
            semiLimitedCards,
            unrecognizedCards
        }

        return issues
	} catch (err) {
		console.log(err)
	} finally {
		await driver.quit()
	}
}

//SAVE ALL YDKs
const saveAllYDK = async () => {
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
const checkDeckList = async (client, message, member, formatName, formatEmoji, formatDate, formatList) => {  
    const filter = m => m.author.id === member.user.id
    const msg = await member.user.send(`Please provide a duelingbook.com/deck link for the ${formatName} Format ${formatEmoji} deck you would like to check for legality.`);
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 180000
    }).then(async collected => {
        if (collected.first().content.startsWith("https://www.duelingbook.com/deck") || collected.first().content.startsWith("www.duelingbook.com/deck") || collected.first().content.startsWith("duelingbook.com/deck")) {		
            message.author.send('Thanks. Please wait while I download the .YDK file. This can take up to 30 seconds.')

            const url = collected.first().content
            const issues = await saveYDK(message.author, url, formatDate, formatList)
            
            if (issues['illegalCards'].length || issues['forbiddenCards'].length || issues['limitedCards'].length || issues['semiLimitedCards'].length) {
                let response = `I'm sorry, ${message.author.username}, your deck is not legal for ${formatName} Format. ${formatEmoji}`
                if (issues['illegalCards'].length) response += `\n\nThe following cards are not included in this format:\n${issues['illegalCards'].join('\n')}`
                if (issues['forbiddenCards'].length) response += `\n\nThe following cards are forbidden:\n${issues['forbiddenCards'].join('\n')}`
                if (issues['limitedCards'].length) response += `\n\nThe following cards are limited:\n${issues['limitedCards'].join('\n')}`
                if (issues['semiLimitedCards'].length) response += `\n\nThe following cards are semi-limited:\n${issues['semiLimitedCards'].join('\n')}`
            
                return message.author.send(response)
            } else {
                return message.author.send(`Your ${formatName} Format ${formatEmoji} deck is perfectly legal. You are good to go! ${soldier}`)
            }
        } else {
            return message.author.send("Sorry, I only accept duelingbook.com/deck links.")      
        }
    }).catch(err => {
        console.log(err)
        return message.author.send(`Sorry, time's up. If you wish to try again, go back to the Discord server and use the **!check** command.`)
    })
}


//GET DECK TYPE
const getDeckType = async (player, format, tournamentName = 'other') => {
    const file = `./decks/${tournamentName}/${player.tag.replace(/[^\w\s]/gi, "_").replace(/ /g,'')}.ydk`
    const raw = fs.readFileSync(file, 'utf8')
    if (!raw) return
    const main = raw.split('#extra')[0]
    if (!main) return
    const arr = main.split('\n').filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()
    const ydk = convertArrayToObject(arr)

    const deckType =  'other'

    console.log(file, ' is ', deckType)
    return deckType
}

module.exports = {
    awardStarterDeck,
    checkDeckList,
    getDeckType,
    getShopDeck,
    saveAllYDK,
    saveYDK
}