var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
const { writeUserDataToKafka } = require('../kafka')
const uuid = require('uuid');
var fs = require('fs');
const { finished } = require('stream');
var jsonParser = bodyParser.json()
const keycloak = require('../config/keycloak-config.js').getKeycloak()
const jwt_decode = require('jwt-decode')
const shell = require('shelljs')

router.post('/send-message',keycloak.protect('realm:Manager'),jsonParser,async (req, res) => {
    const {link, params, dependencies} = req.body
    var token = GetToken(req.headers.authorization)
    var nick = token.preferred_username
    var email = token.email
    var message = {
        id: uuid.v4(),
        link: link,
        params: params,
        dependencies: dependencies,
        nick: nick,
        email: email,
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
    if(Job.status == "JobDone"){
        let data = fs.readFileSync("./doneJobs/" + req.query.id + ".json" )
        shell.cd("./doneJobs/")
        shell.exec('rm -rf ' + (req.query.id + ".json"))  
        shell.cd("..")
        res.send(data)
    }
    else {
        res.send("El trabajo no ha finalizado")
    }
    
})

router.get('/get-own-jobs',keycloak.protect('realm:Manager') ,async (req, res) => {
    var token = GetToken(req.headers.authorization)
    var nick = token.preferred_username
    var email = token.email
    var result = GetAllWorks(nick,email)
    res.send(result)
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

function GetAllWorks(nick,email){
    let data = fs.readFileSync('Works.js')
    let Works = JSON.parse(data)
    return Works.filter(item => {
        return (item.nick == nick && item.email == email)
    })
}

function DeleteWorks(idConsult){
    let data = fs.readFileSync('Works.js')
    let Works = JSON.parse(data)
    let new_Value = Works.filter(function(emp) {
        if (emp.id == idConsult) {
            return false;
        }
        return true;
    });
    data = JSON.stringify(new_Value, null, 2)
    fs.writeFileSync('Works.js',data, finished)
}

function GetToken(auth){
    var aux = auth.toString().split(" ")
    var decodedHeader = jwt_decode(aux[1], { payload: true });
    return decodedHeader
}

module.exports = router;
