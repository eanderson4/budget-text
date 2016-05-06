var btxt = require("./budget_text.js");
var Knwl = require("knwl.js");
var moment = require("moment-timezone");

var text =  process.argv[2] ||"8hr tuesday";

//Parser
var knwlInstance = new Knwl('english');
  knwlInstance.register('info', require('./parser/p_info.js'));
  knwlInstance.register('command', require('./parser/p_command.js'));
  knwlInstance.register('chrono', require('./parser/p_chrono.js'));

        //Prep parser
knwlInstance.init(text);


var currentTime = moment('2016-04-21 9:30').tz('America/Los_Angeles');
//var currentTime = moment('2013-02-08 09:30');
console.log("Current Time:",currentTime.format());

//Meta data
console.info("[p] Looking for meta data");
var chrono = knwlInstance.get('chrono',currentTime);
if(chrono.date){
    console.log("[ bTXT ] Message Received : Has Date!",chrono.date);
   	console.log("formated date",moment(chrono.date).format());
}


process.exit();
