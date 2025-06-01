
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Proposal = db.define('proposals', {
    senderName: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    senderId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    recipientName: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    recipientId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    forgedPrintAId: {
        type: Sequelize.INTEGER,        
        allowNull: false
    },
    quantityA: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    forgedPrintBId: {
        type: Sequelize.INTEGER
    },
    quantityB: {
        type: Sequelize.INTEGER
    },
    forgedPrintCId: {
        type: Sequelize.INTEGER
    },
    quantityC: {
        type: Sequelize.INTEGER
    },
    forgedPrintDId: {
        type: Sequelize.INTEGER
    },
    quantityD: {
        type: Sequelize.INTEGER
    },
    forgedPrintEId: {
        type: Sequelize.INTEGER
    },
    quantityE: {
        type: Sequelize.INTEGER
    },
    stardustQuantity: {
        type: Sequelize.INTEGER
    },
    totalValue: {
        type: Sequelize.FLOAT
    }
})

