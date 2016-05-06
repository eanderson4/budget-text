

/* *********** Exported Functions ************ */

module.exports = {
}

function getHelp(){

function getHelpMat(){

function getHelpEx(){


function getJobs(store){


function getCard(store){


function displayDate(date,config,head){

function getLast5(store){

function startTimer(store){

function getTimer(store){

function stopTimer(store){


function undoReport(store){

function getText(config,pack){


function getCustomText(text){


function generateResponse(store){


function generateResponse2(store){

function storeToRecord(store){


function getConfig(){


/* *********** Function Definitions ************ */

function getHelp(){
  var config = getConfig();
  var infoKeys = Object.keys(config['info']);
  var commandKeys = Object.keys(config['command']);
  var text;

  text = "Budget Text Help:\n\n"
  text += "Log information by keyword.\n";
  
  infoKeys.forEach(function(key){
      text += " - ";
      //text += key+":";
      config['info'][key].keywords.forEach(function(keyword){
          text +=" " + keyword;
      });
      text+="\n"
  }); 
  
  text += "\n * '5.25h 12tol 42mi'";
  text += "\n * '7.5h hours yesterday'\n\n";

  text += "Issue Commands.\n"
  commandKeys.forEach(function(key){
    var cm = config['command'][key];
    if(cm.command){
      text += " - "+cm.command+": "+cm.description+"\n"
    }
  });

  text += "\n * 'help ex'";
  text += "\n * 'comp'";
  
  return text;
}

function getHelpMat(){
  var config = getConfig();
  var matKeys = Object.keys(config['materials']);
  var commandKeys = Object.keys(config['command']);
  var text;

  text = "Log materials by keyword.\n";
  
  text += " - "+matKeys.join(', ');
  text += "\n";
   
  text += "\n * '62cat6 52 5wire'";
  text += "\n * '5hours 62cat6 52 5wire'";
  
  return text;
} 

function getHelpEx(){
  var text = "Info Logging Examples:\n\n"
   
  text += "Multiple in one message.\n"
  text += "7 hours 5tol 19mi\n";
  text += "12.25tolls 23miles\n";
  text += "\n";

  text += "Different positioning and keywords.\n";
  text += "7h 5.2 tol\n";
  text += "7 hrs 5.2tolls\n"
  text += "\n";

  text += "Add a time reference.\n"
  text += "7 hours 5tol 19mi yesterday\n";
  text += "5 days ago 7 hours 5tol 19mi\n";
  text += "5/29/15 7 hours 5tol 19mi";
  return text;
}

function getJobs(store){
  var text = "Job List:";
  store.jobList.forEach(function(job,index){
    text += "\n"+String(index+1)+": "+job.Name; 
  });
   if(store.jobList.length>2){
        text += "\n\nUse job and number to tag inline";
        text += "\ni.e. add 'job 2' to text";
        text += "\n\n * '8hr job 2'";
      }

  return text;
}

function getCard(store){
  var text = "https://s3-us-west-2.amazonaws.com/card-budget-text/card.vcf";

  return text;
}

function displayDate(date,config,head){
  var text = "\n\n"+date+"\n";
  //console.log('display-date',text,date,head);
  var typeOutput = [];
  _.keys(head).forEach(function(type){
    var output = [];
    _.keys(head[type]).forEach(function(item){
      output.push(getText(config[type][item],head[type][item]));
    });
    typeOutput.push(output.join(", "));
  });
  text += typeOutput.join("\n");


  return text;
}

function getLast5(store){
  var config = getConfig();
console.log("getLast5");
  recordDateRef.child(store.uid).child("Participants").child(store.participant.ID).orderByKey().limitToLast(5).once("value",function(snap){

      console.log('record',snap.val());

   
  var output = [];
    snap.forEach(function(recordSnap){
      var recordKey = recordSnap.key();
      var record = recordSnap.val()['head'];

      output.push(displayDate(recordKey,config,record)); 

    });

    var text = "Last "+output.length+" days:";
    text += output.join("");

    if(output.length == 0){
      text = "We do not have any stored records";
    }

    sms.send_by_id(store.uid,store.participant.ID,text);

    return text;   
  })

} 


function startTimer(store){
  console.log("Start Timer!!!");
  var uid = String(store.uid);
  var partKey = String(store.participant.ID);

  var promise = new Promise(function(resolve,reject){
    var text = "Start Timer";

    utilRef.child(uid).child(partKey).child("timer").once("value",function(snap){
      var key = snap.key();
      var value = snap.val();
      if(!value){
        //If there is no current timer, start timer
        sms.send_by_id(store.uid,store.participant.ID,"Timer Started!");  
        var current = moment();
        //might need to format
        utilRef.child(uid).child(partKey).child("timer").set(current.format());
      }
      else{
        //Find current time, report, and restart timer
        var current = moment();
        var old = moment(value);
        var hours = current.diff(old,"hours");
        var minutes = current.diff(old,"minutes");
        var seconds = current.diff(old,"seconds");
        var time =[];
        if(hours>0){
          time.push(String(hours)+" hours");
        }
        if(minutes>0){
          time.push(String(minutes)+" minutes");
        }
        if(hours==0){
          time.push(String(seconds)+" seconds");
        }
        var text = time.join(", ");
        text += "\n\n";
        text += "Timer Re-Started!";
       sms.send_by_id(store.uid,store.participant.ID,text);   

        utilRef.child(uid).child(partKey).child("timer").set(current.format());
      }
    });  
  });

  return "dontsend";

}
function getTimer(store){
  console.log("Timer Time!!!");
  var uid = String(store.uid);
  var partKey = String(store.participant.ID);

  var promise = new Promise(function(resolve,reject){
    var text = "Timer Time";

    utilRef.child(uid).child(partKey).child("timer").once("value",function(snap){
      var key = snap.key();
      var value = snap.val();
      if(!value){
        //If there is no current timer, start timer
        sms.send_by_id(store.uid,store.participant.ID,"Timer Started!");  
        var current = moment();
        //might need to format
        utilRef.child(uid).child(partKey).child("timer").set(current.format());
      }
      else{
        //Find current time, report, and restart timer
        var current = moment();
        var old = moment(value);
        var hours = current.diff(old,"hours");
        var minutes = current.diff(old,"minutes") - hours*60;
        var seconds = current.diff(old,"seconds")-minutes*60;
        var time =[];
        if(hours>0){
          time.push(String(hours)+" hours");
        }
        if(minutes>0){
          time.push(String(minutes)+" minutes");
        }
        if(hours==0){
          time.push(String(seconds)+" seconds");
        }
        var text = time.join(", ");
       sms.send_by_id(store.uid,store.participant.ID,text);   

        utilRef.child(uid).child(partKey).child("timer").set(null);
      }
    });  
  });

  return "dontsend";

}
function stopTimer(store){
  console.log("Stop Timer!!!");
  var uid = String(store.uid);
  var partKey = String(store.participant.ID);

  var promise = new Promise(function(resolve,reject){
    var text = "Stop Timer";

    utilRef.child(uid).child(partKey).child("timer").once("value",function(snap){
      var key = snap.key();
      var value = snap.val();
      if(!value){
        //If there is no current timer, start timer
        sms.send_by_id(store.uid,store.participant.ID,"There is no timer started, try 'start' or 'time'.");  
      }
      else{
        //Find current time, report, and restart timer
        var current = moment();
        var old = moment(value);
        var hours = current.diff(old,"hours");
        var minutes = current.diff(old,"minutes");
        var seconds = current.diff(old,"seconds");
        var time =[];
        if(hours>0){
          time.push(String(hours)+" hours");
        }
        if(minutes>0){
          time.push(String(minutes)+" minutes");
        }
        if(hours==0){
          time.push(String(seconds)+" seconds");
        }
        var text = time.join(", ");
       sms.send_by_id(store.uid,store.participant.ID,text);   

        utilRef.child(uid).child(partKey).child("timer").set(null);
      }
    });  
  });

  return "dontsend";

}

function undoReport(store){
  var uid = String(store.uid);
  var partKey = String(store.participant.ID);
  var promise = new Promise(function(resolve,reject){
    var text = "** Removed This Record **\n\n";

    recordRef.child(store.uid).child(store.participant.ID).orderByKey().limitToLast(1).once("value",function(snap){

      var recordKey = snap.key();
      var record = snap.val();
      if(record == null){
        sms.send_by_id(uid,partKey,"There are no more records to remove");
        reject("There are no more records...");
      }
      else{
        var keys = _.keys(record);
        var rc = record[keys[0]];

        if(rc){
          text += generateResponse2(rc);

          recordRef.child(store.uid).child(store.participant.ID).child(keys[0]).remove();
          sms.send_by_id(store.uid,store.participant.ID,text);

          resolve(text);
        }
      }

    });

  });

  return promise;
}

function getText(config,pack){
  if(pack == null){
    return null;
  }
  var text = ""
  if(config.prefix){
    text += config.prefix;
  }
  text +=pack;
  if(config.postfix){
    text += config.postfix;
  }
  text += " "+config.tag;

  return text

}

function getCustomText(text){
  return function(){
    return text;
  }
}


function generateResponse(store){
  var config = getConfig();

  //Prep response
  var response = "We have ";
  var responseArray = [];

  //Log Information
  var infoKeys = _.keys(config.info);
  infoKeys.forEach(function(infoKey){
    var name = config['info'][infoKey].name;
    if(store.pack['info'][infoKey]){
      //Exists, Include in response
      var text = getText(config['info'][infoKey],store.pack['info'][infoKey]);
      if(text){
        responseArray.push(text);
      }
    }
  });
  response += responseArray.join(", ");

  //Date Modifier
  if(store.pack.meta.chrono){
    var date= moment(store.pack.meta.chrono).format("dddd, MMMM Do YYYY");
    response += " for "+date;
  }
  else{
    response += " for Today";
  }

  //Job Modifier
  response = response+" - "+store.job.Name;

  return response;
}

function generateResponse2(store){
  var config = getConfig();

  //Job Modifier
  var response = store.job.Name+"\n";


  //Date Modifier
  if(_.has(store,"pack.meta.chrono")){
    var date= moment(store.pack.meta.chrono).tz('America/Denver').format("dddd, MMMM Do YYYY");
    response += " - "+date;
  }
  else{
    var date= moment(store.stamp).tz('America/Denver').format("dddd, MMMM Do YYYY");
    response += " - "+date;
  }
  response += "\n";
  response += "\n";

  
  //Log Information
  var output = []
  //if(store.pack.info.parsed){
  if(store.pack.info){ 
    var responseArray = [];
    var infoKeys = _.keys(config.info);
    infoKeys.forEach(function(infoKey){
      var name = config['info'][infoKey].name;
      if(store.pack['info'][infoKey]){
        //Exists, Include in response
        var text = getText(config['info'][infoKey],store.pack['info'][infoKey]);
        if(text){
          responseArray.push(text);
        } 
      }
    });
    if(responseArray.length>0){
      output.push(responseArray.join(", "));
    }
  }
  if(store.pack.materials){
    var responseArray = [];
    var materialsKeys = _.keys(config.materials);
    materialsKeys.forEach(function(materialsKey){
      var name = config['materials'][materialsKey].name;
      if(store.pack['materials'][materialsKey]){
        //Exists, Include in response
        var text = getText(config['materials'][materialsKey],store.pack['materials'][materialsKey]);
        if(text){
          responseArray.push(text);
        }
      }
    });
    if(responseArray.length>0){
      output.push(responseArray.join(", "));
    }
  }

  response += output.join("\n")

  return response;
}


var shortRecord = [
  "job.ID",
  "job.Name",
  "pack",
  "participant.ID",
  "participant.Name",
  "stamp",
  "uid"
];

//Takes store object and returns a record
function storeToRecord(store){
  var record = {}

  shortRecord.forEach(function(prop){
    var value = _.get(store,prop);
    _.set(record,prop,value);
  });

  var keys=["info","materials","command","meta"];
  record.pack =_.omit(record.pack,"parsed");
  keys.forEach(function(key){
    record.pack[key] = _.omit(record.pack[key],"parsed");
  });


  return record;
}


function getConfig(){
  var config = {
    "command": {
      "help":{
        "name": "Help",
        "parser": "command",
        "command": "help",
        "description": "Get guide",
        "text": "Help Needed!!!!",
        "keywords": ["help"],
        "strict": true,
        "response": getHelp,
        "types": "all"
      },
      "help_ex":{
        "name": "Help Ex",
        "parser": "command",
        "command": "help ex",
        "description": "Get examples",
        "text": "Help Needed!!!!",
        "keywords": ["help ex"],
        "response": getHelpEx,
        "strict": true,
        "types": "all"
      },
      "help_mats":{
        "name": "Help mats",
        "parser": "command",
        "command": "mats",
        "description": "Materials list",
        "text": "Help Material Needed!!!!",
        "keywords": ["help mats","help mat","mat","mats"],
        "response": getHelpMat,
        "strict": true,
        "types": "all"
      },
      "jobs":{
        "name": "Jobs",
        "parser": "command",
        "command": "jobs",
        "description": "Job list",
        "text": "Job List Needed!!!!",
        "keywords": ["jobs","job","job list"],
        "response": getJobs,
        "strict": true,
        "types": "all"
      },
      "last5":{
        "name": "Last 5",
        "parser": "command",
        "command": "history",
        "description": "Last 5 days",
        "text": "Info Needed!!!!",
        "keywords": ["last5","last 5","payroll","history","hist"],
        "response": getLast5,
        "strict": true,
        "types": "all"
      },
      "card":{
        "name": "card",
        "parser": "command",
        "command": "card",
        "description": "Contact card",
        "text": "Contact card Needed!!!!",
        "keywords": ["card","vcf","vcard"],
        "response": getCard,
        "strict": true,
        "types": "all"
      },
      "undo":{
        "name": "Undo",
        "parser": "command",
        "command": "undo",
        "description": "Undo last entry",
        "text": "Undo last record!!!!",
        "keywords": ["undo"],
        "strict": true,
        "response": undoReport,
        "types": "all"
      },
      "pong":{
        "name": "Pong",
        "parser": "command",
        "description": "Ping Pong",
        "text": "Ping Pong!!!!",
        "keywords": ["ping"],
        "strict": true,
        "response": getCustomText("Pong"),
        "types": "all"
      },
      "start":{
        "name": "Start Timer",
        "parser": "command",
        "description": "Start Timer",
        "text": "Start Timer!!!!",
        "keywords": ["start","start timer"],
        "strict": true,
        "response": startTimer,
        "types": "all"
      },
      "time":{
        "name": "Time",
        "parser": "command",
        "description": "Get Timer Time",
        "text": "Get TImer time!!!!",
        "keywords": ["time","timer"],
        "strict": true,
        "response": getTimer,
        "types": "all"
      },
      "stop":{
        "name": "Stop Timer",
        "parser": "command",
        "description": "Stop Timer",
        "text": "Stop Timer!!!!",
        "keywords": ["stop","stop timer"],
        "strict": true,
        "response": stopTimer,
        "types": "all"
      },
      "comp":{
        "name": "Comp",
        "parser": "command",
        "command": "comp",
        "text": "Compliment Needed! Inbound you glorious Bastard!!!!",
        "description": "Compliment",
        "keywords": ["comp","compliment"],
        "response": info.getCompliment,
        "strict": true,
        "types": "all"
      },
      "insult":{
        "name": "Insult",
        "parser": "command",
        "keywords": ["insult"],
        "text": "Insult Needed! What the fuck man?!??!?",
        "response": info.getInsult,
        "strict": true,
        "types": "all"
      }
    },
    "info": {
      "labor": {
        "name": "Labor",
        "parser": "info",
        "units": ["hours"],
        "tag": "hours",
        "keywords": ["hours","hrs","hr","hour","h","labor","labour"],
        "types": ['Employee','Installer','Project Manager']
      },
      "mileage": {
        "name": "Miles",
        "parser": "info",
        "units": ["miles"],
        "tag": "miles",
        "keywords": ["mileage","mi","mile","miles","m"],
        "types": ['Employee','Installer','Project Manager']
      },
      "tolls": {
        "name": "Tolls",
        "parser": "info",
        "strip": ["$"],
        "units": ["dollars"],
        "prefix": "$",
        "tag": "tolls",
        "keywords": ["tolls","toll","tol","tols"],
        "types": ['Employee','Installer','Project Manager']
      },
      "parking": {
        "name": "Parking",
        "parser": "info",
        "strip": ["$"],
        "units": ["dollars"],
        "prefix": "$",
        "tag": "parking",
        "keywords": ["parking","park"],
        "types": ['Employee','Installer','Project Manager']
      },
      "hardware": {
        "name": "Hardware",
        "parser": "info",
        "strip": ["$"],
        "units": ["dollars"],
        "prefix": "$",
        "tag": "hardware",
        "keywords": ["hardware","hw","supply","supplies"],
        "types": ['Employee','Installer','Project Manager']
      }
    },
    "materials":{
      "cat6": {
        "name": "Cat 6",
        "description": "Cat 6",
        "parser": "info",
        "strip": ["'"],
        "units": ["feet"],
        "postfix": "'",
        "tag": "cat 6",
        "keywords": ["cat6", "cat6s"],
        "types": ['Employee','Installer','Project Manager']
      },
      "5wire": {
        "name": "5 Wire",
        "description": "5 Wire",
        "parser": "info",
        "strip": ["'"],
        "units": ["feet"],
        "postfix": "'",
        "tag": "5 wire",
        "keywords": ["5wire"],
        "types": ['Employee','Installer','Project Manager']
      },
      "22-2": {
        "name": "22/2",
        "description": "22/2",
        "parser": "info",
        "strip": ["'"],
        "units": ["feet"],
        "postfix": "'",
        "tag": "22/2",
        "keywords": ["22/2","22-2"],
        "types": ['Employee','Installer','Project Manager']
      },
      "18-2": {
        "name": "18/2",
        "description": "18/2",
        "parser": "info",
        "strip": ["'"],
        "units": ["feet"],
        "postfix": "'",
        "tag": "18/2",
        "keywords": ["18/2","18-2"],
        "types": ['Employee','Installer','Project Manager']
      },
      "rgbhv": {
        "name": "rgbhv",
        "description": "rgbhv",
        "parser": "info",
        "strip": ["'"],
        "units": ["feet"],
        "postfix": "'",
        "tag": "rgbhv",
        "keywords": ["rgbhv","rgb"],
        "types": ['Employee','Installer','Project Manager']
      }
    },
    "meta":{
      "date": {
        "name": "Date",
        "parser": "date",
        "types": "all"
      },
      "job": {
        "name": "Job",
        "parser": "info",
        "units": "job",
        "tag": "job",
        "keywords": ["job"],
        "types": "all"
      }
    }
  };
  return config;
}
