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
const CryptoJS = require('crypto-js')


router.post('/send-message',keycloak.protect('realm:Manager'),jsonParser,async (req, res) => {
    const {link, order, params, dependencies, resultFileName} = req.body
    var token = GetToken(req.headers.authorization)
    var nick = token.preferred_username
    var email = encryptWithAES(token.email)
    var name = encryptWithAES(token.name)
    var message = {
        id: uuid.v4(),
        order: order,
        link: link,
        params: params,
        dependencies: dependencies,
        resultFileName: resultFileName,
        nick: nick,
        email: email,
        name: name,
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
        DeleteWorks(req.query.id)
        let data = fs.readFileSync("./doneJobs/" + Job.resultFileName + ".json" )
        res.send(data)
    }
    else {
        res.send("El trabajo no ha finalizado")
    }
    
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
    let new_Value = Works.filter(function(emp) {
        if (emp.id == idConsult) {
            return false;
        }
        return true;
    });
    data = JSON.stringify(new_Value, null, 2)
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

function GetToken(auth){
    var aux = auth.toString().split(" ")
    var decodedHeader = jwt_decode(aux[1], { payload: true });
    console.log(decodedHeader)
    return decodedHeader
}

function encryptWithAES(text){
    const passphrase = '123';
    return CryptoJS.AES.encrypt(text, passphrase).toString();
}
  
function decryptWithAES(ciphertext){
    const passphrase = '123';
    const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
}

module.exports = router;
