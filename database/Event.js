import { Op, Sequelize } from 'sequelize'
import { db } from './db.js'

export const Event = db.define('events', {
  name: {
    type: Sequelize.STRING
  },
  abbreviation: {
    type: Sequelize.STRING
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  referenceUrl: {
    type: Sequelize.STRING
  },
  display: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  primaryTournamentId: {
    type: Sequelize.STRING
  },
  topCutTournamentId: {
    type: Sequelize.STRING
  },
  winnerName: {
    type: Sequelize.STRING
  },
  winnerId: {
    type: Sequelize.STRING
  },
  winningDeckTypeName: {
    type: Sequelize.INTEGER
  },
  winningDeckId: {
    type: Sequelize.INTEGER
  },
  winningTeamName: {
    type: Sequelize.STRING
  },
  winningTeamId: {
    type: Sequelize.INTEGER
  },
  size: {
    type: Sequelize.INTEGER
  },
  type: {
    type: Sequelize.STRING
  },
  isTeamEvent: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  communityName: {
    type: Sequelize.STRING
  },
  serverId: {
    type: Sequelize.STRING
  },
  seriesId: {
    type: Sequelize.INTEGER
  },
  startedAt: {
    type: Sequelize.DATE
  },
  endDate: {
    type: Sequelize.DATE
  },
  isRepresentative: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
})
