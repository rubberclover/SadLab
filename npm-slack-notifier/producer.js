const kafka = require('./kafka')
const producer = kafka.producer()

const sendMessage = async ({key, topic, version}) => {
    await producer.connect()
    try {
        const responses = await producer.send({
           topic: topic,
           messages: [{
              // Name of the published package as key, to make sure that we process events in order
              key: key,
              // The message value is just bytes to Kafka, so we need to serialize our JavaScript
              // object to a JSON string. Other serialization methods like Avro are available.
              value: JSON.stringify({
                 package: key,
                 version: version
              })
           }]
        })
        console.log('Published message', { responses })
     } catch (error) {
        console.error('Error publishing message', error)
     }
}

module.exports.sendMessage = sendMessage