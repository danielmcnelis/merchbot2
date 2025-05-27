
import { Sequelize } from 'sequelize'
import { db } from './db.js'

export const DeckType = db.define('deckTypes', {
  name: {
    type: Sequelize.STRING
  },
  cleanName: {
    type: Sequelize.STRING
  },
  category: {
    type: Sequelize.STRING
  }
})
