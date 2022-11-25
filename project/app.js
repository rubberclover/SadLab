const express = require('express')
const { writeUserDataToKafka, readMessages } = require('./user.kafka')
const app = express()
const port = 3000

readMessages()

var testController = require('./controller/test-controller.js');


app.use('/test', testController);

app.get('/', function(req, res){
   res.send("Server is up!");
});

/*app.get('/send-message', async (req, res) => {
    await writeUserDataToKafka({ name: 'Raul', status: 'sent' , message: 'Hola que tal?' })
    
    res.send('Hello World!')
})
*/
app.listen(port, () => {
    console.log(`Escuchando en puerto: ${port}`)
})