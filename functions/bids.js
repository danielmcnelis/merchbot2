
import { Auction, Bid, ForgedPrint, ForgedSet, ForgedInventory, Player, Wallet } from '../database/index.js'
import { findCard } from './search.js'
import { selectPrint } from './print.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { beast, blue, bronze, cactus, cavebob, checkmark, com, credits, cultured, diamond, dinosaur, DOC, LPK, DRT, fiend, thunder, zombie, egg, skull, familiar, battery, emptybox, evil, FiC, fire, fish, god, gold, hook, koolaid, leatherbound, legend, lmfao, mad, master, merchant, milleye, moai, mushroom, no, ORF, TEB, FON, warrior, spellcaster, dragon, plant, platinum, rar, red, reptile, rock, rocks, rose, sad, scr, silver, soldier, starchips, stardust, stare, dimmadome, sup, tix, ult, wokefrog, yellow, yes, ygocard } = emojis

export const manageBidding = async (message, player, bids) => {
    const filter = m => m.author.id === message.author.id
    const bidSummary = []
    if (bids.length) {
        for (let i = 0; i < bids.length; i++) {
            const bid = bids[i]
            const auction = await Auction.findOne({ 
                where: { id: bid.auctionId },
                include: Print
            })
            if (!auction) continue
            bidSummary.push(`${eval(auction.print.rarity)}${auction.print.cardCode} - ${auction.print.cardName} - ${bid.amount}${stardust}`)
        }
    }

    const prompt = `Your bids are as follows:\n${bidSummary.join("\n")}\n\nWhat would you like to do?\n${bidSummary.length >= 3 ? '(1) cancel a bid\n(2) nothing' : '(1) place a bid\n(2) cancel a bid\n(3) nothing'}`
    const msg = await message.author.send({ content: prompt.toString() }).catch((err) => console.log(err))
    if (!msg || !msg.channel) return false
    return await msg.channel.awaitMessages({ filter,
        max: 1,
        time: 20000
    }).then((collected) => {
        const response = collected.first().content.toLowerCase()
        if(response.includes('bid') || response.includes('place') || (bidSummary.length < 3 && response.includes('1'))) {
            return askForBidPlacement(message, player)
        } else if(response.includes('can') || (bidSummary.length >= 3 && response.includes('1')) ||  (bidSummary.length < 3 && response.includes('2'))) {
            return askForBidCancellation(message, player)
        } else {
            return message.author.send({ content: `Not a problem. Have a nice day.` })
        }
    }).catch((err) => {
		console.log(err)
        return message.author.send({ content: `Sorry, time's up.` })
    })
}

// ASK FOR BID PLACEMENT
export const askForBidPlacement = async (message, player) => {
    const filter = m => m.author.id === message.author.id
    const msg = await message.author.send({ content: `Which card would you like to bid on?`}).catch((err) => console.log(err))
    if (!msg || !message.channel) return false
    await msg.channel.awaitMessages({ filter,
        max: 1,
        time: 45000
    }).then(async (collected) => {
        const query = collected.first().content
        const cardCode = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
        const validCardCode = !!(cardCode.length === 7 && isFinite(cardCode.slice(-3)) && await Set.count({where: { code: cardCode.slice(0, 3) }}))
        const cardName = await findCard(query, fuzzyPrints)
        const print = validCardCode ? await Print.findOne({ where: { cardCode: cardCode }}) : cardName ? await selectPrint(message, player.id, cardName, discrete = true, inInv = false, inAuc = true) : null
        if (!print) return message.author.send({ content: `Sorry, I do not recognize the card: "${query}".`})
        const card = `${eval(print.rarity)}${print.cardCode} - ${print.cardName}`
        const auction = await Auction.findOne({ where: { printId: print.id } })
        if (!auction) return message.author.send({ content: `Sorry, ${card} is not part of the auction tonight.`})

        const inv = await Inventory.findOne({ 
            where: { 
                printId: print.id,
                playerId: player.id
            }
        })

        if (inv && inv.quantity >= 3) return message.author.send({ content: `Sorry, you already have ${inv.quantity} copies of ${card}.`})

        if (player.bids.length) {
            for (let i = 0; i < player.bids.length; i++) {
                const bid = player.bids[i]
                if (print.cardCode === bid.cardCode) return message.author.send({ content: `Sorry, you already placed a bid on ${card}.`})
            }
        }

        const amount = await askForBidAmount(message, player, print, card)
        if (!amount) return

        await Bid.create({
            cardCode: print.cardCode,
            amount,
            playerId: player.id,
            auctionId: auction.id
        })
            
        message.author.send({ content: `Thanks! You placed a ${amount}${stardust} bid on ${eval(print.rarity)}${print.cardCode} - ${print.cardName}.`})
        const updatedPlayer = await Player.findOne({ where: { id: player.id }, include: [Bid, Wallet], order: [[Bid, 'amount', 'DESC']]})
        if (!updatedPlayer || player.bids.length >= 3) return
        else return setTimeout(async () => manageBidding(message, updatedPlayer, fuzzyPrints), 2000)
    }).catch((err) => {
		console.log(err)
        return message.author.send({ content: `Sorry, time's up.`})
    })
}

