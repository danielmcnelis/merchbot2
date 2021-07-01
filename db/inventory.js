
const Sequelize = require('sequelize')
const {db} = require('./db')

const Inventory = db.define('inventory', {
    card_code: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    draft: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
})

module.exports = Inventory

