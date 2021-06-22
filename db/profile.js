
const Sequelize = require('sequelize')
const {db} = require('./db')

const Profile = db.define('profile', {
    start_date: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    starter: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    card: {
        type: Sequelize.STRING,
        allowNull: true
    },
    color: {
        type: Sequelize.STRING,        
        allowNull: true
    },
    quote: {
        type: Sequelize.TEXT,    
        allowNull: true
    },
    author: {
        type: Sequelize.STRING,    
        allowNull: true
    },
    referral: {
        type: Sequelize.BOOLEAN,  
        defaultValue: false,
        allowNull: false
    },
    beast_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    dinosaur_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    fish_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    plant_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    reptile_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    rock_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,        
        allowNull: false
    },
    trivia_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,  
        allowNull: false
    }
})

module.exports = Profile

