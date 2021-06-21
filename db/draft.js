
const Sequelize = require('sequelize')
const {db} = require('./db')

const Draft = db.define('draft', {
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    }
})

module.exports = Draft

