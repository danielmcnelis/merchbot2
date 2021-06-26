
const Sequelize = require('sequelize')
const {db} = require('./db')

const Bid = db.define('bid', {
    card_code: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    amount: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
})

module.exports = Bid

