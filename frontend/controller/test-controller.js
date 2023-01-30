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

//Ruta para enviar un trabajo
router.post('/send-message',keycloak.protect(process.env.KAFKA_ROLE),jsonParser,async (req, res) => {
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

//Ruta para obtener el estado del trabajo
router.get('/get-status',keycloak.protect(process.env.KAFKA_ROLE),async (req, res) => {
    res.send(GetWorks(req.query.id))
})

//Ruta para obtener el resultado del trabajo
router.get('/get-result',keycloak.protect(process.env.KAFKA_ROLE) ,async (req, res) => {
    var Job = GetWorks(req.query.id)
    if(Job.status == "JobDone" || Job.status == "Error"){
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

//Ruta para obtener los trabajos por medio del token
router.get('/get-own-jobs',keycloak.protect(process.env.KAFKA_ROLE) ,async (req, res) => {
    var token = GetToken(req.headers.authorization)
    var nick = token.preferred_username
    var email = token.email
    var result = GetAllWorks(nick,email)
    res.send(result)
})

//Metodo que inserta los mensajes para poder ser recuperados
function InsertMessage(message){
    let data = fs.readFileSync('Works.js')
    let Works = JSON.parse(data)
    Works.push(message)
    data = JSON.stringify(Works, null, 2)
    fs.writeFileSync('Works.js',data, finished)
}

//Metodo para obtener un trabajo por medio de un id
function GetWorks(idConsult){
    let data = fs.readFileSync('Works.js')
    let Works = JSON.parse(data)
    return Works.find(item => {
        return item.id == idConsult
    })
}

//Metodo para obtener todos los trabajos por medio del nick y el email del usuario
function GetAllWorks(nick,email){
    let data = fs.readFileSync('Works.js')
    let Works = JSON.parse(data)
    return Works.filter(item => {
        return (item.nick == nick && item.email == email)
    })
}

//Metodo para borrar trabajos en versiones anteriores del proyecto
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

//Metodo para obtener el token del header
function GetToken(auth){
    var aux = auth.toString().split(" ")
    var decodedHeader = jwt_decode(aux[1], { payload: true });
    return decodedHeader
}

module.exports = router;
