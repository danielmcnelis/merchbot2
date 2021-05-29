
const fs = require("fs");
const Discord = require('discord.js');

let names = require('./names.json');
let tickets = require('./tickets.json');
let credits = require('./credits.json');
let weekly = require('./weekly.json');
let monthly = require('./monthly.json');

let starchips = require('./starchips.json'); 

var warriorEmoji = `<:warrior:586705096478425107>`;
var spellcasterEmoji = `<:spellcaster:586705080544395285>`;
var beastEmoji = `<:beast:588754247634518057>`;
var machineEmoji = `<:machine:588754247898759181>`;
var dragonEmoji = `<:dragoon:590279540702445588>`;
var zombieEmoji = `<:zombino:595332382681333767>`;
var fairyEmoji = `<:fairy:617050036995489800>`;
var plantEmoji = `<:plant:616022895491153997>`;
var insectEmoji = `<:insect:617050037129576582>`;
var rockEmoji = `<:ROCK:617050037188296705>`;
var waterEmoji = `<:serpent:636790269853040650>`;
var windEmoji = `<:wingedbeast:617050405783732234>`;
var psychicEmoji = `<:psychic:653618473074819094>`;
var fiendEmoji = `<:fiend:653618486643261477>`;
var dinoEmoji = `<:dino:677716481848377384>`;
var phishEmoji = `<:phish:677716465495048262>`;

var supEmoji = `<:sup:585905756147286017>`;
var ultEmoji = `<:ult:585911818468327424>`;
var scrEmoji = `<:scr:585911884813697057>`;

var starchipEmoji = `<:starchip:584841214730436618>`;
var ticketEmoji = `<:tix:677758158772633621>`;
var creditEmoji = `<:credits:677668442316341269>`;



//FUNCTIONS

