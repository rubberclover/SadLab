const kafka  = require('../kafka.js')  
const groupId = 'resolver-Work'
const uuid = require('uuid');
const producer = kafka.producer()
const consumer = kafka.consumer({ groupId })
var fs = require('fs');
const { finished } = require('stream');
const shell = require('shelljs')
const path = '../repos'
const { exec } = require("child_process");

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
          shell.cd(path)
          shell.exec('git clone ' + obj.message.link)
          var messageToSend = {
            id: obj.message.id,
            order: obj.message.order,
            link: obj.message.link,
            params: obj.message.params,
            dependencies: obj.message.dependencies,
            resultName: obj.message.resultFileName,
            status: "JobDone",
        }
        DoJobs(obj.message)
        CheckArray(messageToSend)
        writeUserDataToKafka({messageToSend})
       }
    })
}

function CheckArray(message) {
   let data = fs.readFileSync('../Works.js')
   let Works = JSON.parse(data)
   if(Works.filter(it => it.id == message.id)){
      var index = Works.findIndex(item=> item.id === message.id)
      Works[index] = message
   }
   else {
      Works.push(message)
   }
   data = JSON.stringify(Works, null, 2)
   fs.writeFileSync('../Works.js',data, finished)
}

function DoJobs(QueMessage){
   //Calculate time elapse
   var begin=Date.now();
   if(QueMessage.dependencies != ""){
   exec(QueMessage.dependencies,(error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          return;
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
      }
      console.log(`stdout: ${stdout}`);
  })
  } 
  if(QueMessage.params != ""){
   exec(QueMessage.params,{
      cwd: path + '/'
    },(error, stdout, stderr) => {
      if (error) {
          data = JSON.stringify(`error: ${error.message}`, null, 2)
          fs.writeFileSync('../doneJobs/' + QueMessage.resultFileName + '.json' ,data, finished)
          return;
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
      }
      var end= Date.now();
      var timeTook=(end-begin)/1000+"secs";
      var finishedJob = {
         id: QueMessage.id,
         link: QueMessage.link,
         status: "JobFinished",
         time: timeTook,
         result: stdout
     }
     data = JSON.stringify(finishedJob, null, 2)
     fs.writeFileSync('../doneJobs/' + QueMessage.resultFileName + '.json' ,data, finished)
     return;
  })
  } 
}

ConsumeMessage()

module.exports.DoJobs = DoJobs