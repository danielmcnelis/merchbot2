import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Replay = db.define('replays', {
    url: {
        type: Sequelize.STRING
    },
    formatName: {
        type: Sequelize.STRING
    },
    formatId: {
      type: Sequelize.INTEGER
    },
    winnerName: {
        type: Sequelize.STRING
    },
    winnerId: {
        type: Sequelize.STRING
    },
    winningDeckId: {
        type: Sequelize.INTEGER
    },
    winningDeckTypeName: {
        type: Sequelize.STRING
    },
    winningDeckTypeId: {
        type: Sequelize.INTEGER
    },
    loserName: {
        type: Sequelize.STRING
    },
    loserId: {
        type: Sequelize.STRING
    },
    losingDeckId: {
        type: Sequelize.INTEGER
    },
    losingDeckTypeName: {
        type: Sequelize.STRING
    },
    losingDeckTypeId: {
        type: Sequelize.INTEGER
    },
    matchId: {
        type: Sequelize.INTEGER
    },
    tournamentId: {
        type: Sequelize.STRING,
    },
    eventAbbreviation: {
        type: Sequelize.STRING,
    },
    eventId: {
        type: Sequelize.INTEGER,
    },
    roundName: {
        type: Sequelize.STRING
    },
    roundInt: {
        type: Sequelize.INTEGER
    },
    roundAbs: {
        type: Sequelize.INTEGER
    },
    display: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    publishDate: {
        type: Sequelize.DATE
    }
})
