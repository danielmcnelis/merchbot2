
const { Card, Match, Player, Tournament, Print, Set, Wallet, Diary, Inventory, Arena, Trivia, Keeper, Gauntlet, Draft, Daily, Binder, Wishlist, Profile } = require('../db')
const merchbotId = '584215266586525696'
const { Op } = require('sequelize')
const { DOC, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, ROCK, sad, mad, beast, dragon, machine, spellcaster, warrior, zombie, fish, rock, dinosaur, plant, reptile, starchips, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')

const updateShop = async (channel) => {
    channel.bulkDelete(100)
    
    setTimeout(() => {
        channel.bulkDelete(100)
    }, 2000)
    
    setTimeout(() => {
        channel.bulkDelete(100)
    }, 4000)

    setTimeout(async () => {
        const results = [`${merchant} --- Core Products --- ${merchant}`]
    
        const setsForSale = await Set.findAll({ 
            where: { 
                for_sale: true
             }
        })

        for (let i = 0; i < setsForSale.length; i++) {
            const set = setsForSale[i]
            if (set.type === 'core') {
                results.push(`${set.box_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Box`)
                results.push(`${set.unit_price}${eval(set.currency)} - ${set.name} ${eval(set.emoji)} - Pack`)
            }
        }
    
        for (let i = 0; i < setsForSale.length; i++) {
            const set = setsForSale[i]
            if (set.type === 'starter_deck') {
                if (set.name === 'Starter Series 1') {
                    results.push(`${set.unit_price}${eval(set.currency)} - Warrior's Pride ${eval(set.emoji)} - Starter`)
                    results.push(`${set.unit_price}${eval(set.currency)} - Spellcaster's Wrath ${eval(set.emoji)} - Starter`)
                }
            }
        }

        const shopInv = await Inventory.findAll({ 
            where: { 
                playerId: merchbotId,
                quantity: {
                    [Op.gte]: 1
                }
             },
            include: Print,
            order: [[Print, 'market_price', 'DESC']]
        })

        results.push(`\n${merchant} --- Single Cards --- ${merchant}`)
    
        for (let i = 0; i < shopInv.length; i++) {
            const row = shopInv[i]
            const market_price = row.print.market_price
            const selling_price = Math.ceil(market_price * 1.1)
            const buying_price = Math.ceil(market_price * 0.7)
            results.push(`${selling_price}${stardust}| ${buying_price}${stardust}-${eval(row.print.rarity)}${row.card_code} - ${row.print.card_name} - ${row.quantity}`) 
        }
    
        for (let i = 0; i < results.length; i += 10) channel.send(results.slice(i, i+10))
    }, 5000)
}

module.exports = {
    updateShop
}
