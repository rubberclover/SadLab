const { finished } = require('stream');
const shell = require('shelljs')
const path = './repos'
const { exec } = require("child_process");

var begin=Date.now();
exec("cd RandomCountry && python main.py Ireland",{
    cwd: path + "/"
  },(error, stdout, stderr) => {
    if (error) {
       console.log(error)
       var end= Date.now();
       var timeTook=(end-begin)/1000+"secs";
       var finishedJob = {
          id: "",
          time: timeTook,
          error: error.message
       }
       /*data = JSON.stringify(finishedJob, null, 2)
       fs.writeFileSync('../doneJobs/' + QueMessage.id + '.json' ,data, finished)*/
       console.log(finishedJob)
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
    }
    var end= Date.now();
    var timeTook=(end-begin)/1000+"secs";
    var finishedJob = {
       id: "QueMessage.id",
       nick: "QueMessage.nick",
       email: "QueMessage.email",
       time: timeTook,
       result: stdout,
       status: "JobDone"
   }
   /*data = JSON.stringify(finishedJob, null, 2)
   fs.writeFileSync('../doneJobs/' + QueMessage.id + '.json' ,data, finished)*/
   console.log(finishedJob)
})