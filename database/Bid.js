
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Bid = db.define('bids', {
    cardCode: {
        type: Sequelize.STRING,
        allowNull: false
    },
    cardName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    forgedPrintId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    auctionId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    amount: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    playerName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    playerId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    wasProcessed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
})

