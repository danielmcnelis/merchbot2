
const Sequelize = require('sequelize')
const {db} = require('./db')

const Draft = db.define('draft', {
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

module.exports = Draft