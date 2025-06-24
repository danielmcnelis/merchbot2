
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const ForgedInventory = db.define('forgedInventories', {
    playerName: {
        type: Sequelize.STRING,
    },
    playerId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    cardCode: {
        type: Sequelize.STRING,
    },
    cardName: {
        type: Sequelize.STRING,
    },
    cardId: {
        type: Sequelize.INTEGER,
    },
    quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    forgedPrintId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
})
