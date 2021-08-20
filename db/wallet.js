
const Sequelize = require('sequelize')
const {db} = require('./db')

const Wallet = db.define('wallet', {
    starchips: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    stardust: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    tickets: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    credits: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    cactus: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    egg: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    hook: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    moai: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    mushroom: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    rose: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    gem: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    orb: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    swords: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    }
})

module.exports = Wallet


