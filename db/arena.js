
const Sequelize = require('sequelize')
const {db} = require('./db')

const Arena = db.define('arena', {
    beast_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    dragon_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    machine_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    spellcaster_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    warrior_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    zombie_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    }
})

module.exports = Arena
