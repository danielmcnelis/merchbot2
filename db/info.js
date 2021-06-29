
const Sequelize = require('sequelize')
const {db} = require('./db')

const Info = db.define('info', {
    element: {
        type: Sequelize.STRING,  
        allowNull: false
    },
    status: {
        type: Sequelize.STRING,
        allowNull: true
    },
    count: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    round: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
})

module.exports = Info
