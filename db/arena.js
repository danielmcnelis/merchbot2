
const Sequelize = require('sequelize')
const {db} = require('./db')

const Arena = db.define('arena', {
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    tribe: {
        type: Sequelize.TEXT,
        defaultValue: null
    },
    contestant: {
        type: Sequelize.TEXT,
        defaultValue: null
    }
})

module.exports = Arena

