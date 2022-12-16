var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
const { writeUserDataToKafka } = require('../kafka')
const uuid = require('uuid');
var fs = require('fs');
const { finished } = require('stream');
var jsonParser = bodyParser.json()
const keycloak = require('../config/keycloak-config.js').getKeycloak()
var Promise = require('promise')


router.post('/send-message',keycloak.protect('realm:Manager'),jsonParser,async (req, res) => {
    const {link, order, params, dependencies, resultFileName} = req.body
    console.log(order) // Esto se muestra???
    var message = {
        id: uuid.v4(),
        order: order,
        link: link,
        params: params,
        dependencies: dependencies,
        resultFileName: resultFileName,
        status: "Sending message"
    }
    InsertMessage(message)
    writeUserDataToKafka({message})
    res.send(message.id)
})

router.get('/get-status',keycloak.protect('realm:Manager') ,async (req, res) => {
    res.send(GetWorks(req.query.id))
})

router.get('/get-result',keycloak.protect('realm:Manager') ,async (req, res) => {
    var Job = GetWorks(req.query.id)
    if(Job.status == "JobFinished"){
        //Insertar la funcion en cuestion
    }
    DeleteWorks(req.query.id)
    let data = fs.readFileSync("./doneJobs/" + Job.resultFileName + ".json" )
    res.send(data)
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

function DeleteWorks(idConsult){
    let data = fs.readFileSync('Works.js')
    let Works = JSON.parse(data)
    delete Works.find(item => {
        return item.id == idConsult
    })
    data = JSON.stringify(Works, null, 2)
    fs.writeFileSync('Works.js',data, finished)
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
