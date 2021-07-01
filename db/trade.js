
const Sequelize = require('sequelize')
const { db } = require('./db')

const Trade = db.define('trade', {
    transaction_id: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    senderId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    sender_name: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    receiverId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    receiver_name: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    item: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1, 
        allowNull: false
    }
})

module.exports = Trade

