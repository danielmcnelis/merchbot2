
const Sequelize = require('sequelize')
const {db} = require('./db')

const Tournament = db.define('tournament', {
    id: {
        primaryKey: true,
        type: Sequelize.STRING,   
        allowNull: false,
        unique: true
    },
    name: {
        type: Sequelize.STRING,  
        defaultValue: 'New Tournament',  
        allowNull: false
    },
    url: {
        type: Sequelize.STRING,      
        allowNull: false,
        unique: true
    },
    tournament_type: {
        type: Sequelize.STRING,   
        defaultValue: 'double elimination',   
        allowNull: false
    },
    swiss_rounds: {
        type: Sequelize.INTEGER,   
        defaultValue: null
    },
    state: {
        type: Sequelize.STRING,   
        defaultValue: 'pending',   
        allowNull: false
    }
})

module.exports = Tournament