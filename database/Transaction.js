
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Transaction = db.define('transactions', {
    playerAId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    playerAName: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    playerBId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    playerBName: {
        type: Sequelize.STRING,        
        allowNull: false
    }
})

