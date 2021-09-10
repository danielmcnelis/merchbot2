
const Sequelize = require('sequelize')
const {db} = require('./db')

const Player = db.define('player', {
    id: {
        primaryKey: true,
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    tag: {
        type: Sequelize.STRING,        
        allowNull: true,
        unique: true
    },
    duelingBook: {
        type: Sequelize.STRING,
        allowNull: true
    },
    muted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    stats: {
        type: Sequelize.FLOAT,   
        defaultValue: 500.00,             
        allowNull: false
    },
    backup: {
        type: Sequelize.FLOAT,
        defaultValue: 0.00,        
        allowNull: true
    },
    wins: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,     
        allowNull: false
    },
    losses: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    vanquished_foes: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    best_stats: {
        type: Sequelize.FLOAT,   
        defaultValue: 500.00,             
        allowNull: false
    },
    current_streak: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,     
        allowNull: false
    },
    longest_streak: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,     
        allowNull: false
    },
    arena_stats: {
        type: Sequelize.FLOAT,   
        defaultValue: 500.00,             
        allowNull: false
    },
    arena_backup: {
        type: Sequelize.FLOAT,
        defaultValue: 0.00,        
        allowNull: true
    },
    arena_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    arena_losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    keeper_stats: {
        type: Sequelize.FLOAT,   
        defaultValue: 500.00,             
        allowNull: false
    },
    keeper_backup: {
        type: Sequelize.FLOAT,
        defaultValue: 0.00,        
        allowNull: true
    },
    keeper_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    keeper_losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    draft_stats: {
        type: Sequelize.FLOAT,   
        defaultValue: 500.00,             
        allowNull: false
    },
    draft_backup: {
        type: Sequelize.FLOAT,
        defaultValue: 0.00,        
        allowNull: true
    },
    draft_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    draft_losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    gauntlet_stats: {
        type: Sequelize.FLOAT,   
        defaultValue: 500.00,             
        allowNull: false
    },
    gauntlet_backup: {
        type: Sequelize.FLOAT,
        defaultValue: 0.00,        
        allowNull: true
    },
    gauntlet_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    gauntlet_losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    pauper_wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    pauper_losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    pauper_stats: {
        type: Sequelize.FLOAT,   
        defaultValue: 500.00,             
        allowNull: false
    },
    pauper_backup: {
        type: Sequelize.FLOAT,
        defaultValue: 0.00,        
        allowNull: true
    },
    last_reset : {
        type: Sequelize.DATE,
        allowNull: true
    }
})

module.exports = Player

