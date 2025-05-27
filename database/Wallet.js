
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Wallet = db.define('wallets', {
    playerName: {
        type: Sequelize.STRING,  
        allowNull: false
    },
    playerId: {
        type: Sequelize.STRING,  
        allowNull: false
    },
    starchips: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    stardust: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    }
})
