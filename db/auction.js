
const Sequelize = require('sequelize')
const {db} = require('./db')

const Auction = db.define('auction', {
    card_code: {
        type: Sequelize.TEXT,
        allowNull: false
    }
})

module.exports = Auction

