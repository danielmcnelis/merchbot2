

const {Builder, By, until} = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
const fs = require('fs')
const errors = require('../static/errors.json')
const { approve } = require('../static/emojis.json')
const { Op } = require('sequelize')
const { convertCardsArrayToObject } = require('./utility.js')
const { fetchAllForgedCards, fetchYourDoubles, fetchYourSingles, fetchYourTriples } = require('./search.js')
const { Auction, Bid, Card, Print, Set, Inventory,  Tournament, Status } = require('../db')
const decks = require('../static/decks.json')

//GET SHOP DECK
const getShopDeck = async (message) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`Please select a deck:\n(1) Dinosaur's Power\n(2) Plant's Harmony\n(3) Fish's Ire\n(4) Rock's Foundation`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(collected => {
        let deck
		const response = collected.first().content.toLowerCase()
        if(response.includes('dino') || response.includes('1')) deck = 'dinosaur' 
        else if(response.includes('plant') || response.includes('2')) deck = 'plant'
        else if(response.includes('fish') || response.includes('3')) deck = 'fish'
        else if(response.includes('rock') || response.includes('4')) deck = 'rock'
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
const saveYDK = async (member, url) => {
    const options = new firefox.Options()
    options.addArguments("-headless")
    const username = member.user ? member.user.username : member.username    
    const playerId = member.user ? member.user.id : member.id    
    const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build()
    
    try {
        console.log(`Loading ${username}'s deck at ${url}...`)
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
        const cards_arr = deck_arr.filter(elem => elem.charAt(0) !== '#' && elem.charAt(0) !== '!' && elem !== '')
        cards_arr.sort()
        const cards_obj = convertCardsArrayToObject(cards_arr)
        const allForgedCards = await fetchAllForgedCards()
        const yourSingles = await fetchYourSingles(allForgedCards, playerId)
        const yourDoubles = await fetchYourDoubles(allForgedCards, playerId)
        const yourTriples = await fetchYourTriples(allForgedCards, playerId)

        const allForbiddenCards = await Status.findAll({ 
            where: {
                current: 'forbidden'
            }
        })

        const allLimitedCards = await Status.findAll({ 
            where: {
                current: 'limited'
            }
        })

        const allSemiLimitedCards = await Status.findAll({ 
            where: {
                current: 'semi-limited'
            }
        })

        const cardIds = allForgedCards.map(card => {
            let id = card.image.slice(0,-4)
            while (id.length < 8) id = '0' + id
            return id
        })

        const singleIds = yourSingles.map(card => {
            let id = card.image.slice(0,-4)
            while (id.length < 8) id = '0' + id
            return id
        })

        console.log('singleIds', singleIds)

        const doubleIds = yourDoubles.map(card => {
            let id = card.image.slice(0,-4)
            while (id.length < 8) id = '0' + id
            return id
        })
        console.log('doubleIds', doubleIds)

        const tripleIds = yourTriples.map(card => {
            let id = card.image.slice(0,-4)
            while (id.length < 8) id = '0' + id
            return id
        })
        console.log('tripleIds', tripleIds)

        const forbiddenCardIds = allForbiddenCards.map(card => card.konamiCode)
        const limitedCardIds = allLimitedCards.map(card => card.konamiCode)
        const semiLimitedCardIds = allSemiLimitedCards.map(card => card.konamiCode)

        let phantomCards = []
        let illegalCards = []
        let forbiddenCards = []
        let limitedCards = []
        let semiLimitedCards = []
        let unrecognizedCards = []

        const keys = Object.keys(cards_obj)

        for (let key of keys) {
            let id = key
            while (key.length < 8) key = '0' + key
            while (id.charAt(0) === '0') id = id.slice(1)
            const imageFile = `${id}.jpg`

            if (cardIds.includes(key)) {
               if (forbiddenCardIds.includes(key)) {
                    const forbiddenCard = await Card.findOne({
                        where: {
                            image: imageFile
                        }
                    })

                    forbiddenCards.push(forbiddenCard.name)
                } else if (limitedCardIds.includes(key) && cards_obj[key] > 1) {
                    const limitedCard = await Card.findOne({
                        where: {
                            image: imageFile
                        }
                    })
    
                    limitedCards.push(limitedCard.name)
                } else if (semiLimitedCardIds.includes(key) && cards_obj[key] > 2) {
                    const semiLimitedCard = await Card.findOne({
                        where: {
                                image: imageFile
                            }
                        })
        
                    semiLimitedCards.push(semiLimitedCard.name)
                } else if (!tripleIds.includes(key) && cards_obj[key] >= 3) {
                    const phantomCard = await Card.findOne({
                        where: {
                                image: imageFile
                            }
                        })
        
                        phantomCards.push(phantomCard.name)
                } else if (!doubleIds.includes(key) && cards_obj[key] >= 2) {
                    const phantomCard = await Card.findOne({
                        where: {
                                image: imageFile
                            }
                        })
        
                        phantomCards.push(phantomCard.name)
                } else if (!singleIds.includes(key) && cards_obj[key] >= 1) {
                    const phantomCard = await Card.findOne({
                        where: {
                                image: imageFile
                            }
                        })
        
                        phantomCards.push(phantomCard.name)
                } 
            } else {
                const illegalCard = await Card.findOne({
                    where: {
                        image: imageFile
                    }
                })

                if (illegalCard) {
                    illegalCards.push(illegalCard.name)
                } else {
                    const jsonData = fs.readFileSync('./static/errors.json')
                    const jsonParse = JSON.parse(jsonData)
                    const badCardIds = jsonParse["badCardIds"]
                    if(!badCardIds.includes(id)) badCardIds.push(id)
            
                    errors['badCardIds'] = badCardIds
                    fs.writeFile('./static/errors.json', JSON.stringify(errors), (err) => { 
                        if (err) console.log(err)
                    })

                    unrecognizedCards.push(id)
                }
            }
        }

		fs.writeFile(`./decks/${username}.ydk`, file, function(err) {
			if(err) {
				return console.log(err)
			}
			console.log(`${username}'s deck was saved!`)
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
                return message.author.send(`Your ${formatName} Format ${formatEmoji} deck is perfectly legal. You are good to go! ${approve}`)
            }
        } else {
            return message.author.send("Sorry, I only accept duelingbook.com/deck links.")      
        }
    }).catch(err => {
        console.log(err)
        return message.author.send(`Sorry, time's up. If you wish to try again, go back to the Discord server and use the **!check** command.`)
    })
}

module.exports = {
    awardStarterDeck,
    checkDeckList,
    getShopDeck,
    saveAllYDK,
    saveYDK
}