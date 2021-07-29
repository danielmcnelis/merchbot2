const { Auction, Bid, Print, Set, Inventory, Player, Wallet } = require('../db')
const { yescom, nocom } = require('../static/commands.json')
const { findCard } = require('./search.js')
const { selectPrint } = require('./print.js')
const { completeTask } = require('./diary.js')
const { blue, red, stoned, stare, wokeaf, koolaid, cavebob, evil, DOC, ORF, milleye, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, ROCK, sad, mad, beast, dragon, machine, spellcaster, warrior, zombie, starchips, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')
const { Message } = require('discord.js')

const awardCard = async (channel, playerId, card_code, quantity = 1) => {
    const print = await Print.findOne({ where: { card_code }})
    if (!print) return channel.send(`Could not find print: "${card_code}".`)
    const card = `${eval(print.rarity)}${card_code} - ${print.card_name}`

    const inv = await Inventory.findOne({
        where: {
            playerId,
            card_code
        }
    })

    if (inv) {
        inv.quantity += quantity
        await inv.save()
    } else {
        await Inventory.create({
            playerId,
            card_code,
            quantity,
            printId: print.id
        })

        if (print.rarity === 'scr') completeTask(channel, playerId, 'm4')
    }

    if (print.set_code === 'APC' && ((inv && inv.quantity >= 3) || quantity >=3 )) completeTask(channel, playerId, 'h5')
    return channel.send(`<@${playerId}> was awarded ${quantity} ${card}. Congratulations!`)
}

module.exports = {
    awardCard
}
