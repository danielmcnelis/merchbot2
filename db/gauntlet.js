
const Sequelize = require('sequelize')
const {db} = require('./db')

const Gauntlet = db.define('gauntlet', {
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

module.exports = Gauntlet