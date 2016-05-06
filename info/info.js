//Randomizer
var Chance = require('chance');
var chance = new Chance();
var _ = require('lodash');

//Bot
var cleverbot = require("cleverbot.io"),
   bot = new cleverbot('thvefv680FXp37Uw','Jtgk4VXcm8s3pwBEYG3eCBPgLxtrHf2A');

var compliments = require("./compliments.json"); 
var insults = require("./insults.json");
var occupations = require("./occupations.json");
var drawings = require("./drawings.json");


/* calcs */

var length_drawings = drawings.length;
function getLength(array){ return array.length; }
var sublength_drawings = _.map(drawings, getLength);
var cumlength_drawings = sublength_drawings.reduce(function(r, a) {
  if (r.length > 0)
    a += r[r.length - 1];
  r.push(a);
  return r;
}, []);
var totallength_drawings = _.sum(sublength_drawings);

/*console.log('length',length_drawings);
console.log('sublength',sublength_drawings);
console.log('cumlength',cumlength_drawings);
console.log('totallength',totallength_drawings);
*/
function getX(count) {
  var x=0;
  while(count>=cumlength_drawings[x]){
    x++;
  }
  return x;
}
function getY(count,x){
  var prevLength = cumlength_drawings[x-1] || 0;
  return count - prevLength;
}


/* *********** Exported Functions ************ */

module.exports = {
	// Data Sources
	compliments: compliments,
	insults: insults,
	occupations: occupations,

	// Return random element
	getCompliment: getCompliment,
	getInsult: getInsult,
	getOccupations: getOccupations,
	askBot: askBot,
	getName: getName,
  getWaitingLine: getWaitingLine
}

function getWaitingLine(count){
  var real = count % totallength_drawings;
  var x = getX(real);
  var y = getY(real,x);
  //console.log(count);
  //console.log(x,y);

  return drawings[x][y];
}

function getCompliment(){
  var comp = chance.integer({min: 0, max: compliments.length-1});
  return compliments[comp];
}

function getOccupations(){
	var randInt = chance.integer({min: 0, max: occupations.length-1 });
	return occupations[randInt];	
}

function getInsult(){
  var text = "";
    if( chance.bool()){
      //generate from 3 strings
      var one = chance.integer({min: 0, max: insults.one.length-1 });
      var two = chance.integer({min: 0, max: insults.two.length-1 });
      var three = chance.integer({min: 0, max: insults.three.length-1 });

      text = "Well you know what, you are a "+insults.one[one] + " " + insults.two[two] + " " + insults.three[three];
    }
    else{
      //take random full
      //find length
      var comp = chance.integer({min: 0, max: insults.full.length });
      text = insults.full[comp]; 
    }
  return text;
}

function getName(){
	return chance.name({prefix: true});
}

function askBot(nick, text, callback){
  bot.setNick(nick);
  bot.create(function (err, session) { });

  bot.ask(text, function (err, response) {
  	callback(err,response);
  });
}