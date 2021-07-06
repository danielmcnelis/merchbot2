
const { Auction, Bid, Print, Set, Inventory, Player, Wallet } = require('../db')
const { yescom, nocom } = require('../static/commands.json')
const { findCard } = require('./search.js')
const { selectPrint } = require('./print.js')
const { blue, red, stoned, stare, wokeaf, koolaid, cavebob, evil, DOC, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, ROCK, sad, mad, beast, dragon, machine, spellcaster, warrior, zombie, starchips, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')

const manageBidding = async (message, player) => {
    const filter = m => m.author.id === message.author.id
    const bidSummary = []
    if (player.bids.length) {
        for (let i = 0; i < player.bids.length; i++) {
            const bid = player.bids[i]
            const auction = await Auction.findOne({ 
                where: { id: bid.auctionId },
                include: Print
            })
            if (!auction) continue
            bidSummary.push(`${eval(auction.print.rarity)}${auction.print.card_code} - ${auction.print.card_name} - ${bid.amount}${stardust}`)
        }
    }

    const prompt = `Your bids are as follows:\n${bidSummary.join("\n")}\n\nWhat would you like to do?\n${bidSummary.length >= 3 ? '(1) cancel a bid\n(2) nothing' : '(1) place a bid\n(2) cancel a bid\n(3) nothing'}`
    const msg = await message.author.send(prompt)
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 20000
    }).then(async collected => {
        const response = collected.first().content.toLowerCase()
        if(response.includes('bid') || response.includes('place') || (bidSummary.length < 3 && response.includes('1'))) {
            return askForBidPlacement(message, player)
        } else if(response.includes('can') || (bidSummary.length >= 3 && response.includes('1')) ||  (bidSummary.length < 3 && response.includes('2'))) {
            return askForBidCancellation(message, player)
        } else {
            return message.author.send(`Not a problem. Have a nice day.`)
        }
    }).catch(err => {
        console.log(err)
        return message.author.send(`Sorry, time's up.`)
    })
}

const askForBidPlacement = async (message, player) => {
    const filter = m => m.author.id === message.author.id
    const msg = await message.author.send(`Which card would you like to bid on?`)
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 45000
    }).then(async collected => {
        const query = collected.first().content
        const card_code = `${query.slice(0, 3).toUpperCase()}-${query.slice(-3)}`
        const valid_card_code = !!(card_code.length === 7 && isFinite(card_code.slice(-3)) && await Set.count({where: { code: card_code.slice(0, 3) }}))
        const card_name = await findCard(query, fuzzyPrints, fuzzyPrints2)
        const print = valid_card_code ? await Print.findOne({ where: { card_code: card_code }}) : card_name ? await selectPrint(message, player.id, card_name) : null
        if (!print) return message.author.send(`Sorry, I do not recognize the card: "${query}".`)
        const card = `${eval(print.rarity)}${print.card_code} - ${print.card_name}`
        
        const auction = await Auction.findOne({ where: { printId: print.id } })
        if (!auction) return message.author.send(`Sorry, ${card} is not part of the auction tonight.`)


        const inv = await Inventory.findOne({ 
            where: { 
                printId: print.id,
                playerId: player.id
            }
        })

        if (inv && inv.quantity >= 3) return message.author.send(`Sorry, you already have ${inv.quantity} copies of ${card}.`)

        if (player.bids.length) {
            for (let i = 0; i < player.bids.length; i++) {
                const bid = player.bids[i]
                if (print.card_code === bid.card_code) return message.author.send(`Sorry, you already placed a bid on ${card}.`)
            }
        }

        const amount = await askForBidAmount(message, player, print, card)
        if (!amount) return

        await Bid.create({
            card_code: print.card_code,
            amount,
            playerId: player.id,
            auctionId: auction.id
        })
            
        message.author.send(`Thanks! You placed a ${amount}${stardust} bid on ${eval(print.rarity)}${print.card_code} - ${print.card_name}.`)
        const updatedPlayer = await Player.findOne({ where: { id: player.id }, include: [Bid, Wallet], order: [[Bid, 'amount', 'DESC']]})
        if (!updatedPlayer || player.bids.length >= 3) return
        else return setTimeout(() => manageBidding(message, updatedPlayer), 2000)
    }).catch(err => {
        console.log(err)
        return message.author.send(`Sorry, time's up.`)
    })
}

const askForBidAmount = async (message, player, print, card) => {
    const filter = m => m.author.id === message.author.id
    const price = Math.ceil(print.market_price * 1.2)
    const msg = await message.author.send(`The Shop sells ${card} for ${price}${stardust}. How much would you like to bid?`)
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 20000
    }).then(collected => {
        const offer = parseInt(collected.first().content.toLowerCase())
        if (isNaN(offer) || offer < 1) {
            message.author.send(`Sorry, that is not a valid amount.`)
            return false
        } else if (offer < price) {
            message.author.send(`Sorry, you must bid at least ${price}${stardust}.`)
            return false
        } else if (player.wallet.stardust < offer) {
            message.author.send(`Sorry, you only have ${player.wallet.stardust}${stardust}.`)
            return false
        } 
        
        return offer
    }).catch(err => {
        console.log(err)
        message.author.send(`Sorry, time's up.`)
        return false
    })

    return collected
}

const askForBidCancellation = async (message, player) => {
    const filter = m => m.author.id === message.author.id

    const bidSummary = []
    for (let i = 0; i < player.bids.length; i++) {
        const bid = player.bids[i]
        const auction = await Auction.findOne({ 
            where: { id: bid.auctionId },
            include: Print
        })
        if (!auction) continue
        bidSummary.push(`(${i+1}) ${eval(auction.print.rarity)}${bid.card_code} - ${auction.print.card_name} - ${bid.amount}${stardust}`)
    }

    const msg = await message.author.send(`Which bid would you like to cancel?:\n${bidSummary.join("\n")}?`)
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 20000
    }).then(async collected => {
        const response = parseInt(collected.first().content.toLowerCase())
        if (isNaN(response) || response < 1 || response > bidSummary.length) {
            return message.author.send(`Sorry, that is not a valid number.`)
        } else {
            const index = response - 1
            const bid = player.bids[index]
            await bid.destroy()
            message.author.send(`You canceled your bid on ${bidSummary[index].slice(4)}.`)
            const updatedPlayer = await Player.findOne({ where: { id: player.id }, include: [Bid, Wallet], order: [[Bid, 'amount', 'DESC']]})
            if (!updatedPlayer) return
            if (updatedPlayer.bids.length === 0) return setTimeout(() => askForBidPlacement(message, updatedPlayer), 2000)
            else return setTimeout(() => manageBidding(message, updatedPlayer), 2000)
        }
    }).catch(err => {
        console.log(err)
        return message.author.send(`Sorry, time's up.`)
    })
}

module.exports = {
    askForBidCancellation,
    askForBidPlacement,
    manageBidding
}
