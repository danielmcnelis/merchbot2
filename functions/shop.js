
const { Card, Match, Player, Tournament, Print, Set, Wallet, Diary, Inventory, Arena, Trivia, Keeper, Gauntlet, Draft, Daily, Binder, Wishlist, Profile } = require('../db')
const merchbotId = '584215266586525696'
const { Op } = require('sequelize')
const { FOA, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, ROCK, sad, mad, beast, dragon, machine, spellcaster, warrior, zombie, starchips, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')

const updateShop = async (channel) => {
    channel.bulkDelete(100)
    
    // setTimeout(() => {
    //     console.log('bulk deleting')
    //     channel.bulkDelete(100)
    // }, 2000)
    
    setTimeout(async () => {
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
    
        const results = []
    
        for (let i = 0; i < shopInv.length; i++) {
            const row = shopInv[i]
            const market_price = row.print.market_price
            const selling_price = Math.ceil(market_price * 1.1)
            const buying_price = Math.ceil(market_price * 0.7)
            results.push(`${selling_price}${stardust}| ${buying_price}${stardust}-${eval(row.print.rarity)}${row.card_code} - ${row.print.card_name} - ${row.quantity}`) 
        }
    
        results.unshift(`${merchant} The Shop ${merchant}`)
    
        for (let i = 0; i < results.length; i += 10) channel.send(results.slice(i, i+10))
    }, 1000)
}

module.exports = {
    updateShop
}
