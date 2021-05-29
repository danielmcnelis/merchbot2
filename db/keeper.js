
const Sequelize = require('sequelize')
const {db} = require('./db')

const Keeper = db.define('keeper', {
    wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    }
})

module.exports = Keeper