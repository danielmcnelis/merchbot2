
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Auction = db.define('auctions', {
    cardCode: {
        type: Sequelize.STRING,
        allowNull: false
    },
    cardName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false
    },
    forgedPrintId: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false
    }
})

