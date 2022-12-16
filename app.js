const express = require('express')
const request = require("request")
const session = require('express-session')
const cors = require('cors')
const app = express()
const port = 3000
const { ConsumeMessage } = require('./kafka')  
var fs = require('fs');
const { finished } = require('stream');
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(cors());

const memoryStore = new session.MemoryStore();

app.use(session({
  secret: 'some secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

const keycloak = require('./config/keycloak-config.js').initKeycloak(memoryStore)

data = JSON.stringify([], null, 2)
fs.writeFileSync('Works.js',data, finished)

app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/'
}))

var testController = require('./controller/test-controller.js');

ConsumeMessage()

app.use('/test', testController);

app.get('/', function(req, res){
   res.send("Server is up!");
});

app.listen(port, () => {
    console.log(`Escuchando en puerto: ${port}`)
})