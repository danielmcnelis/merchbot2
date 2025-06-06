
import { Binder, Wishlist } from '../database/index.js'

export const updateBinder = async (playerId, printId, quantity = 1) => {
    try {
        const binder = await Binder.findOne({ where: { playerId: playerId, forgedPrintId: printId }})
        const newQuantity = binder.quantity - quantity
        
        if (newQuantity <= 0) {
            return await binder.destroy()
        } else {
            return await binder.update({ quantity: newQuantity })
        }
    } catch (err) {
        console.log(err)
    }
}

export const updateWishlist = async (playerId, printId, quantity = 1) => {
    try {
        const wishlist = await Wishlist.findOne({ where: { playerId: playerId, forgedPrintId: printId }})
        const newQuantity = wishlist.quantity - quantity
        
        if (newQuantity <= 0) {
            return await wishlist.destroy()
        } else {
            return await wishlist.update({ quantity: newQuantity })
        }
    } catch (err) {
        console.log(err)
    }
}