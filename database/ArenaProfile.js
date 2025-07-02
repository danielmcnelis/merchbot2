
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const ArenaProfile = db.define('arenaProfiles', {
    playerName: {
        type: Sequelize.STRING
    },
    playerId: {
        type: Sequelize.STRING
    },
    aquaWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    beastWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    dragonWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    machineWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    plantWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    pyrotWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    rockWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    spellcasterWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    warriorWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    zombieWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    }
})

