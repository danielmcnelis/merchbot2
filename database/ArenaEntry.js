
import { Sequelize } from 'sequelize'
import { db } from './db'

export const ArenaEntry = db.define('arenaEntries', {
    playerName: {
        type: Sequelize.STRING
    },
    playerId: {
        type: Sequelize.STRING
    },
    isConfirmed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: Sequelize.STRING,   
        defaultValue: 'pending'
    },
    score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    tribe: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    contestant: {
        type: Sequelize.STRING,
        defaultValue: null
    }
})

