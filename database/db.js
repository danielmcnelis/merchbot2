
import { Sequelize } from 'sequelize'
import pgPassword from '../secrets.json' with { type: "json" }

export const db = new Sequelize(
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