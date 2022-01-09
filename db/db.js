
const Sequelize = require('sequelize')
const { pgPassword } = require('../secrets.json')

const db = new Sequelize(
  'merchbot',
  null,
  null,
  { 
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
)

const db2 = new Sequelize(
  'formatlibrary',
  null,
  null,
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
