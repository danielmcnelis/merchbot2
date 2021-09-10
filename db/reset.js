
const Sequelize = require('sequelize')
const {db} = require('./db')

const Reset = db.define('reset', {
    date: {
        type: Sequelize.DATE,
        allowNull: true
    }
})

module.exports = Reset
