
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
    blackwingWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    cydraWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    destinyWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    dinosaurWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    dragonWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    fairyWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    fiendWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    fishWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    flipWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    frogWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    heroWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    insectWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    machineWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    monarchWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    paleozoicWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    plantWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    pyroWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    reptileWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    rockWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    shaddollWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    spellcasterWins: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    spiritWins: {
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

