
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Status = db.define('statuses', {
  cardName: {
    type: Sequelize.STRING
  },
  cardId: {
    type: Sequelize.INTEGER
  },
  banlist: {
    type: Sequelize.STRING
  },
  date: {
    type: Sequelize.STRING
  },
  restriction: {
    type: Sequelize.STRING
  },
  previous: {
    type: Sequelize.STRING
  },
  category: {
    type: Sequelize.STRING
  }
})
