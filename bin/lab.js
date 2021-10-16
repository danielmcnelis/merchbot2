// Node.js program to demonstrate the   
// fs.mkdir() Method
  
// Include fs and path module
const fs = require('fs')
   
fs.mkdir('./decks/test', (err) => {
    if (err) {
        return console.error(err)
    }
    console.log('Directory created successfully!')
})