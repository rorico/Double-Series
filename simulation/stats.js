const newGame = require("../game");
const fs = require("fs");
const newHelper = require("../boardHelper");

var file = process.argv[2];
fs.readFile(file,function(err,data) {
    if (err) {
        console.err(err);
        return;
    }
    var info = JSON.parse(data);
    var helper = newHelper();
    var plusJdiff = {};
    var minusJdiff = {};
    for (var j = 0 ; j < info.length ; j++) {
        var val = info[j];

        var teams = [1,3];
        var teamCards = [[]];

        for (var i = 0 ; i < teams.length ; i++) {
            teamCards[teams[i]] = [];
        }

        var cardsPlayed = val.cardsPlayed;
        for (var i = 0 ; i < cardsPlayed.length ; i++) {
            var card = cardsPlayed[i];
            var team = helper.getTeam(card.player);
            if (teamCards[team][card.cardPlayed]) {
                teamCards[team][card.cardPlayed]++;
            } else {
                teamCards[team][card.cardPlayed] = 1;
            }
        }

        var winner = val.winner;
        if (winner) {
            var op = 4 - winner;

            var diff = (teamCards[winner][0]||0) - (teamCards[op][0]||0);
            plusJdiff[diff] = plusJdiff[diff]+1 || 1;
            var diff = (teamCards[winner][-1]||0) - (teamCards[op][-1]||0);
            minusJdiff[diff] = minusJdiff[diff]+1 || 1;
        }
    }
    console.log("+J diff vs wins",plusJdiff);
    console.log("-J diff vs wins",minusJdiff);
});