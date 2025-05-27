
import { Sequelize } from 'sequelize'
import { db } from './db.js'

export const Pool = db.define('pools', {
    playerName: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING,      
        defaultValue: 'pending'
    },
    playerId: {
        type: Sequelize.STRING
    },
    deckFile: {
        type: Sequelize.TEXT
    }
})