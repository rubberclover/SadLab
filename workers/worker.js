const kafka  = require('../kafka.js')  
const groupId = 'resolver-Work'
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
          topic: "ResultQue",
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
       topic: "JobQue",
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
        var gitName = extractGitHubName(obj.message.link) 
        var gitName = gitName.toString().replace('.git','')
        if(fs.existsSync(path + "/" + gitName) == false){
         shell.exec('git clone ' + obj.message.link)  
        } 
        DoJobs(obj.message)
        //CheckArray(messageToSend)
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

function extractGitHubName(url) {
   if (!url) return null
   const match = url.match(
     /^https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/
   )
   if (!match || !(match.groups?.owner && match.groups?.name)) return null
   return `${match.groups.name}`
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
         var end= Date.now();
         var timeTook=(end-begin)/1000+"secs";
         var finishedJob = {
            id: QueMessage.id,
            time: timeTook,
            result: error.message
         }
         /*data = JSON.stringify(finishedJob, null, 2)
         fs.writeFileSync('../doneJobs/' + QueMessage.id + '.json' ,data, finished)*/
         writeUserDataToKafka({finishedJob})
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
         nick: QueMessage.nick,
         email: QueMessage.email,
         time: timeTook,
         result: stdout,
         status: "JobDone"
     }
     /*data = JSON.stringify(finishedJob, null, 2)
     fs.writeFileSync('../doneJobs/' + QueMessage.id + '.json' ,data, finished)*/
     writeUserDataToKafka({finishedJob})
     return;
  })
  } 
}

ConsumeMessage()

module.exports.DoJobs = DoJobs