
const Sequelize = require('sequelize')
const { db } = require('./db')

const Trade = db.define('trade', {
    sender: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    receiver: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    transaction_id: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    card: {
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

