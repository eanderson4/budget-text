

//Modules
var Firebase = require("firebase");
var moment = require('moment-timezone');
var _ = require('lodash');

//SMS
var sms = require("./sms/sms.js");

//Data
var info = require("./info/info.js");



/********* Initialization ********/
var ref = new Firebase("https://budgettext.firebaseio.com/");
var messageRef = ref.child("_messagesAll");
var participantRef = ref.child("Participant");
var counterRef = ref.child("Counter");
var phoneRef = ref.child("_phone");
var utilRef = ref.child("_util");
var jobRef = ref.child("Jobs");
var recordRef = ref.child("_records");
var recordDateRef = ref.child("Record");
var numbersRef = ref.child("_numbers");
var accountsRef = ref.child("_accounts");
var materialsRef = ref.child("Materials");

var from_base_number = '18033390911';


function incrementRef(ref,units){
  var amt = parseInt(units) || 1;
  ref.transaction(function(current){
    if(current == null) current = amt;
    else current += amt;
    return current;
  });
}
function addRef(ref,units){
  var amt = parseFloat(units) || 1;
  ref.transaction(function(current){
    if(current == null) current = amt;
    else current += amt;
    return current;
  });
}
function subtractRef(ref,units){
  var amt = parseFloat(units) || 1;
  ref.transaction(function(current){
    if(current == null) current = amt;
    else current -= amt;
    return current;
  });
}

/********* EXPORTED Functions ***************/

module.exports = {
  // Important info
  info: info,
  getConfig: getConfig,
  config: getConfig(),

  // SMS service
  sms: sms,
  send_sms: sms.send,
  respond_sms: sms.respond,
  send_sms_by_id: sms.send_by_id,
  buyNumber: buyNumber,
  loadAccount: loadAccount,

  jobChange: job_change,

  // Utilities
  lookUpUser: lookUpUser,
  lookUpJobs: lookUpJobs,
  addTime: addTime,
  getArrayBy: getArrayBy,
  getArrayByPromise: getArrayByPromise,
  getBlankPack: getBlankPack,
  storeToRecord: storeToRecord,
  waiting: waiting,
  notifyJob: notifyJob,
  calculateSubtotals: calculateSubtotals,
  getMaterialCosts: getMaterialCosts,
  timecardRecord: timecardRecord,

  //Firebase
  incrementCounter: incrementCounter,
  incrementRef: incrementRef,
  addRef: addRef,
  subtractRef: subtractRef,

  //Parser
  getHelp: getHelp,
  getHelpMat: getHelpMat,
  getHelpEx: getHelpEx,

  getJobs: getJobs,
  getCard: getCard,
  getLast5: getLast5,
  undoReport: undoReport,

  startTimer: startTimer,
  getTimer: getTimer,
  stopTimer: stopTimer,

  //Respond Text
  displayDate: displayDate,
  getText: getText,
  getCustomText: getCustomText,
  generateResponse: generateResponse,
  generateResponse2: generateResponse2

}


/* *********** Function Definitions ************ */

function getMaterialCosts(uid){
  var promise = new Promise(function(resolve,reject){
    materialsRef.child(uid).once("value",function(snap){
      if(snap.val() == null){
        reject("No data");
      }
      else{
        resolve(snap.val());
      }

    });

  });

  return promise;

}
function getLaborCosts(uid,partKey){
  var promise = new Promise(function(resolve,reject){
    participantRef.child(uid).child(partKey).once("value",function(snap){
      if(snap.val() == null){
        reject("No data");
      }
      else{
        resolve(snap.val());
      }

    });

  });

  return promise;

}



function calculateSubtotals(uid,record){
  console.log("[",uid,"] Calculate Subtotal :",record);  

  var promise = new Promise(function(resolve,reject){

    var pack = record.pack;
    var pack_total=0;
    //Has materials

    var mileage_cost = .50;

    getMaterialCosts(uid).then(function(costs){
      console.log("[",uid,"] Calculate Subtotal : Have material costs",costs);  
      getMaterials(costs);
    },function(err){
      getMaterials({});
    });
    
    function getMaterials(mat_costs){
      if(record.pack.materials){
        var keys = Object.keys(record.pack.materials);

        var mat_sub = 0;
        keys.forEach(function(key){
          var amount = pack.materials[key];
          console.log("Has",key,amount);
          var cost_pu = mat_costs[key] || config.materials[key].cost;
          pack.materials[key+'-pu'] = cost_pu;
          pack.materials[key+'-sub'] = cost_pu*amount;
          mat_sub += cost_pu*amount;
        })

        pack_total += mat_sub;
        pack['materials-sub']=mat_sub;
      }
      if(mat_costs['mileage']){
        mileage_cost = mat_costs['mileage'];
      }
      getLaborCosts(uid,record.participant.ID).then(function(part){
        //Have labor costs
      console.log("[",uid,"] Calculate Subtotal : Have labor costs",part.HourlyRate); 
        getInfo(part.HourlyRate);  
      },function(err){
        //No data
        getInfo();  
      });
      
    }

    function getInfo(labor_cost){
      if(record.pack.info){
        //Calculate info subtotal, already in dollars
        var keys = Object.keys(record.pack.info);

        var info_sub = 0;
        keys.forEach(function(key){
          var amount = pack.info[key];
          var total = amount;

          if(key == 'labor'){
            // Get labor cost
            var cost_pu = labor_cost || 15 ;
            pack.info[key+'-pu'] = cost_pu;
            pack.info[key+'-sub'] = cost_pu*amount;
            total = cost_pu*amount;
          }
          if(key == "mileage"){
            pack.info[key+'-pu']=mileage_cost;
            pack.info[key+'-sub'] = mileage_cost*amount;
            total = mileage_cost*amount;
          }


          info_sub += total;
        })

        pack_total += info_sub;
        pack['info-sub']=info_sub;
      }
      finish();
    }

    function finish(){

      pack['total'] = pack_total;


      console.log("[",uid,"] Calculate Subtotal : Finished Record :",record);  

      resolve(record);
    }

  });

  return promise;
}

