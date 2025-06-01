
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Wishlist = db.define('wishlists', {
    cardName: {
        type: Sequelize.STRING
    },
    cardCode: {
        type: Sequelize.STRING
    },
    quantity: {
        type: Sequelize.INTEGER
    },
    playerName: {
        type: Sequelize.STRING
    },
    playerId: {
        type: Sequelize.STRING
    }
})