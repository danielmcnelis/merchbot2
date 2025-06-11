
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Info = db.define('infos', {
    element: {
        type: Sequelize.STRING,  
        allowNull: false
    },
    status: {
        type: Sequelize.STRING,
        allowNull: true
    },
    round: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
})
