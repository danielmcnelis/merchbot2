
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Artwork = db.define('artworks', {
  cardName: {
    type: Sequelize.STRING
  },
  artworkId: {
    type: Sequelize.STRING,
    unique: true
  },
  cardId: {
    type: Sequelize.INTEGER
  },
  isOriginal: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
})