function notifyJob(uid,jobKey,number,text){
  console.log("[ bTXT ] Notify job :",jobKey,":",text);

  jobRef.child(uid).child(jobKey).child("Participants").once("value",function(snap){
    snap.forEach(function(part){

      console.log(part.key(),part.val());
      sms.send_by_id(uid,part.key(),text,number);

    });

  });


}

function loadAccount(uid,auth_id){
  console.log("[ bTXT ] Load Account",uid,auth_id);
  return sms.account_detail(auth_id).then(function(obj){
    console.log("[ bTXT ] Load Account : Found Account details!!");

    accountsRef.child(uid).update(obj);


  },function(err){
    //failure
    console.log("Unable to load account details",err);
    return "Unable to load account details";
  }).catch(function(err){
    //error
    console.log("ERROR finding account details",err);
  });

}

function loadNumber(number,uid){
  return sms.number_details(number).then(function(obj){
    //succcess
    console.log("[ bTXT ] Load Number : Found number details!!",obj);
    if(!uid){
      obj.owner = "BudgetText";
    }
    else{
      obj.owner = uid;
    }
    console.log("[ bTXT ] Load Number : Found owner!!",obj.owner);


    // Load into firebase
    getArrayByPromise(numbersRef,"resource_uri",obj.resource_uri).then(function(obj,id){
        //success, update current info
        console.log("[ bTXT ] Load Number : Update number detail : ",obj.number); 
        numbersRef.child(id).update(obJ);
      },function(err){
        //failure, add to numbers ref
        console.log("[ bTXT ] Load Number : Add new  number :",obj.number);
        numbersRef.push(obj);
    });

    return obj;
  }, function(err){
    //failure
    console.log("Unable to procure number",err);
    throw err;
  }).catch(function(err){
    //error
    console.log("ERROR finding number details",err);
    throw err;
  });

}


function buyNumber(area_code,uid){
  return sms.getNumber(area_code).then(function(obj){
    //success
    console.log("Got number!!");
    loadNumber(obj.numbers[0].number,uid);
    return obj;
  }, function(err){
    //failure
    console.log("Unable to procure number");
    throw err;
  }).catch(function(err){
    //error
    console.log("ERROR buy number",err);
    throw err;
  });
}

var count_waiting=0;
function waiting(tag){
  var add= tag || "";
  console.log(' '+info.getWaitingLine(count_waiting)+' '+add);

  count_waiting+=1;
}


function job_change(uid,jobKey,participantKey,text){
  
  jobRef.child(uid).child(jobKey).once("value",function(snap){
    var jobKey = snap.key();
    var jobVal = snap.val();
    var phone = jobVal.Phone.Number;

    look(phone);
  })

  function look(number){

    lookUpJobs(uid,participantKey,number).then(function(jobList){
      //console.log("Found Jobs",jobList);
      if(jobList.length>1){
        text += "\n\nJob List:";
        jobList.forEach(function(job,index){
          text += "\n"+String(index+1)+": "+job.Name; 
        });

        if(jobList.length>2){
          text += "\n\nUse job and number to tag inline";
          text += "\ni.e. add 'job 2' to text";
          text += "\n\n * '8hr job 2'";
        }
      }
      //text += "\nType 'jobs' to see current job list";
      sms.send_by_id(uid,participantKey,text,number).then(function(){
        console.log("Jobchange promise");
      })
      .catch(function(err){
        console.log("Error during job change message",err);
      });
    },function(err){
      console.log("Couldn't Find Jobs",err);
      // Not a problem, may not have any jobs.
      sms.send_by_id(uid,participantKey,text);
    }).catch(function(err){
      console.log("Look up ERROR in JobChange",err);
    });  
  }
}; 

function incrementCounter(uid,direction,units){
  var year = moment().format('YYYY');
  var month = moment().format('YYYY-MM');
  var day = moment().format('YYYY-MM-DD');
  var hour = moment().format('YYYY-MM-DD-HH');
  //console.log(year,month,day,hour)
  incrementRef(counterRef.child(uid).child("year").child(year).child(direction),units);
  incrementRef(counterRef.child(uid).child("month").child(month).child(direction),units);
  incrementRef(counterRef.child(uid).child("day").child(day).child(direction),units);
  incrementRef(counterRef.child(uid).child("hour").child(hour).child(direction),units);
  incrementRef(counterRef.child(uid).child("total").child(direction),units);

  return true;
}



