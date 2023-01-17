const { Kafka } = require('kafkajs')

const username = ''
const password = ''
const brokers = [process.env.KAFKA_BROKER_SERVER]
const clientId = process.env.KEYCLOAK_CLIENTID
const groupId = 'FrontEndQue'
var fs = require('fs');
const { finished } = require('stream');

const sasl = username && password ? { username, password, mechanism: 'plain' } : null
const ssl = !!sasl

const kafka = new Kafka({ clientId, brokers /*ssl sasl*/ })

const producer = kafka.producer()
const consumer = kafka.consumer({ groupId })
const admin = kafka.admin()

const writeUserDataToKafka = async (payload) => {
    await producer.connect()
    try {
       const responses = await producer.send({
          topic: "Sending",
          messages: [{
             // Name of the published package as key, to make sure that we process events in order
             key: "TestKey",
             // The message value is just bytes to Kafka, so we need to serialize our JavaScript
             // object to a JSON string. Other serialization methods like Avro are available.
             value: JSON.stringify(payload)
          }]
       })
       console.log('Published message', { responses })
    } catch (error) {
       console.error('Error publishing message', error)
    }
}

const ConsumeMessage = async () => {
    await consumer.connect()
    await consumer.subscribe({
       topic: "Results",
       fromBeginning: true
    })
 
    await consumer.run({
       eachMessage: async ({ topic, partition, message }) => {
          console.log('Received message', {
             topic,
             partition,
             key: message.key.toString(),
             value: message.value.toString()
          })
          var obj = JSON.parse(message.value.toString())       
          var messageToSend = {
           id: obj.finishedJob.id,
           nick: obj.finishedJob.nick,
           email: obj.finishedJob.email,
           status: "JobDone"
          }
          CheckArray(messageToSend)
          var messageToSend = {
            id: obj.finishedJob.id,
            time: obj.finishedJob.time,
            result: obj.finishedJob.result
           }
          data = JSON.stringify(messageToSend, null, 2)
          fs.writeFileSync('./doneJobs/' + messageToSend.id + '.json' ,data, finished)
       }
    })
}

/*const CreateTopics = async () => {
   await admin.createTopics({
      waitForLeaders: true,
      topics: [
        { topic: 'JobQue' },
        { topic: 'ResultQue'}
      ],
    })
}*/

function CheckArray(message) {
   let data = fs.readFileSync('./Works.js')
   let Works = JSON.parse(data)
   if(Works.filter(it => it.id == message.id)){
      var index = Works.findIndex(item=> item.id === message.id)
      Works[index] = message
   }
   else {
      Works.push(message)
   }
   data = JSON.stringify(Works, null, 2)
   fs.writeFileSync('./Works.js',data, finished)
}

module.exports = kafka
module.exports.writeUserDataToKafka = writeUserDataToKafka
module.exports.ConsumeMessage = ConsumeMessage
//module.exports.CreateTopics = CreateTopics