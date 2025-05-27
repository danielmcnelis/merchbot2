
import { Sequelize } from 'sequelize'
import { db } from './db.js'

export const Pairing = db.define('pairings', {
    status: {
        type: Sequelize.STRING,      
        defaultValue: 'active'
    },
    playerAName: {
        type: Sequelize.STRING
    },
    playerAId: {
        type: Sequelize.STRING
    },
    deckFileA: {
        type: Sequelize.TEXT
    },
    playerBName: {
        type: Sequelize.STRING
    },
    playerBId: {
        type: Sequelize.STRING
    },
    deckFileB: {
        type: Sequelize.TEXT
    }
})