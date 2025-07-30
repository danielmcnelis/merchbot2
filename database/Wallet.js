
import { Sequelize } from 'sequelize'
import {db} from './db.js'

export const Wallet = db.define('wallets', {
    playerName: {
        type: Sequelize.STRING,  
        allowNull: false
    },
    playerId: {
        type: Sequelize.STRING,  
        allowNull: false
    },
    starchips: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    stardust: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    droplets: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    mushrooms: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    gems: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    beads: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    familiars: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    bolts: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    roses: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    firecrackers: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    moais: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    orbs: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    shields: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    },
    skulls: {
        type: Sequelize.INTEGER,  
        defaultValue: 0,           
        allowNull: false
    }
})
