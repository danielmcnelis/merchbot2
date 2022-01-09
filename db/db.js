
const Sequelize = require('sequelize')
const { pgPassword } = require('../secrets.json')
const { pgPassword } = require('../secrets.json')

const db = new Sequelize(
  'merchbot',
  'ubuntu',
  pgPassword,
  { 
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
)

const db2 = new Sequelize(
  'formatlibrary',
  'ubuntu',
  pgPassword,
  { 
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
)

module.exports = {
  db,
  db2
}
