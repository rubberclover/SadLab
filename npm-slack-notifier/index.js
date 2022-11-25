var express = require('express');
const session = require('express-session');
const cors = require('cors');
var app = express();
const port = 3000


app.use(cors());

const memoryStore = new session.MemoryStore();

app.use(session({
  secret: 'some secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

var testController = require('./controller/test-controller.js');


app.use('/test', testController);

app.get('/', function(req, res){
   res.send("Server is up!");
});

app.listen(port);