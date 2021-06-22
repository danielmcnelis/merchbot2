
const Sequelize = require('sequelize')
const {db} = require('./db')

const Game = db.define('game', {
    name: {
        type: Sequelize.STRING,  
        allowNull: false
    },
    status: {
        type: Sequelize.STRING,   
        defaultValue: 'pending',   
        allowNull: false
    },
    round: {
        type: Sequelize.INTEGER,    
        defaultValue: 1,  
        defaultValue: null
    }
})

module.exports = Game