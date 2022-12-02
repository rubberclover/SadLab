var express = require('express');
var router = express.Router();
const { writeUserDataToKafka } = require('../kafka')
const uuid = require('uuid');
const Works = [] 

router.get('/send-message', async (req, res) => {
    var message = {
        id: uuid.v4(),
        order: "5",
        status:"Sending message",
    }
    writeUserDataToKafka({message})
    Works.push(message)
    res.send(message.id)
})

router.get('/get-status', async (req, res) => {
    res.send(Works)
    /*res.send(Works.find(item => {
        return item.id == req.query.id
    }))*/
})

module.exports = router;
module.exports.Works = this.Works;