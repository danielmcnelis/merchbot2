
import { Binder, ForgedInventory } from '../database/index.js'

export const updateBinder = async (playerId, printId) => {
    try {
        const binder = await Binder.findOne({ where: { playerId: playerId, forgedPrintId: printId }})
        const inv = await ForgedInventory.findOne({ where: { playerId: playerId, forgedPrintId: printId }})
         
        if (binder && inv && inv.quantity < 1) {
            return await binder.destroy()
        }
    } catch (err) {
        console.log(err)
    }
}