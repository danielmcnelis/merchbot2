
const Sequelize = require('sequelize')
const {db} = require('./db')

const Wallet = db.define('wallet', {
    starchips: {
        type: Sequelize.INTEGER,  
        defaultValue: 100,           
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
    voucher_A: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    voucher_B: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    voucher_C: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    voucher_D: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    voucher_E: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    voucher_F: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    }
})

module.exports = Wallet


