
var S = require('string');
var _ = require("lodash");



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

function testMatch(words,word,keyword,index,units){
    //Attempt chomp  
    if(isNum(S(word).chompRight(keyword)) && S(word).chompRight(keyword).length >0){
        return "chompright";
    } 
    if(isNum(S(word).chompLeft(keyword)) && S(word).chompLeft(keyword).length >0){
        return "chompleft";
    }


    //Get neighboring words
    var leftIndex = index - 1;
    var leftNumeric=false;
    if(leftIndex>= 0){
        var left = words[leftIndex];
        leftNumeric=left.isNumeric();
    }
    var leftUnitNumeric =false;
    var leftIndex2 = index - 2;
    if(leftIndex2>=0){
        //Check if left word is 'units'
        units.forEach(function(unit){
            //compare units with word (remove all plural)
            if(words[leftIndex].chompRight("s").s==unit.chompRight("s").s){
            //if(words[leftIndex].chompRight("s")==unit.chompRight("s")){
                if(words[leftIndex2].isNumeric()){
                    console.log("This is quite the find");
                    leftUnitNumeric=true;
                }
            }
        })
    }
    var rightIndex = index + 1;
    var rightNumeric=false;
    if(rightIndex< words.length){
        var right = words[rightIndex];
        rightNumeric=right.isNumeric();
    }

    if(leftNumeric && rightNumeric){
        return "both";
    }
    else if(leftNumeric){
        //left numeric
        return "matchleft"
    }
    else if(rightNumeric){
        //left numeric
        return "matchright"
    }
    else if(leftUnitNumeric){
        return "matchleftunit"
    }
    else{
        return "Not a match";
    }
}


function Info(knwl) {

    this.languages = { //supported languages
        english: true   
    };

    this.calls = function(config) {
        S.extendPrototype();
        var words = knwl.words.get('words'); //get the String as an array of words
        var linkWords = knwl.words.get('linkWords'); //get the String as an array of words
        var str = knwl.words.get('str'); //get the String as an array of words
        config = config[1];
        var keywords = config.keywords;
        var units = config.units || [];

        //console.log("[ Parser ] Info: Config:",config);
        console.log("[ Parser ] Info : "+config.name+" : Incoming :",str);

        //Cleaning
        //always remove commas
        for(i=0;i<words.length;i++){
            //console.log(words[i],linkWords[i]);
            linkWords[i] = S(linkWords[i]).replaceAll(',','').s;
            words[i] = S(words[i]).replaceAll(',','').s;
            //console.log(words[i],linkWords[i]);
        }
        if(config.strip){
            //console.log("strip-a",config.strip);
            config.strip.forEach(function(strip){
            //console.log("strip-s",strip);
                for(i=0;i<words.length;i++){
                    //console.log(words[i],linkWords[i]);
                    linkWords[i] = S(linkWords[i]).replaceAll(strip,'').s;
                    words[i] = S(words[i]).replaceAll(strip,'').s;
                    //console.log(words[i],linkWords[i]);
                }
            }); 
            //console.log("strip-z",words); 
        } 
        var drop = ['for','of','on'];
      
        words = _.remove(words,function(word){
            var test = false;
            drop.forEach(function(d){
                if(d==word){                    
                    test = true;
                }
            });

            return !test;
        });
        linkWords = _.remove(linkWords,function(word){
            var test = false;
            drop.forEach(function(d){
                if(d==word){
                    test = true;
                }
            });

            return !test;
        });
        // End Clean


        var value = null;
        var match = null;

        words.forEach(function(word,index){
            //Check for match on labor keywords
            var currentLink = linkWords[index];
            var currentWord = words[index];
            var hopeful = currentLink.replace(/[^a-zA-Z]/g, '');
            //console.log('here',currentLink,currentWord,hopeful);

            keywords.forEach(function(keyword){

                var testRight = (isNum(S(currentLink).chompRight(keyword)) &&  S(currentLink).chompRight(keyword).s != S(currentLink).s ); 
                var testLeft = (isNum(S(currentLink).chompLeft(keyword)) &&  S(currentLink).chompLeft(keyword).s != S(currentLink).s ); 
                var test = testRight || testLeft;
              //  console.log('test',test);
                if((hopeful == keyword || test) && match == null){
                //if(currentLink.contains(keyword) && match == null){
                    console.log("[ Parser ] Info : "+config.name+" : Potential Match:", word, keyword,index);
                    switch(testMatch(words,currentLink,keyword,index,units)){
                        case "matchleft":
                            //numeric on left       
                            match = {};
                            match.type = "matchleft";
                            match.index = index;
                            match.keyword = keyword;
                            match.word = word;
                            match.wordNumber = linkWords[index-1];
                            match.number = match.wordNumber.toFloat();
                            value = match.number;
                            console.log("[ Parser ] Info : "+config.name+" : Successful Match: Match left:",value,match.wordNumber);                    
                            break;
                        case "matchleftunit":
                            //numeric on left with unit declaration
                            console.log("Match Left Unit");
                            match = {};
                            match.type = "matchleftunit";
                            match.index = index;
                            match.keyword = keyword;
                            match.word = word;
                            match.wordNumber = linkWords[index-2];
                            match.number = match.wordNumber.toFloat();
                            value = match.number;
                            console.log("[ Parser ] Info : "+config.name+" : Successful Match: Match left Unit:",value,match.wordNumber);                    
                            break;
                        case "matchright":
                            //numeric on right
                            match = {};
                            match.type = "matchright";
                            match.index = index;
                            match.keyword = keyword;
                            match.word = word;
                            match.wordNumber = linkWords[index+1];
                            match.number = match.wordNumber.toFloat();
                            value = match.number;
                            console.log("[ Parser ] Info : "+config.name+" : Successful Match: Match right:",value,match.wordNumber);                    
                            break;
                        case "both":
                            //numerics on both side, default convention is X        
                            match = {};
                            match.type = "both";
                            match.index = index;
                            match.keyword = keyword;
                            match.word = word;
                            match.wordNumber = linkWords[index-1];
                            match.number = match.wordNumber.toFloat();
                            value = match.number;
                            console.log("[ Parser ] Info : "+config.name+" : Successful Match: Match both:",value,match.wordNumber);                    
                            break;
                        case "chompleft":
                            //chomp left
                            match = {};
                            match.type = "chompleft";
                            match.index = index;
                            match.keyword = keyword;
                            match.word = word;
                            match.wordNumber = linkWords[index].chompLeft(keyword);
                            match.number = match.wordNumber.toFloat();
                            value = match.number;
                            console.log("[ Parser ] Info : "+config.name+" : Successful Match: Chomp left:",value,match.wordNumber);                    
                            break;
                        case "chompright":
                            //chomp left
                            match = {};
                            match.type = "chompright";
                            match.index = index;
                            match.keyword = keyword;
                            match.word = word;
                            match.wordNumber = linkWords[index].chompRight(keyword);
                            match.number = match.wordNumber.toFloat();
                            value = match.number;
                            console.log("[ Parser ] Info : "+config.name+" : Successful Match: Chomp right:",value,match.wordNumber);                    
                            break;
                        default:
                            //not a match
                            //console.log("Not a match");
                    }
                };
            });
        });

        var results = {
            str: str,
        };

        if(value) {
            console.log("[ Parser ] Info : "+config.name+" : Parsed:",value,config.units);
            results.value = value;
        }


        S.restorePrototype(); //be a good citizen and clean up
        return results;
    };
}

module.exports = Info;