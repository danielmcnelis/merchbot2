import { Sequelize } from 'sequelize'
import { db } from './db.js'

export const Stats = db.define('stats', {
    playerId: {
        type: Sequelize.STRING
    },
    playerName: {
        type: Sequelize.STRING
    },
    formatId: {
        type: Sequelize.INTEGER
    },
    formatName: {
        type: Sequelize.STRING
    },
    elo: {
        type: Sequelize.FLOAT,
        defaultValue: 500.0
    },
    bestElo: {
        type: Sequelize.FLOAT,
        defaultValue: 500.0
    },
    backupElo: {
        type: Sequelize.FLOAT,
        defaultValue: null
    },
    wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    games: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    seasonalElo: {
        type: Sequelize.FLOAT,
        defaultValue: 500.0
    },
    bestSeasonalElo: {
        type: Sequelize.FLOAT,
        defaultValue: 500.0
    },
    backupSeasonalElo: {
        type: Sequelize.FLOAT,
        defaultValue: null
    },
    seasonalWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    seasonalLosses: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    seasonalGames: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    classicElo: {
        type: Sequelize.FLOAT,
        defaultValue: 500.0
    },
    backupClassicElo: {
        type: Sequelize.FLOAT,
        defaultValue: null
    },
    currentStreak: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    bestStreak: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    vanquished: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    isInternal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    isActive: {
        type: Sequelize.BOOLEAN,  
        defaultValue: true
    }
})