const methods = {


//WEEKLY BONUS FUNCTION
    weeklyBonus(guild) {
        let rawdata = fs.readFileSync('weekly.json')
        let rawobj = JSON.parse(rawdata)
        let arr1 = Object.keys(rawobj)
        let arr2 = []
        let arr3 = []
        let arr4 = []
        let x = arr1.length;
    
        for (let i = 0; i < x; i++) { 
            if(weekly[arr1[i]] === 0 && tickets[arr1[i]] < 10) {
                arr2.push(arr1[i])
            } else if (weekly[arr1[i]] >= 3) {
                arr3.push(arr1[i])
                arr4.push(arr1[i])
            } else if (weekly[arr1[i]] < 3 && weekly[arr1[i]] >= 1) {
                arr4.push(arr1[i])
            }
        }

        let y = arr2.length;
        let z = arr3.length;
        let g = arr4.length;

        for (let i = 0; i < y; i++) { 
            methods.passingFunction3(guild, arr2[i], (i+1));
        }

        for (let i = 0; i < z; i++) {
            methods.passingFunction4(guild, arr3[i], (i+y+1));
        }

        for (let i = 0; i < g; i++) {
            methods.passingFunction6(guild, arr4[i], (i+y+z+1));
        }



    },




//MONTHLY BONUS FUNCTION
    monthlyBonus(guild) {

	console.log('RUNNING MONTHLY BONUS FUNCTION')

        let rawdata = fs.readFileSync('monthly.json')
        let rawobj = JSON.parse(rawdata)
        let arr1 = Object.keys(rawobj)
        let arr2 = []
        let arr3 = []
        let x = arr1.length;
    
        for (let i = 0; i < x; i++) { 
            if(monthly[arr1[i]] === 0 && credits[arr1[i]] < 1) {
                arr2.push(arr1[i])
            } else if(monthly[arr1[i]] > 0) {
		arr3.push(arr1[i])
	    }
        }

	console.log('RUNNING MONTHLY BONUS FUNCTION')

        let y = arr2.length;
        let z = arr3.length;

        for (let i = 0; i < y; i++) { 
            methods.passingFunction5(guild, arr2[i], (i+1));
        }

        for (let i = 0; i < z; i++) { 
            methods.passingFunction7(guild, arr3[i], (i+y+1));
        }
    },

    
//WEEKLY TIMER FUNCTION
    weeklyTimer(guild, ms) {
        setTimeout(function(){ 
            methods.weeklyBonus(guild)
            methods.weeklyTimer(guild, 604800000)}, ms);
    },


//MONTHLY TIMER FUNCTION
    monthlyTimer (guild, ms) {
        setTimeout(function(){ 
            methods.monthlyBonus(guild)
            let nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(1);
            nextMonth.setHours(0);
            nextMonth.setMinutes(0);
            nextMonth.setSeconds(0);
            nextMonth.setMilliseconds(0);
            let currentTime = new Date();
            let msRemainingMonthly = nextMonth - currentTime;
            methods.monthlyTimer(guild, msRemainingMonthly)}, ms);
    },





//AWARD TICKETS FUNCTION
    awardTickets(guild, player, num) {
        let quant = num
        if(tickets[player] === 9) {
            quant = 1
        }

        if (!quant) {
            quant = 0
        }

        tickets[player] = tickets[player]+parseInt(quant);
        fs.writeFile("./tickets.json", JSON.stringify(tickets), (err) => {	
            if (err) console.log(err) });

	console.log(`${names[player]} was awarded ${quant} tickets.`)
    
        let person = guild.members.find('id', player);

        if(!person) { 
            return 
        } else {
            person.send(`Hey, ${names[player]}, since you didn't play last week, you've been awarded ${quant} ${ticketEmoji} (max. 10) that can be exchanged for cards:
1 ${ticketEmoji} => 1${supEmoji} Super Rare
2 ${ticketEmoji} => 1${ultEmoji} Ultra Rare
3 ${ticketEmoji} => 1${scrEmoji} Secret Rare

Please note: Only Core and Mini Set cards currently in print are eligible for this promotion. To exchange tickets, use the command **!ticket** followed by the name of the card you wish to redeem. We hope to see you soon!
--- The Forged in Chaos Team`)
        }
    },




//AWARD CREDIT FUNCTION
    awardCredit (guild, player) {

        credits[player] = 1;
        fs.writeFile("./credits.json", JSON.stringify(credits), (err) => {	
            if (err) console.log(err) });

	console.log(`${names[player]} was awarded 1 credit.`)
    
        let person = guild.members.find('id', player);

        if(!person) { 
            return 
        } else {
            person.send(`Hey, ${names[player]}, since you didn't play last month, you've been awarded 1 ${creditEmoji} (max. 1) that can be exchanged for a Starter Deck:
Dinosaur's Terror ${dinoEmoji}
Fish's Domain ${phishEmoji}
Psychic's Vision ${psychicEmoji}
Fiend's Scorn ${fiendEmoji}
Beast's Fury ${beastEmoji}
Zombie's Curse ${zombieEmoji}

Please note: Only Starter Decks currently in print are eligible for this promotion. To exchange credits, use the command **!credit** followed by the name of the Starter Deck you wish to redeem. We hope to see you soon!
--- The Forged in Chaos Team`)
        }
    },


//ERASE WEEKLY FUNCTION
    eraseWeekly (guild, player) {

        weekly[player] = 0;
        fs.writeFile("./weekly.json", JSON.stringify(weekly), (err) => {	
            if (err) console.log(err) });

	console.log('erasing weekly match count')

    },


//ERASE MONTHLY FUNCTION
    eraseMonthly (guild, player) {

        monthly[player] = 0;
        fs.writeFile("./monthly.json", JSON.stringify(monthly), (err) => {	
            if (err) console.log(err) });

	let person = guild.members.find('id', player);

	console.log('erasing monthly match count')

        if(!person) { 
            return 
        } else {
            person.send(`Hey, ${names[player]}, please ignore that last message! You should not be getting a credit.`)
	}
    },


    
//AWARD BONUS CHIPS FUNCTION
awardBonusChips(guild, player) {

    let quant
    let games = weekly[player]

    if (games >= 30) {
        quant = 100
    } else if (games >= 20) {
        quant = 60
    } else if (games >= 10) {
        quant = 30
    } else if (games >= 3) {
        quant = 15
    } else {
        quant = 0
    }

    starchips[player] = starchips[player]+parseInt(quant);
    fs.writeFile("./starchips.json", JSON.stringify(starchips), (err) => {	
        if (err) console.log(err) });

    console.log(`${names[player]} was awarded ${quant} bonus chip(s).`)

    let person = guild.members.find('id', player);

    if(!person) { 
        return 
    } else {
        person.send(`Hey, ${names[player]}, you played ${games} games last week. Here's a cool ${quant}${starchipEmoji}! Remember:
30+ games => 100${starchipEmoji}
20-29 games => 60${starchipEmoji}
10-19 games => 30${starchipEmoji}
3-9 games => 15${starchipEmoji}
	
Keep up the good work! Don't spend it all in one place.	
--- The Forged in Chaos Team`)
    }
},




//PASSING FUNCTION 3
    passingFunction3(guild, player, x) {
	console.log('passing fn3')
	return setTimeout(function(){ methods.awardTickets(guild, player, 2); }, (x*1000))
    },


//PASSING FUNCTION 4
    passingFunction4 (guild, player, x) {
	console.log('passing fn4')
        return setTimeout(function(){ methods.awardBonusChips(guild, player); }, (x*1000))
    },


//PASSING FUNCTION 5
    passingFunction5 (guild, player, x) {
	console.log('passing fn5')
        return setTimeout(function(){ methods.awardCredit(guild, player); }, (x*1000))
    },


//PASSING FUNCTION 6
    passingFunction6 (guild, player, x) {
	console.log('passing fn6')
        return setTimeout(function(){ methods.eraseWeekly(guild, player); }, (x*1000))
    },


//PASSING FUNCTION 7
    passingFunction7 (guild, player, x) {
	console.log('passing fn7')
        return setTimeout(function(){ methods.eraseMonthly(guild, player); }, (x*1000))
    }
}


exports.data = methods;



