
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

    this.calls = function(args) {
        S.extendPrototype();
        var words = knwl.words.get('words'); //get the String as an array of words
        var linkWords = knwl.words.get('linkWords'); //get the String as an array of words
        var str = knwl.words.get('str'); //get the String as an array of words
        config=args[1];
        store=args[2];

        console.log("[ Parser ] Command : "+config.name+" : Incoming:",str);


        var results = {
            str: str,

            list: []

        };

        var match = false;

        config.keywords.forEach(function(keyword){
            if(str.toLowerCase() == keyword){
                match = true;
                if(store){
                    results.value = config.response(store);
                    if(keyword == "undo"){
                        console.log("Undo Report");
                        //results.value = "Removing Last Report, please wait.";
                        results.value = "dontsend";
                    }
                    if(keyword =="last5"){
                        results.value="dontsend";
                    }
                    if(keyword =="history"){
                        results.value="dontsend";
                    }
                    if(keyword =="hist"){
                        results.value="dontsend";
                    }
                }
                else{
                    results.value = config.response();
                }
            }
        });

        S.restorePrototype(); //be a good citizen and clean up
        return results;
    };
}

module.exports = Command;