// ASK FOR BID AMOUNT
export const askForBidAmount = async (message, player, print, card) => {
    const filter = m => m.author.id === message.author.id
    const price = Math.ceil(print.marketPrice * 1.1)
    const msg = await message.author.send({ content: `The Shop sells ${card} for ${price}${stardust}. How much would you like to bid?`}).catch((err) => console.log(err))
    if (!msg || !msg.channel) return false
    return await msg.channel.awaitMessages({ filter,
        max: 1,
        time: 20000
    }).then((collected) => {
        const offer = parseInt(collected.first().content.toLowerCase())
        if (isNaN(offer) || offer < 1) {
            message.author.send({ content: `Sorry, that is not a valid amount.`})
            return false
        } else if (offer < price) {
            message.author.send({ content: `Sorry, you must bid at least ${price}${stardust}.`})
            return false
        } else if (player.wallet.stardust < offer) {
            message.author.send({ content: `Sorry, you only have ${player.wallet.stardust}${stardust}.`})
            return false
        } else {
            return offer
        }
    }).catch((err) => {
		console.log(err)
        message.author.send({ content: `Sorry, time's up.`})
        return false
    })
}

// ASK FOR BID CANCELLATION
export const askForBidCancellation = async (message, player, fuzzyPrints) => {
    const filter = m => m.author.id === message.author.id

    const bidSummary = []
    for (let i = 0; i < player.bids.length; i++) {
        const bid = player.bids[i]
        const auction = await Auction.findOne({ 
            where: { id: bid.auctionId },
            include: Print
        })
        if (!auction) continue
        bidSummary.push(`(${i+1}) ${eval(auction.print.rarity)}${bid.cardCode} - ${auction.print.cardName} - ${bid.amount}${stardust}`)
    }

    const msg = await message.author.send({ content: `Which bid would you like to cancel?:\n${bidSummary.join("\n").toString()}?`}).catch((err) => console.log(err))
    if (!msg || !msg.channel) return false
    await msg.channel.awaitMessages({ 
        filter,
        max: 1,
        time: 20000
    }).then(async (collected) => {
        const response = parseInt(collected.first().content.toLowerCase())
        if (isNaN(response) || response < 1 || response > bidSummary.length) {
            return message.author.send({ content: `Sorry, that is not a valid number.`})
        } else {
            const index = response - 1
            const bid = player.bids[index]
            await bid.destroy()
            message.author.send({ content: `You canceled your bid on ${bidSummary[index].slice(4)}.`})
            const updatedPlayer = await Player.findOne({ where: { id: player.id }, include: [Bid, Wallet], order: [[Bid, 'amount', 'DESC']]})
            if (!updatedPlayer) return
            if (updatedPlayer.bids.length === 0) return setTimeout(async () => askForBidPlacement(message, updatedPlayer, fuzzyPrints), 2000)
            else return setTimeout(async () => manageBidding(message, updatedPlayer, fuzzyPrints), 2000)
        }
    }).catch((err) => {
		console.log(err)
        return message.author.send({ content: `Sorry, time's up.`})
    })
}
