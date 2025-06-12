// const { Auction, Bid, Print, Set, Inventory, Player, Wallet } = require('../database/index.js')
import { ForgedInventory, ForgedPrint } from '../database/index.js'
import emojis from '../static/emojis.json' with { type: 'json' }
const { com, rar, sup, ult, scr } = emojis
// const { yescom, nocom } = require('../static/commands.json')
// const { findCard } = require('./search.js')
// const { completeTask } = require('./diary.js')
// const { DRT, fiend, thunder, zombie, beast, blue, bronze, cactus, cavebob, checkmark, com, credits, cultured, diamond, dinosaur, DOC, LPK, egg, emptybox, skull, familiar, battery, evil, FiC, fire, fish, god, gold, hook, koolaid, leatherbound, legend, lmfao, mad, master, merchant, milleye, moai, mushroom, no, ORF, TEB, FON, warrior, spellcaster, dragon, plant, platinum, rar, red, reptile, rock, rocks, rose, sad, scr, silver, soldier, starchips, stardust, stare, dimmadome, sup, tix, ult, wokefrog, yellow, yes, ygocard } = require('../static/emojis.json')
// const { Message } = require('discord.js')

export const awardCard = async (channel, playerId, cardCode, quantity = 1) => {
    const print = await ForgedPrint.findOne({ where: { cardCode }})
    if (!print) return channel.send({ content: `Could not find print: "${cardCode}".`})
    const card = `${eval(print.rarity)}${cardCode} - ${print.cardName}`

    const inv = await ForgedInventory.findOne({
        where: {
            playerId,
            cardCode
        }
    })

    if (inv) {
        inv.quantity += quantity
        await inv.save()
    } else {
        await ForgedInventory.create({
            playerId,
            cardCode,
            quantity,
            forgedPrintId: print.id
        })

        // if (print.rarity === 'scr') completeTask(channel, playerId, 'm4')
    }

    // if (print.setCode === 'APC' && ((inv && inv.quantity >= 3) || quantity >=3 )) completeTask(channel, playerId, 'h5')
    return channel.send({ content: `<@${playerId}> was awarded ${quantity} ${card}. Congratulations!`})
}