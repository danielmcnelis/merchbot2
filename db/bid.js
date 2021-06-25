
const Sequelize = require('sequelize')
const {db} = require('./db')

const Bid = db.define('bid', {
    card_code: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    offer: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
})

module.exports = Bid

