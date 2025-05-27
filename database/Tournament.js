
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Tournament = db.define('tournaments', {
    id: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    name: {
      type: Sequelize.STRING
    },
    abbreviation: {
      type: Sequelize.STRING
    },
    url: {
      type: Sequelize.STRING
    },
    formatName: {
      type: Sequelize.STRING
    },
    formatId: {
      type: Sequelize.INTEGER
    },
    isPremiumTournament: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    isTeamTournament: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    isLive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    isRated: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    type: {
      type: Sequelize.STRING
    },
    state: {
      type: Sequelize.STRING
    },
    deadline: {
        type: Sequelize.DATE
    },
    communityName: {
      type: Sequelize.STRING
    },
    logo: {
      type: Sequelize.STRING
    },
    emoji: {
      type: Sequelize.STRING
    },
    channelId: {
      type: Sequelize.STRING
    },
    serverId: {
      type: Sequelize.STRING
    },
    requiredRoleId: {
      type: Sequelize.STRING
    },
    alternateRoleId: {
      type: Sequelize.STRING
    },
    rounds: {
      type: Sequelize.INTEGER
    },
    topCutSize: {
      type: Sequelize.INTEGER
    },
    isTopCutTournament: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    associatedTournamentId: {
      type: Sequelize.STRING
    },
    pointsPerMatchWin: {
      type: Sequelize.STRING
    },
    pointsPerMatchTie: {
      type: Sequelize.STRING
    },
    pointsPerBye: {
      type: Sequelize.STRING
    },
    tieBreaker1: {
      type: Sequelize.STRING
    },
    tieBreaker2: {
      type: Sequelize.STRING
    },
    tieBreaker3: {
      type: Sequelize.STRING
    }
  })
  
  Tournament.findById = async (id) => await Tournament.findOne({ where: { id }})
  
  Tournament.findRecent = async (format, serverId) => await Tournament.findAll({ 
      where: {
          [Op.or]: {
              formatId: format?.id || {[Op.not]: null},
              name: {[Op.substring]: 'Multi-Format Spectacular'}
          },
          isTopCutTournament: false,
          serverId
      },
      limit: 5,
      order: [['createdAt', 'DESC']]
  })
  
  Tournament.findActive = async (format, serverId, orderDirection = 'ASC') => await Tournament.findAll({ 
      where: {
          state: { [Op.notIn]: ['complete', 'topcut', 'paused']},
          [Op.or]: {
              formatId: format?.id || {[Op.not]: null},
              name: {[Op.substring]: 'Multi-Format Spectacular'}
          },
          serverId
      },
      order: [['createdAt', orderDirection]]
  })
  
  Tournament.findByState = async (state, format, serverId, orderDirection = 'ASC') => await Tournament.findAll({ 
      where: {
          state,
          serverId,
          [Op.or]: {
              formatId: format?.id || {[Op.not]: null},
              name: {[Op.substring]: 'Multi-Format Spectacular'}
          }
      },
      order: [['createdAt', orderDirection]]
  })
  
  Tournament.findByQuery = async (query, serverId) => await Tournament.findOne({ 
      where: { 
          [Op.or]: {
              name: { [Op.iLike]: query },
              abbreviation: { [Op.iLike]: query },
              url: { [Op.iLike]: query },
          },
          serverId: serverId 
      }
  })