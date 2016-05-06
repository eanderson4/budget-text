
var S = require('string');

var btxt = require('../budget_text.js');
var config = btxt.getConfig();



function getWordNumber(str,words,index){
    var j = 0;
    var count=0;
    for(i=0; i<words.length;i++){
        //console.log(i,j,count,words[i].length,words[i]);
        if(index>=count){
            j=i;
        }
        count = count + words[i].length+1;
        //console.log(i,j,count,words[i].length,words[i]);
    }

    return j;
}

function isNum(string){

    return /^\d*\.?\d*$/.test(string);
}


function Command(knwl) {

    this.languages = { //supported languages
        english: true   
    };

    this.calls = function() {
        S.extendPrototype();
        var words = knwl.words.get('words'); //get the String as an array of words
        var linkWords = knwl.words.get('linkWords'); //get the String as an array of words
        var str = knwl.words.get('str'); //get the String as an array of words

        console.log("[ Parser ] Command : Help : Incoming:",str);

        var needHelp = false;
        var needHelpEx = false;
        var help = null;
        var compliment = null;
        var insult = null;


        var results = {
            str: str,

            list: []

        };

        words.forEach(function(word,index){
            if(word == "help"){
                results.help = config.command.help.response();
            }
            if(word == "ex"){
                results.help = config.command.help_ex.response();
            }
            if(word == "compliment" || word=="comp"){
                results.compliment = btxt.info.getCompliment();
            }
            if(word == "insult"){
                results.insult = btxt.info.getInsult();
            }

        });


        S.restorePrototype(); //be a good citizen and clean up
        return results;
    };
}

module.exports = Command;