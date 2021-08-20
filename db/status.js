
const Sequelize = require('sequelize')
const { db } = require('./db')

const Status = db.define('status', {
    name: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    konami_code: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    current: {
        type: Sequelize.STRING,        
        allowNull: true
    },
    pauper: {
        type: Sequelize.STRING,        
        allowNull: true
    }
})

module.exports = Status

