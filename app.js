const express = require('express')
const app = express()
const port = 3000
const { ConsumeMessage } = require('./kafka')  

var testController = require('./controller/test-controller.js');

ConsumeMessage()

app.use('/test', testController);

app.get('/', function(req, res){
   res.send("Server is up!");
});

app.listen(port, () => {
    console.log(`Escuchando en puerto: ${port}`)
})