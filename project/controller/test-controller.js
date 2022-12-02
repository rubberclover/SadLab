var express = require('express');
var router = express.Router();
const { writeUserDataToKafka, readMessages } = require('../user.kafka')



router.get('/send-message', async (req, res) => {
    await writeUserDataToKafka({ name: 'Raul', status: 'sent' , message: 'Hola que tal?' })
    res.send('Hello World!')
})

module.exports = router;