function lookUpUser(number){
  console.log("LOOK UP USER");
  var promise = new Promise(function(resolve,reject){
    phoneRef.child(number).once("value",function(snap){
      resolve(snap.val());
    });
  });

  return promise;
}

function lookUpJobs(uid,participantKey,phone){
  console.log('[bTXT] Look up job',uid,participantKey);


  var promise = new Promise(function(resolve,reject){
    console.log("in promise");
    participantRef.child(uid).child(participantKey).child('Jobs').once("value",function(snap){
      var jobKeyList = [];
      if(snap.val()==null){
        reject("No participant and/or job assigned");
      }

      snap.forEach(function(jobSnap){
        //console.log('jobs',jobSnap.key(),jobSnap.val());
        jobKeyList.push(jobSnap.key());
      });
      
      var jobList = [];


      jobRef.child(uid).once("value",function(jobSnap){
        jobSnap.forEach(function(job){
          var jobKey = job.key();
          var jobVal = job.val();
          if(jobKeyList.indexOf(jobKey)>-1 && jobVal.Phone.Number==phone){
            jobVal.ID = jobKey;
            //console.log('push',job.key(),job.val());
            jobList.push(jobVal);
          }

        });

        resolve(jobList);
      });
    });

  });

  return promise;
}
function getArrayByPromise(ref,child,value){
  console.log("Get Array by Promise");
  var promise = new Promise(function(resolve,reject){
    ref.orderByChild(child).equalTo(value).once("value", function(snapshot) {

      console.log("Get Array by Promise",snapshot.val());
      if(snapshot.val() == null){
        reject("Could not find");
      }
      else{

        var ky = Object.keys(snapshot.val())[0]
        var obj = snapshot.val()[ky];

        console.log("Get Array by Promise",ky,snapshot.key());
        console.log("Get Array by Promise",obj,snapshot.val());

        resolve( obj, ky );
      }
    });
  });

  return promise;
}


function getArrayBy(ref,child,value,success,failure){
  ref.orderByChild(child).equalTo(value).once("value", function(snapshot) {
    if(snapshot.val() == null){
      failure();
    }
    else{
      var ky = Object.keys(snapshot.val())[0]
      var obj = snapshot.val()[ky];

      success( obj, ky );
    }
  });
}

function addTime(obj){
  obj.TimeStamp =moment().format();
  obj.InverseTime = -moment().tz('America/Denver').format('x');
  obj.Time = moment().tz('America/Denver').format('MMMM Do YYYY, h:mm:ss a');
  obj.Date = moment().tz('America/Denver').format('YYYY-MM-DD');

  return obj;
}

function getBlankPack(){
  var config = getConfig();

  var pack = {};
  _.keys(config).forEach(function(classKey){
    pack[classKey] = {};
    pack[classKey].parsed = false;
    _.keys(config[key]).forEach(function(key){
      pack[classKey][key] = null;
    });
  });
  pack.parsed = false;

  return pack;
}

function getHelp(){
  var config = getConfig();
  var infoKeys = Object.keys(config['info']);
  var commandKeys = Object.keys(config['command']);
  var text;

  //text = "B-Txt Help:\n\n"
  text = "Log by keyword\n";
  
  infoKeys.forEach(function(key){
      text += "- ";
      //text += key+":";
      config['info'][key].keywords.forEach(function(keyword){
          text +=" " + keyword;
      });
      text+="\n"
  }); 
  
  text += "\n* '5.25h 12tol 42mi'";
  text += "\n* '7.5h hours yesterday'\n\n";

  text += "Commands\n"
  var commands = [];
  commandKeys.forEach(function(key){
    var cm = config['command'][key];
    if(cm.command){
      //text += " - "+cm.command+": "+cm.description+"\n";
      commands.push(" '"+cm.command+"'");
    }
  });

  text += commands.join("\n")
  
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
  var text = "Contact Card:\n\n";
  text += "https://s3-us-west-2.amazonaws.com/card-budget-text/card.vcf";

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

var timecardObject = {
  "labor": "pack.info.labor",
  "labor-sub": "pack.info.labor-sub"
};

//Takes store object and returns a record
function timecardRecord(store){
  var record = {}

  var keys= Object.keys(timecardObject);
  console.log("Timecard Record",keys);

  keys.forEach(function(key){
    var prop = timecardObject[key];
    if(_.has(store,prop)){
      var value = _.get(store,prop);
      _.set(record,key,value);
    }
  });


  console.log("Timecard Record",record);
  return record;
}



function getConfig(){
  var config = {
    "command": {
      "help":{
        "name": "Help",
        "parser": "command",
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
        "keywords": ["jobs","job","job list", "jobs list"],
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
        "keywords": ["hardware","hw"],
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
        "cost": "0.107",
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
        "cost": "0.59",
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
        "cost": "2.42",
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
        "cost": "1.69",
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
        "cost": "2.42",
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
