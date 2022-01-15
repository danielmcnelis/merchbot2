const { Binder, Inventory, Player } = require('../db')
const { Op } = require('sequelize')

const updateBinder = async (player) => {
    if (!player) return
    const binder = await Binder.findOne({ where: { playerId: player.id }})
    if (!binder) return

    for (let i = 0; i < 18; i++) {
        const card_code = binder[`slot_${i + 1}`]
        if (!card_code) continue
        const count = await Inventory.count({ 
            where: { 
                card_code: card_code,
                playerId: player.id,
				quantity: { [Op.gt]: 0 }
            }
        })
        
        if (!count) {
            binder[`slot_${i + 1}`] = null
            await binder.save()
        } 
    }
}

module.exports = {
    updateBinder
}
