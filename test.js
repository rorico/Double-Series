const fs = require("fs");

const NUM_TESTS = 1000;

var data = [];

for (var num = 1 ; num <= 5 ; num++) {
    data[num] = [];
    for (var double = 0 ; double <= num ; double++) {
        data[num][double] = [];
        for (var tot = 1 ; tot <= 108 ; tot++) {
            var deck = [];
            var all = tot;
            for (var i = 0 ; i < tot ; i++) {
                if (i < num) {
                    if (i < double) {
                        all++;
                        deck.push(i);
                        deck.push(i);
                    } else {
                        deck.push(i);
                    }
                } else {
                    deck.push(i);
                }
            }

            var res = [];
            for (var i = 0 ; i < NUM_TESTS ; i++) {
                deck = shuffle(deck);
                var seen = [];
                var cnt = 0;
                for (var j = 0 ; j < deck.length ; j++) {
                    var card = deck[j];
                    if (card < num) {
                        if (!seen[card]) {
                            cnt++;
                            if (cnt === num) {
                                res.push(j + 1);
                                break;
                            }
                        }
                        seen[card] = true;
                    }
                }
            }
            var avrg = avg(res);
            data[num][double][all] = avrg;
            console.log(num,double,all,avrg);
        }
    }
}
fs.writeFile("test.json",JSON.stringify(data,null,4));


//shuffle deck
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function avg(arr) {
    if (!arr.length) {
        return;
    }
    cnt = 0;
    for (var i =0 ;  i  < arr.length ; i++) {
        cnt += arr[i];
    }
    return cnt / arr.length;
}