const kafka  = require('../kafka.js')  
const groupId = 'resolver-Work'
const Works  = require('../controller/test-controller')
const uuid = require('uuid');
const producer = kafka.producer()
const consumer = kafka.consumer({ groupId })

const writeUserDataToKafka = async (payload) => {
    await producer.connect()
    try {
       const responses = await producer.send({
          topic: "Topic2",
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
       topic: "Topic1",
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
          var obj = JSON.parse(message.value.toString());
          var calculateResults = 2 + (parseInt(obj.message.order))
          var messageToSend = {
            id: uuid.v4(),
            order: calculateResults,
            status: "WorkDone",
        }
        writeUserDataToKafka({messageToSend})
        CheckArray(messageToSend)
       }
    })
}

function CheckArray(message) {
   console.log(Works)
   if(Works.filter(it => it.id == message.id)){
      var index = Works.findIndex(function(item, i){
         return item.id == message.id
      })
      Works[index] = message
   }
   else {
      Works.push(message)
   }
}

ConsumeMessage()