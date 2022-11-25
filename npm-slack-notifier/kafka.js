const { Kafka } = require('kafkajs')
const { SchemaRegistry } = require('@kafkajs/confluent-schema-registry')

// process.env -> acceso a variables de entorno
const username = ''
const password = ''
const brokers = ['localhost:9092']
const host = 'http://localhost:8081'
const clientId = 'testPract'
const groupId = 'testGroup'
const sasl = username && password ? { username, password, mechanism: 'plain' } : null
const ssl = !!sasl

const registry = new SchemaRegistry({host})
// This creates a client instance that is configured to connect to the Kafka broker provided by
// the environment variable KAFKA_BOOTSTRAP_SERVER
const kafka = new Kafka({
   clientId: clientId,
   brokers: brokers,
   ssl,
   sasl
})

const producer = kafka.producer()
const consumer = kafka.consumer({groupId})

const findSchemaBySubjectAndVersion = ({ version, subject }) => registry.getRegistryId(subject, version)

const sendMessageToTopic = async ({key, topic, encodePayloadId, payload}) => {
   try {
      await producer.connect()
      const encodePayloadId = await registry.encode(encodePayloadId, payload)

      const responses = await producer.send({
         topic : topic,
         messages: [{key, value: encodePayloadId}]
      })

      console.log('Se ha realizado el envio correctamente', responses)
   } catch (err){
      console.error('Se ha producido un error al mandar información a Kafka', err)
   }
}

module.exports.findSchemaBySubjectAndVersion = findSchemaBySubjectAndVersion
module.exports.sendMessageToTopic = sendMessageToTopic
module.exports = kafka