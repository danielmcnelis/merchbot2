
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Binder = db.define('binders', {
    cardName: {
        type: Sequelize.STRING
    },
    cardCode: {
        type: Sequelize.STRING
    },
    quantity: {
        type: Sequelize.INTEGER
    },
    forgedPrintId: {
        type: Sequelize.INTEGER
    },
    playerName: {
        type: Sequelize.STRING
    },
    playerId: {
        type: Sequelize.STRING
    }
})
