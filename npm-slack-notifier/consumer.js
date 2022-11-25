const kafka = require('./kafka')
const consumer = kafka.consumer({
   groupId: 'testPract'
})
/*const { IncomingWebhook } = require('@slack/webhook')
const slack = new IncomingWebhook(process.env.SLACK_INCOMING_WEBHOOK_URL);*/

const receiveMessage = async (topic, func) => {
   await consumer.connect()
   await consumer.subscribe({
      topic: topic,
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

module.exports.receiveMessage = receiveMessage