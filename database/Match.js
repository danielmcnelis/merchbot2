
import { Sequelize } from 'sequelize'
import { db } from './db.js'

export const Match = db.define('matches', {
    winnerName: {
        type: Sequelize.STRING
    },
    winnerId: {
        type: Sequelize.STRING
    },
    loserName: {
        type: Sequelize.STRING
    },
    loserId: {
        type: Sequelize.STRING
    },
    winnerDelta: {
        type: Sequelize.FLOAT
    },
    loserDelta: {
        type: Sequelize.FLOAT
    },
    isForgedMatch: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    winnerChips: {
        type: Sequelize.INTEGER
    },
    loserChips: {
        type: Sequelize.INTEGER
    },
    isTournament: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    tournamentId: {
        type: Sequelize.STRING,
    },
    challongeMatchId: {
        type: Sequelize.INTEGER
    },
    round: {
        type: Sequelize.INTEGER
    },
    isRatedPairing: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    pairingId: {
        type: Sequelize.INTEGER,
    }
})


Match.checkIfVanquished = async (formatId, winnerId, loserId, createdAt) => createdAt ? 
    await Match.count({ 
        where: { 
            formatId, winnerId, loserId,
            createdAt: {[Op.lt]: createdAt}
        }
    }) : await Match.count({ where: { formatId, winnerId, loserId }})
    