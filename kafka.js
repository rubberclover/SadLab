const { Kafka } = require('kafkajs')

const username = ''
const password = ''
const brokers = ['localhost:9092']
const clientId = 'test-id-example'
const groupId = 'app-example'

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
          topic: "Topic1",
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
       topic: "Topic2",
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
       }
    })
}

const CreateTopics = async () => {
   await admin.createTopics({
      waitForLeaders: true,
      topics: [
        { topic: 'Topic1' },
        { topic: 'Topic2'}
      ],
    })
}

module.exports = kafka
module.exports.writeUserDataToKafka = writeUserDataToKafka
module.exports.ConsumeMessage = ConsumeMessage
module.exports.CreateTopics = CreateTopics