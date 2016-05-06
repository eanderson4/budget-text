

var Firebase = require("firebase");
var plivo = require('plivo');
var moment = require('moment-timezone');
var _ = require('lodash');
var p = plivo.RestAPI({
  authId: 'MAYZK0YMM3MTA2ZTIZOG',
  authToken: 'ZWM5ZGM0NzA1MzMwMGZhYTgwMmIzMjMyNDIyYTQx'
});



var ref = new Firebase("https://budgettext.firebaseio.com/");
var messageRef = ref.child("_messagesAll");
var phoneRef = ref.child("_phone");
var participantRef = ref.child("Participant");


var from_base_number = '18033390911';

/********** Internal Functions ************/
var nLength = function(n) { 
    return (Math.log(Math.abs(n)+1) * 0.43429448190325176 | 0) + 1; 
}


function logOutboundMessage(from_number,to_number,text,response){
  var store = {
    "MessageUUID": response['message_uuid'][0],
    "From": from_number,
    "To": to_number,
    "Response": response,
    "Direction": "outbound",
    "Text": text,
    "TimeStamp": moment().format(),
    "Time": moment().tz('America/Denver').format('MMMM Do YYYY, h:mm:ss a'),
    "Date" : moment().tz('America/Denver').format('YYYY-MM-DD')
  }
  store.InverseTime = -moment().format('x');

  console.log("[ bTXT ] Send_SMS: ", store.Text);

  messageRef.push(store);
}


/* *********** Exported Functions ************ */

module.exports = {
  send: send,
  respond: respond,
  send_by_id: send_by_id,
  getNumber: getNumber,
  number_details: number_details,
  remove_number: remove_number,
  create_account: create_account,
  account_detail: account_detail,
  remove_account: remove_account
}

function remove_account(auth_id){
  console.log('[ bTXT ] Delete Account : AuthID :', auth_id);
  // Create a sub account
  var params = {
    'subauth_id' : auth_id
  };

  var promise = new Promise(function(resolve,reject){
    p.delete_subaccount(params, function (status, response) {
      console.log('[ bTXT ] Delete Account : Status :', status);
      if(status>=300){
        console.log('[ bTXT ] Delete Account : Failed',response);
        reject("Could not create account");
      }
      //console.log('API Response:\n', response);

      resolve(response);
      
    });
  });
  return promise;
}

function account_detail(auth_id){
  console.log('[ bTXT ] Account Detail : AuthID :', auth_id);
  // Get details of a single subaccounts
  var params = {
    'subauth_id' : auth_id, // Auth ID of the sub acccount for which the details have to be retrieved
  };

  var promise = new Promise(function(resolve,reject){
    p.get_subaccount(params, function (status, response) {      
      console.log('[ bTXT ] Account Detail : Status :', status);
      if(status>=300){
        console.log('[ bTXT ] Account Detail : Failed',response);
        reject("Could not get account detail");
      }
      //console.log('API Response:\n', response);

      resolve(response);
    });
  }); 
  return promise;
}

function create_account(name){
  console.log('[ bTXT ] Create Account : Name :', name);
  // Create a sub account
  var params = {
    'name' : name, // Name of the subaccount
    'enabled' : 'True' // Specify if the subaccount should be enabled or not
  };

  var promise = new Promise(function(resolve,reject){
    p.create_subaccount(params, function (status, response) {
      console.log('[ bTXT ] Create Account : Status :', status);
      if(status>=300){
        console.log('[ bTXT ] Create Account : Failed',response);
        reject("Could not create account");
      }
      //console.log('API Response:\n', response);

      resolve(response);
      
    });
  });
  return promise;
}

function number_details(number){
  var params = { 
      'number' : number // Phone number for which the details have to be retrieved
  };

  var promise = new Promise(function(resolve,reject){

    p.get_number_details(params, function (status, response) {
      console.log('[ bTXT ] Get Number Details: Status: ', status);
        if(status>=300){
          console.log('API Response:\n', response);
          reject("Could not find number details");  
        }
        resolve(response);
    });
  });

  return promise;
}

function remove_number(number){

  var params = { 
      'number' : number, // Number that has to be unrented
  };

  var promise = new Promise(function(resolve,reject){
    p.unrent_number(params, function (status, response) {
        console.log('[ bTXT ] Remove Number : Status: ', status);
        if(status >= 300){
          console.log('API Response:\n', response);
          reject("Could not remove number");  
        }
        resolve(response);        
    });
  });
  return promise;
}

function getNumber(area_code){
  var ac = area_code || '608';
 // Search for new number
  var params = { 
      'country_iso': 'US', // The ISO code A2 of the country
      'type' : 'local', // The type of number you are looking for. The possible number types are local, national and tollfree.
      'pattern' : ac, // Represents the pattern of the number to be searched. 
      'services': 'sms'
  };


  var getNumber = new Promise(function(resolve,reject){  
    p.search_phone_numbers(params, function (status, response) {
      console.log('[ bTXT ] Get Number : Status: ', status);
      if (status>=300) {
        //error
        reject("Did not find a number");
      }
    //  console.log('[ bTXT ] get number : API Response :\n', response);

      resolve(response.objects);
    });
  });


  var buyNumber = function(number){

    console.log('[ bTXT ] Buy Number : Number: ', number);
    var promise = new Promise(function(resolve,reject){
      p.buy_phone_number({'number':number}, function (status, response) {
        console.log('[ bTXT ] Buy Number : Status: ', status,response);
        if (status>=300) {
          //error
          reject("Could not buy the number",response);
        }

        resolve(response);

      });
    });
    return promise;
  }

  var buy = getNumber.then(function(numbers){
    var list = _.map(numbers,'number');
    console.log('[ bTXT ] Buy Number : Numbers list :\n', list.join(", ") );

    var choose = Math.floor( (Math.random() * list.length) + 1);
    
    return buyNumber(list[choose]);
  });
  return buy;
}

function send(src,dst,text){
 var params = {
    'src': src, // Sender's phone number with country code
    'dst' : dst, // Receiver's phone Number with country code
    'text' : text, // Your SMS Text Message - English
    'url' : "http://devapi.budget-text.com/v1/sms_report/", // The URL to which with the status of the message is sent
    'method' : "GET" // The method used to call the url
  };

    
  var promise = new Promise(function(resolve,reject){  
    if(nLength(src)<10 || nLength(dst)<10){
      reject("Phone number to short");
    } 

    p.send_message(params, function (status, response) {
      response.params = params;
      response.status = status;

      if (response.status>=400) {
        //error
        console.log("[ bTXT ] Send SMS: ", response.status);
        throw new Error("Did not queue a message");
      }
      
      //Log outbound message
      logOutboundMessage(src,dst,text,response);

      resolve(response);
    });
  });

  return promise;

};

function respond(from_number,to_number,text){
  return send(to_number,from_number,text);
}



function send_by_id(uid,participantKey,text,number){

    var useNumber = number || from_base_number;

    participantRef.child(uid).child(participantKey).once("value",function(partSnap){
      if(partSnap.val() == null){
        throw new Error("Could not find participant");
      }
      var part = partSnap.val();
      if(_.has(part,"Phone.Number")){     
        return send(useNumber,part.Phone.Number,text);
      }
    });  
}