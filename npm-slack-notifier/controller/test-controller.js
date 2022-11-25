var express = require('express');
var router = express.Router();
const {writeUserDataToKafka} = require('../user.kafka')

//const keycloak = require('../config/keycloak-config.js').getKeycloak();

router.get('/anonymous', function(req, res){
    res.send("Hello Anonymous");
});
router.get('/send', async(req, res)  => {
    await writeUserDataToKafka({message: 'Hello', name: 'Pablo', status: 'sending'})
    res.send("Hello User");
});

router.get('/admin', function(req, res){
    res.send("Hello Admin");
});

router.get('/all-user', function(req, res){
    res.send("Hello All User");
});

module.exports = router;