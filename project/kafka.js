const {Kafka} = require('kafkajs')
const {SchemaRegistry} = require('@kafkajs/confluent-schema-registry')

const username = ''
const password = ''
const brokers = ['localhost:9092']
const host = 'http://localhost:8081'
const clientId = 'test-id-example'
const groupId = 'app-example'

const sasl = username && password ? { username, password, mechanism: 'plain' } : null
const ssl = !!sasl

const registry = new SchemaRegistry({ host })
const kafka = new Kafka({ clientId, brokers /*ssl sasl*/ })

const producer = kafka.producer()
const consumer = kafka.consumer({ groupId })

const findSchemaBySubjectAndVersion = ({ version, subject }) => registry.getRegistryId(subject, version)

const sendMessageToTopic = async ({ key, topic, encodePayloadId, payload }) => {
    try{
        await producer.connect()
        const encodedPayload = await registry.encode(encodePayloadId, payload)

        const responses = await producer.send({
            topic: topic,
            messages: [{ key, value: encodedPayload}]
        })

        console.log('Enviado correctamente a Kafka', responses)
    } catch (err) {
        console.log('Error al enviar a Kafka', err)
    }
}

const readMessageFromTopic = async (topic, func) => {
    await consumer.connect()
    await consumer.subscribe({ topic })

    await consumer.run({
        eachMessage: async ({ message }) => {
            try{
                const decodedMessage = {
                    ...message,
                    value: await registry.decode(message.value)
                }

                func(decodedMessage)
            } catch (err) {
                console.error(err)
            }
        },
    })
}

module.exports.findSchemaBySubjectAndVersion = findSchemaBySubjectAndVersion
module.exports.sendMessageToTopic = sendMessageToTopic
module.exports.readMessageFromTopic = readMessageFromTopic