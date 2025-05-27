
import { Op, Sequelize } from 'sequelize'
import { db } from './db.js'
// import { Card } from './Card'
// import { Status } from './Status'
// import { arrayToObject, capitalize } from '@fl/utils'

export const Deck = db.define('decks', {
  name: {
    type: Sequelize.STRING
  },
  deckTypeName: {
    type: Sequelize.STRING
  },
  category: {
    type: Sequelize.STRING
  },
  builderName: {
    type: Sequelize.STRING
  },
  builderId: {
    type: Sequelize.STRING
  },
  teamId: {
    type: Sequelize.INTEGER
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  origin: {
    type: Sequelize.STRING
  },
  ydk: {
    type: Sequelize.TEXT
  },
  eventAbbreviation: {
    type: Sequelize.STRING
  },
  publishDate: {
    type: Sequelize.DATE
  },
  eventId: {
    type: Sequelize.INTEGER
  },
  communityName: {
    type: Sequelize.STRING
  },
  placement: {
    type: Sequelize.INTEGER
  },
  display: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  rating: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  downloads: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  views: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  suggestedDeckTypeName: {
      type: Sequelize.STRING
  },
  shareLink: {
    type: Sequelize.STRING
  },
  linkExpiresAt: {
    type: Sequelize.DATE
  },
  url: {
    type: Sequelize.STRING
  },
  skillCardId: {
    type: Sequelize.INTEGER
  }
})

Deck.findById = async (id) => await Deck.findOne({ where: { id }})

// Deck.verifyLegality = async (ydk, formatName, formatDate, formatBanlist, formatCategory = 'tcg') => { 
//     const legalType = 'is' + capitalize(formatCategory?.toLowerCase()) + 'Legal'
//     const dateType = formatCategory?.toLowerCase() + 'Date'
//     const cardIds = formatName === 'Advanced' ? [...await Card.findAll({ where: { [legalType]: true }})].map(c => c.konamiCode) : [...await Card.findAll({ where: { [legalType]: true, [dateType]: { [Op.lte]: formatDate } }})].map(c => c.konamiCode)
//     const forbiddenIds = [...await Status.findAll({ where: { banlist: formatBanlist, category: formatCategory, restriction: 'forbidden' }, include: Card })].map(s => s.card.konamiCode)
//     const limitedIds = [...await Status.findAll({ where: { banlist: formatBanlist, category: formatCategory, restriction: 'limited' }, include: Card })].map(s => s.card.konamiCode)
//     const semiIds = [...await Status.findAll({ where: { banlist: formatBanlist, category: formatCategory, restriction: 'semi-limited' }, include: Card })].map(s => s.card.konamiCode)
    
//     const limited1Ids = [...await Status.findAll({ where: { banlist: formatBanlist, category: formatCategory, restriction: 'limited-1' }, include: Card })].map(s => s.card.konamiCode)
//     const limited2Ids = [...await Status.findAll({ where: { banlist: formatBanlist, category: formatCategory, restriction: 'limited-2' }, include: Card })].map(s => s.card.konamiCode)
//     const limited3Ids = [...await Status.findAll({ where: { banlist: formatBanlist, category: formatCategory, restriction: 'limited-3' }, include: Card })].map(s => s.card.konamiCode)

//     let limited1Count = 0
//     let limited2Count = 0
//     let limited3Count = 0

//     const main = ydk.split('#main')[1].split('#extra')[0].split(/[\s]+/).filter((e) => e.length)
//     const extra = ydk.split('#extra')[1].split('!side')[0].split(/[\s]+/).filter((e) => e.length)
//     const side = ydk.split('!side')[1].split(/[\s]+/).filter((e) => e.length)
//     const deckArr = [...main, ...side, ...extra]
//     const deck = arrayToObject(deckArr)
//     const keys = Object.keys(deck)

//     for (let i = 0; i < keys.length; i++) {
//         let konamiCode = keys[i]
//         while (konamiCode.length < 8) konamiCode = '0' + konamiCode 

//         if (!cardIds.includes(konamiCode)) {
//             return false
//         } else if (forbiddenIds.includes(konamiCode)) {
//             return false
//         } else if (limitedIds.includes(konamiCode) && deck[konamiCode] > 1) {
//             return false
//         } else if (semiIds.includes(konamiCode) && deck[konamiCode] > 2) {
//             return false
//         } else if (limited1Ids.includes(konamiCode)) {
//             limited1Count += deck[konamiCode]
//         } else if (limited2Ids.includes(konamiCode)) {
//             limited2Count += deck[konamiCode]
//         } else if (limited3Ids.includes(konamiCode)) {
//             limited3Count += deck[konamiCode]
//         }

//         if (limited1Count > 1) return false
//         if (limited2Count > 2) return false
//         if (limited3Count > 3) return false
//     }
    
//     return true
// }