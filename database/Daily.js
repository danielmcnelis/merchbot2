
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Daily = db.define('dailies', {
    playerId: {
        type: Sequelize.STRING,
    },
    playerName: {
        type: Sequelize.STRING,
    },
    dailyBonus: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    isProcessing: {
        type: Sequelize.DATE,
        defaultValue: false
    },
    lastDaily: {
        type: Sequelize.DATE,
        allowNull: true
    },
    cobbleProgress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    alchemy1: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    alchemy2: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    alchemy3: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    alchemy4: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    lastAlchemy: {
        type: Sequelize.DATE,
        allowNull: true
    },
    lastWager: {
        type: Sequelize.DATE,
        allowNull: true
    }
})