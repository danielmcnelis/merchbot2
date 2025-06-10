
import { Sequelize } from 'sequelize'
import { db } from './db'

export const ArenaEntry = db.define('arenaEntries', {
    playerName: {
        type: Sequelize.STRING
    },
    playerId: {
        type: Sequelize.STRING
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

