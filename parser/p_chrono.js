
var S = require('string');
var chrono = require('chrono-node');

function getWordNumber(str,words,index){
    var j = 0;
    var count=0;
    for(i=0; i<words.length;i++){
        if(index>=count){
            j=i;
        }
        count = count + words[i].length+1;
    }

    return j;
}

function Chrono(knwl) {

    this.languages = { //supported languages
        english: true   
    };

    this.calls = function() {
        var words = knwl.words.get('words'); //get the String as an array of words
        var linkWords = knwl.words.get('linkWordsCasesensitive'); //get the String as an array of words
        var str = knwl.words.get('str'); //get the String as an array of words

        console.log("[ Parser ] Meta : Chrono : Incoming:",str);

        str = S(str).replaceAll('18/2','').s;
        str = S(str).replaceAll('22/2','').s;

        var parse = chrono.parse(str);
        var parseDate = chrono.parseDate(str);       

        var results = {
            date: parseDate,
            str: str,

            list: []

        };


        parse.forEach(function(p){
            var foundPosition = getWordNumber(str,linkWords,p.index);
            var result = {
                parse: p,
                preview: knwl.tasks.preview(foundPosition),
                found: foundPosition
            };
            results.list.push(result);
        });

        if(parseDate) {
            console.log("[ Parser ] Meta : Chrono : Parsed:",parseDate);
        }

        return results;
    };
}

module.exports = Chrono;