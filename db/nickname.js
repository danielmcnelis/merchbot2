
const Sequelize = require('sequelize')
const {db} = require('./db')

const Nickname = db.define('nickname', {
    alius: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true
    },
    card_name: {
        type: Sequelize.TEXT,
        allowNull: false
    }
})

module.exports = Nickname

