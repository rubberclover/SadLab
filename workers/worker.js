const kafka  = require('./kafka.js')  
const groupId = 'WorkerQue'
const producer = kafka.producer()
const consumer = kafka.consumer({ groupId })
var fs = require('fs');
const { finished } = require('stream');
const shell = require('shelljs')
const path = 'repos'
const { exec } = require("child_process");
const { dirname, resolve } = require('path');
const { rejects } = require('assert');
let file = ""

shell.exec('rm -rf /repos/*') 
shell.cd(path)

const writeUserDataToKafka = async (payload) => {
    await producer.connect()
    try {
       const responses = await producer.send({
          topic: "Results",
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
       topic: "Sending",
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
        
      try{
         await checkGitRepository(obj.message.link)
         if(file.stderr != ''){
            var finishedJob = {
               id: obj.message.id,
               nick: obj.message.nick,
               email: obj.message.email,
               result: ("El repositorio " + obj.message.link + " no existe"),
               status: "Error"
            }
            writeUserDataToKafka({finishedJob})
        }
        else{
        var gitName = extractGitHubName(obj.message.link) 
        var gitName = gitName.toString().replace('.git','')
        if(fs.existsSync(shell.pwd().toString() + "/" + gitName) == false){
         shell.exec('git clone ' + obj.message.link)
        } 
        DoJobs(obj.message)
        //CheckArray(messageToSend)
       }
      }
      catch(e){
         console.log(e)
         var finishedJob = {
            id: obj.message.id,
            nick: obj.message.nick,
            email: obj.message.email,
            result: e,
            status: "Error"
         }
         writeUserDataToKafka({finishedJob})
      }
       }
    })
}

function extractGitHubName(url) {
   if (!url) return null
   const match = url.match(
     /^https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/
   )
   if (!match || !(match.groups?.owner && match.groups?.name)) return null
   return `${match.groups.name}`
 }

async function checkGitRepository(gitLink){
   file = shell.exec("git ls-remote -h " + gitLink)
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
      cwd: shell.pwd().toString()
    },(error, stdout, stderr) => {
      if (error) {
         console.log(shell.pwd().toString())
         console.log(stderr)
         var end= Date.now();
         var timeTook=(end-begin)/1000+"secs";
         var finishedJob = {
            id: QueMessage.id,
            time: timeTook,
            result: error.message,
            status: "Error"
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
      dataResult = stdout.toString()
      while (dataResult.length > 1000){
         dataResult = dataResult.substring(1000)
      }
      var end= Date.now();
      var timeTook=(end-begin)/1000+"secs";
      var finishedJob = {
         id: QueMessage.id,
         nick: QueMessage.nick,
         email: QueMessage.email,
         time: timeTook,
         result: dataResult,
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