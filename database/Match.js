
import { Op, Sequelize } from 'sequelize'
import { db } from './db'

export const Match = db.define('matches', {
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
    loserName: {
        type: Sequelize.STRING
    },
    loserId: {
        type: Sequelize.STRING
    },
    classicDelta: {
        type: Sequelize.FLOAT,  
        defaultValue: 10.00
    },
    winnerDelta: {
        type: Sequelize.FLOAT,  
        defaultValue: 10.00
    },
    loserDelta: {
        type: Sequelize.FLOAT,  
        defaultValue: 10.00
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
    challongeMatchRound: {
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
    },
    isInternal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    isSeasonal: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    }
})

Match.checkIfVanquished = async (formatId, winnerId, loserId, createdAt) => createdAt ? 
    await Match.count({ 
        where: { 
            formatId, winnerId, loserId,
            createdAt: {[Op.lt]: createdAt}
        }
    }) : await Match.count({ where: { formatId, winnerId, loserId }})
    