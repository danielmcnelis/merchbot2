
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Trade = db.define('trades', {
    transactionId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    itemName: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    itemType: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1, 
        allowNull: false
    },
    senderId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    senderName: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    receiverId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    receiverName: {
        type: Sequelize.STRING,        
        allowNull: false
    }
})

