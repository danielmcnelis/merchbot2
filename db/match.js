
const Sequelize = require('sequelize')
const { db } = require('./db')

const Match = db.define('match', {
    game_mode: {
        type: Sequelize.STRING, 
        defaultValue: "ranked",       
        allowNull: false
    },
    winner: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    loser: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    delta: {
        type: Sequelize.FLOAT,        
        allowNull: false
    },
    chipsWinner: {
        type: Sequelize.INTEGER,        
        allowNull: false
    },
    chipsLoser: {
        type: Sequelize.INTEGER,        
        allowNull: false
    }
})

module.exports = Match

