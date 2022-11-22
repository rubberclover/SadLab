const assert = require('assert')
const crypto = require('crypto')
const restify= require('restify')
const kafka = require('./kafka')
const producer = kafka.producer()
const PORT = process.env.PORT || 3020

function error(srv,resp,msg) {
   srv.emit('hook:error', msg)
   resp.send(400, msg)
}

function makeServer(secret, mount) {
   assert(secret, 'you must pass a shared secret')
   assert(mount,  'you must pass a path for the hook in opts.mount')

   let server = restify.createServer({secret:secret, mount:mount})
   server.use(restify.plugins.acceptParser(server.acceptable))
   server.use(restify.plugins.queryParser())
   server.use(restify.plugins.gzipResponse())
   server.use(restify.plugins.bodyParser({mapParams: false}))

   server.post(mount, (req, resp, next) => {
      let signature = req.headers['x-npm-signature']
      if (!signature) {
         error(server,resp,'no x-npm-signature header found')
         return next()
      }
      let expected = 'sha256='+crypto.createHmac('sha256',secret).update(req._body).digest('hex')
      if (signature !== expected) {
         console.log("signature: |"+ signature+"|")
         console.log('expected:  |'+ expected+"|")
         error(server,resp,'invalid payload signature found in x-npm-signature header')
         return next()
      }
      let msg = {sender: req.body.hookOwner.username, ...req.body}
      server.emit(req.body.event, msg)
      server.emit('hook', msg)
      resp.send(200, 'OK')
      next()
   })
   return server
}

const main = async () => {
   await producer.connect()
   const server = makeServer(process.env.HOOK_SECRET, '/hook')
   server.on('package:publish', async event => {
      try {
         const responses = await producer.send({
            topic: process.env.TOPIC,
            messages: [{
               // Name of the published package as key, to make sure that we process events in order
               key: event.name,
               // The message value is just bytes to Kafka, so we need to serialize our JavaScript
               // object to a JSON string. Other serialization methods like Avro are available.
               value: JSON.stringify({
                  package: event.name,
                  version: event.version
               })
            }]
         })
         console.log('Published message', { responses })
      } catch (error) {
         console.error('Error publishing message', error)
      }
   })
   server.listen(process.env.PORT || 3020, () => {
      console.log((`Server listening on port ${PORT}`))
   })
}

main().catch(error => {
   console.error(error)
   process.exit(1)
})
