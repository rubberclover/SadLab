// Webhook URL: https://hooks.slack.com/services/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
const kafka = require('./kafka')
const consumer = kafka.consumer({
   groupId: process.env.GROUP_ID
})
const { IncomingWebhook } = require('@slack/webhook')
const slack = new IncomingWebhook(process.env.SLACK_INCOMING_WEBHOOK_URL);

const main = async () => {
   await consumer.connect()
   await consumer.subscribe({
      topic: process.env.TOPIC,
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
          // Remember that we need to deserialize the message value back into a Javascript object
          // by using JSON.parse on the stringified value.
          const { package, version } = JSON.parse(message.value.toString());
          
          const text = `:package: ${package}@${version} released\n&lt;https://www.npmjs.com/package/${package}/v/${version}|Check it out on NPM&gt;`;
          
          await slack.send({
            text,
            username: 'Package bot',
          });
          }
          })          
}

main().catch(async error => {
   console.error(error)
   try {
      await consumer.disconnect()
   } catch (e) {
      console.error('Failed to gracefully disconnect consumer', e)
   }
   process.exit(1)
})