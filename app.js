const express = require('express')
const app = express()
const port = 3000
const { ConsumeMessage } = require('./kafka')  
var fs = require('fs');
const { finished } = require('stream');

/*let data = fs.readFileSync('Works.js')
let Works = JSON.parse(data)*/
data = JSON.stringify([], null, 2)
fs.writeFileSync('Works.js',data, finished)

var testController = require('./controller/test-controller.js');

ConsumeMessage()

app.use('/test', testController);

app.get('/', function(req, res){
   res.send("Server is up!");
});

app.listen(port, () => {
    console.log(`Escuchando en puerto: ${port}`)
})