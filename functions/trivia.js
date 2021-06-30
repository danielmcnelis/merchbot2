
const { Diary, Player, Profile, Trivia } = require('../db')
const { Op } = require('sequelize')
const { yescom, nocom } = require('../static/commands.json')
const { ygocard, pack, open, closed, DOC, merchant, FiC, approve, lmfao, god, legend, master, diamond, platinum, gold, silver, bronze, ROCK, sad, mad, beast, dragon, machine, spellcaster, warrior, zombie, fish, rock, dinosaur, plant, reptile, starchips, stardust, com, rar, sup, ult, scr, checkmark, emptybox } = require('../static/emojis.json')
//const { triviaRole } = require('../static/roles.json')
const { triviaChannelId } = require('../static/channels.json')

//RUN TRIVIA
const runTrivia = async () => {
    return
}

module.exports = {
    runTrivia
}
