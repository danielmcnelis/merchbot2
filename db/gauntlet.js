
const Sequelize = require('sequelize')
const {db} = require('./db')

const Gauntlet = db.define('gauntlet', {
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    partner: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    }
})

module.exports = Gauntlet

