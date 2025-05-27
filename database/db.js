
import { Sequelize } from 'sequelize'
import secrets from '../secrets.json' with { type: "json" }
const {pgPassword} = secrets

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