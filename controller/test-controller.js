var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
const { writeUserDataToKafka } = require('../kafka')
const uuid = require('uuid');
var fs = require('fs');
const { finished } = require('stream');
var jsonParser = bodyParser.json()


router.get('/send-message',jsonParser,async (req, res) => {
    const {link, order, status} = req.body
    console.log(order)
    var message = {
        id: uuid.v4(),
        order: order,
        link: link,
        status: status
    }
    InsertMessage(message)
    writeUserDataToKafka({message})
    res.send(message.id)
})

router.get('/get-status', async (req, res) => {
    res.send(GetWorks(req.query.id))
})

function InsertMessage(message){
    let data = fs.readFileSync('Works.js')
    let Works = JSON.parse(data)
    Works.push(message)
    data = JSON.stringify(Works, null, 2)
    fs.writeFileSync('Works.js',data, finished)
}

function GetWorks(idConsult){
    let data = fs.readFileSync('Works.js')
    let Works = JSON.parse(data)
    return Works.find(item => {
        return item.id == idConsult
    })
}

function CheckArray(message) {
    let data = fs.readFileSync('Works.js')
    let Works = JSON.parse(data)
    if(Works.filter(it => it.id == message.id)){
       var index = Works.findIndex(item=> item.id === message.id)
       Works[index] = message
    }
    else {
       Works.push(message)
    }
    data = JSON.stringify(Works, null, 2)
    fs.writeFileSync('Works.js',data, finished)
}

module.exports = router;
