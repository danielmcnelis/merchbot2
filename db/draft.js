
const Sequelize = require('sequelize')
const {db} = require('./db')

const Draft = db.define('draft', {
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    is_playing: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    contestant: {
        type: Sequelize.TEXT,
        defaultValue: null
    }
})

module.exports = Draft

