var helpers = require("./playHelper.js");
var constants = require("../constants");

var calc; 
var base;
(function() {
    //from various tests, it turns out that chance of getting n cards out of m cards,
    //where x cards have two in the deck follows a formula of (m+1)*c, where c is a constant.
    //I don't quite know how this is the case, but it looks like it.
    var data = [];
    //for jokers case, will only be 3 or 4, won't be counted towards double, but will towards num
    //if two jokers, just treat as normal and pass 0 for joker
    calc = function(num,double,joker,tot) {
        console.log(joker);
        if (!joker) {
            joker = 0;
        }
        if (!data[joker]) {
            data[joker] = [];
        }
        if (!data[joker][num]) {
            data[joker][num] = [];
        }
        if (data[joker][num][double]) {
            return data[joker][num][double] * (tot + 1);
        }

        var ret = 1;
        if (!num) {
            ret = 0;
        } else {
            // pick up neither
            var chance = (tot - num - double)/tot;
            if (chance > 0) {
                ret += chance * calc(num,double,joker,tot-1);
            }

            // pick up card with two copies
            var chance = 2 * double/tot;
            if (chance > 0) {
                ret += chance * calc(num-1,double-1,joker,tot-1);
            }

            // pick up card with one copy   
            var chance = (num - double - (joker ? 1 : 0))/tot;
            if (chance > 0) {
                ret += chance * calc(num-1,double,joker,tot-1);
            }

            // pick up joker   
            var chance = joker/tot;
            if (chance > 0) {
                ret += chance * calc(num-1,double,0,tot-1);
            }

            data[joker][num][double] = ret/(tot + 1);
        }
        return ret;
    }
    base = function(num,double,joker) {
        calc(num,double,joker,num + double + joker);
        if (!num) {
            return 0;
        } else {
            return data[joker][num][double];
        }
    }
})();


var playProb = module.exports = function(info) {
    var helper = helpers(info.board,info.points);
    var getOptions = helper.getOptions;
    var cardOptions = helper.cardOptions;
    var hasAdd = helper.hasAdd;
    var hasRemove = helper.hasRemove;
    var hasOnlyJ = helper.hasOnlyJ;
    var hasOnlyRemoveJ = helper.hasOnlyRemoveJ;
    var addJoptions = helper.addJoptions;
    var removeJoptions = helper.removeJoptions;
    var hasUselessCard = helper.hasUselessCard;
    var addJ = helper.addJ;
    var removeJ = helper.removeJ;

    var offensive = true;
    var me = info.player;
    var team = info.team;
    var hand = info.hand;
    var board = info.board;
    var points = info.points;

    var bestLines = [];
    var turnsToFinish = Infinity;
    var linesPartialDone = [];

    var teams = [1,3];      //list of teams, may change in future
    var possible = [];      //list of all lines
    var references = [];    //holds all possible lines given x,y ; returns indexes
    var cardsToFinish = []; //organizes lines based on how many left to finish for each team
    var cardsLeft = [];     //cards left of every card
    var totCardsLeft;
    var numPlusJ;
    var numMinusJ;

    var turnsToWin = [];

    probSetup();
    //game could already be started
    if (hand) {
        onNewGame(info);
    }

    return {
        play:playProb,
        onPlay:onPlay,
        onNewGame:onNewGame
    };

    function onPlay(play) {
        //console.log(play);
        cardsLeft[play.card]--;
        totCardsLeft--;
        if (play.player === me) {
            cardsLeft[play.newCard]--;
            if (play.newCard === 0) {
                numPlusJ++;
            }
            if (play.cardPlayed === 0) {
                numPlusJ--;
            }
        }
        updatePlay(play);
    }

    function updatePlay(play) {
        if (play.action === constants.PLAY_FINISH) {
            for (var i = 0 ; i < play.finishedLines.length ; i++) {
                var line = play.finishedLines[i];
                for (var j = 0 ; j < line.length ; j++) {
                    updatePosition(line[j],play.action,play.team);
                }
            }
        }
        //update everywhere that the card could be used
        var card = play.cardPlayed;
        if (card === 0 || card === -1) {
            updatePosition(play.position,play.action,play.team);
        } else {
            var options = cardOptions(play.cardPlayed);
            for (var i = 0 ; i < options.length ; i++) {
                updatePosition(options[i],play.action,play.team);
            }
        }
    }

    function onNewGame(info) {
        //console.log(info)
        hand = info.hand;
        //starting at higher # is slightly faster
        for (var i = 49 ; i >= 2 ; i--) {
            cardsLeft[i] = 2;
        }
        cardsLeft[1] = 4;
        cardsLeft[0] = 4;
        cardsLeft[-1] = 4;
        totCardsLeft = 108;
        for (var i = 0 ; i < hand.length ; i++) {
            var card = hand[i];
            cardsLeft[card]--;
            totCardsLeft--;
            if (card === 0) {
                numPlusJ++;
            }
        }

        for (var i = 0 ; i < teams.length ; i++) {
            var team = teams[i];
            linesPartialDone[team] = [];
            turnsToWin[team] = Infinity;
            cardsToFinish[team] = [];
            for (var j = 0 ; j < 5 ; j++) {
                cardsToFinish[team] = [];
            }
            for (var j = 0 ; j < possible.length ; j++) {
                var p = possible[j];
                p.turnsToFinish[team] = Infinity;
                p.cardsToFinish[team] = 5;
                cardsToFinish[5] = j;
            }
        }
        //console.log(me,linesPartialDone);
    }

    function updatePosition(pos,action,team) {
        //console.log("update")
        //remeber to update team
        var x = pos[0];
        var y = pos[1];
        var card = board[x][y];
        var refs = references[x][y];
                //console.log("ref",refs)
        for (var i = 0 ; i < teams.length ; i++) {
            var curTeam = teams[i];
            //console.log("team",curTeam);
            //what the place has been turned into
            for (var j = 0 ; j < refs.length ; j++) {
                var line = possible[refs[j]];
                calcTurnsToFinish(line,curTeam);
            }
            var turnsToWinParts = [];
            var partial = linesPartialDone[curTeam];
            for (var j = 0 ; j < partial.length ; j++) {
                var cardsNeeded = j;
                var totCards = totCardsLeft;
                if (curTeam === team) {
                    cardsNeeded -= numPlusJ;
                } else {
                    //totCards - 7;
                }
                var thusPartial = partial[j];
                //console.log("thusPartial[",j,"]",thusPartial)
                turnsToWinParts.push(thusPartial ? thusPartial * Math.pow(totCardsLeft,j) : Infinity);
            }
            //console.log("turns to win", turnsToWinParts)
            turnsToWin[curTeam] = addTurnsToWin.apply(null,turnsToWinParts);
            //console.log(turnsToWin)
        }
    }

    function calcTurnsToFinish(line,curTeam) {
        //console.log("line",me,curTeam,team)
        //this can be optimized
        var start = line.position;
        var dir = line.direction;

        var turnsToFinish = 0;
        var cardsToFinish = 0;

        var cardsNeeded = {};
        var numNeeded = 0;
        function addToNeeded(card) {
            cardsNeeded[card] = cardsNeeded[card] ? numNeeded++, 1 : cardsNeeded[card] + 1;
        }

        for (var j = 0 ; j < 5 ; j++) {
            var x = start[0] + j*dir[0];
            var y = start[1] + j*dir[1];
            var point = points[x][y];
            if (point === 0) {
                //nothing there
                //calculate below
            } else if (point === curTeam) {
                //my team, doesn't add
                continue;
            } else if (point % 2 === 1) {
                addToNeeded(-1);
            } else {
                //completed line on either team
                return;
            }

            var cardNeeded = board[x][y];
            addToNeeded(cardNeeded);
        }

        //only for me, change later
        for (var card in cardsNeeded) {
            for (var i = 0 ; i < hand.length ; i++) {
                if (hand[i] === cardsNeeded[card]) {
                    cardsNeeded[card]--;
                    if (!cardsNeeded[card]) {
                        delete cardsNeeded[card];
                    }
                }
            }
        }

        for (var card in cardsNeeded) {
        }

        var partial = linesPartialDone[curTeam];
        //console.log("calc",team,linesPartialDone,partial,cardsToFinish,turnsToFinish)
        //return {cards:cardsToFinish:turns:turnsToFinish};
        var prevCards = line.cardsToFinish[curTeam];

        partial[prevCards] = changeTurnsToWin(partial[prevCards] || Infinity,line.turnsToFinish[curTeam],Infinity);
        partial[cardsToFinish] = changeTurnsToWin(partial[cardsToFinish] || Infinity,Infinity,turnsToFinish);
        //console.log("partial",partial,prevCards,cardsToFinish)

        line.cardsToFinish[curTeam] = cardsToFinish;
        line.turnsToFinish[curTeam] = turnsToFinish;

        function turnsToPickUp(card) {
            //i'm not sure if this is accurate, but it will do for now
            var cards = cardsLeft[card];
            if (cards) {
                // this number depends on how many cards there are remaining, but this changes, and is optimized out
                return 1 / (cards + 1);
            }
            return Infinity;
        }

        function turns(card) {
            return team === curTeam ? turnsME(card) : turnsThem(card);
        }

        function turnsME(card) {
            return inHand(card) ? 1 : turnsToPickUp(card);
        }

        function turnsThem(card) {
            return turnsToPickUp(card);
        }

        function inHand(card) {
            for (var i = 0 ; i < hand.length ; i++) {
                if (hand[i] === card) {
                    return true;
                }
            }
            return false;
        }
    }

    //turns add like resistors - reciprocal of sum of reciprocals
    function addTurnsToWin() {
        var sum = 0;
        for (var i = 0 ; i < arguments.length ; i++) {
            sum += 1/arguments[i];
        }
        return 1/sum;
    }

    function changeTurnsToWin(total,old,n) {
        return 1/(1/total - 1/old + 1/n);
    }

    function calcTurnsToWin() {
        for (var i = 0 ; i < possible.length ; i++) {
            for (var j = 0 ; j < possible.length ; j++) {
                return;
            }
        }
    }

    function playProb(hand,team,info) {
//console.log("TEST")
        //update probabilities
        //get best probability
        var min = Infinity;
        var minCard;
        var minPos;
        var minAction;

        //mock the play, then see the difference, revert
        for (var i = 0 ; i < hand.length ; i++) {
            var card = hand[i];
            var options;
            var to;
            var start;
            var fix;
            if (card === -1) {
                options = removeJoptions();
                to = 0;
                start = constants.PLAY_REMOVE;
                fix = constants.PLAY_ADD;
            } else if (card === 0) {
                options = addJoptions();
                to = team;
                start = constants.PLAY_ADD;
                fix = constants.PLAY_REMOVE;
                numPlusJ--;
            } else {
                options = cardOptions(card);
                to = team;
                start = constants.PLAY_ADD;
                fix = constants.PLAY_REMOVE;
            }
//console.log("options",options)

            for (var k = 0 ; k < options.length ; k++) {
                var option = options[k];
                var fixTo = points[option[0]][option[1]];
                points[option[0]][option[1]] = to;

                //remember to check for finishline stuff
                updatePosition(option,start,team);
                var turns = turnsToWin[team];
                points[option[0]][option[1]] = fixTo;
                updatePosition(option,fix,team);
//console.log("turns",turns)
                if (turns < min) {
                    min = turns;
                    minCard = i; //index of card
                    minPos = option;
                    minAction = start;
                }
            }
            if (card === 0) {
                numPlusJ++;
            }
        }
        return {action:minAction,card:minCard,position:minPos};
    }

    function turnsToPickUp(card) {
        //i'm not sure if this is accurate, but it will do for now
        var cards = cardsLeft[card];
        if (cards) {
            var cardsInOthers = 7*3;
            var cardsWillDraw = Math.floor(totCardsLeft/4);
            var otherCards = totCardsLeft - cardsWillDraw + cardsInOthers;
            return (totCardsLeft + cardsInOthers) / (cards + 1);
        }
        return Infinity;
    }

    function probSetup() {
        //note this is fairly non optimized, but only gets run once
        addPossible(1,1);
        addPossible(1,0);
        addPossible(0,1);
        addPossible(1,-1);
        for (var i = 0 ; i < 10 ; i++) {
            var temp = [];
            for (var j = 0 ; j < 10 ; j++) {
                temp.push([]);
            }
            references.push(temp);
        }
        for (var i = 0 ; i < possible.length ; i++) {
            var p = possible[i];
            var x = p.position[0];
            var y = p.position[1];
            var dirX = p.direction[0];
            var dirY = p.direction[1];

            for (var j = 0 ; j < 4 ; j++) {
                references[x + j*dirX][y + j*dirY].push(i);
            }
        }
        for (var i = 0 ; i < possible.length ; i++) {
            for (var j = i + 1 ; j < possible.length ; j++) {
                var shared = sharePoints(possible[i],possible[j])
                if (shared[0] > 2) {
                    possible[i].collisions.push(j);
                    possible[j].collisions.push(i);
                } else if (shared[0]) {
                    possible[i].singleCols.push(j);
                    possible[j].singleCols.push(i);
                }
                possible[i].sharedCards[j].push(shared[1]);
                possible[j].sharedCards[i].push(shared[1]);
            }
        }
        function sharePoints(line1,line2) {
            var cards = 0;
            var cnt = 0;
            for (var i = 0 ; i < 4 ; i++) {
                var x1 = line1.position[0] + i*line1.direction[0];
                var y1 = line1.position[1] + i*line1.direction[1];
                for (var j = 0 ; j < 4 ; j++) {
                    var x2 = line2.position[0] + i*line2.direction[0];
                    var y2 = line2.position[1] + i*line2.direction[1];
                    if (x1===x2 && y1===y2) {
                        cnt++;
                    } else if (board[x1][y2] && board[x2][y2]) {
                        cards.push(board[x1][x2]);
                    }
                }
            }
            return [cnt,cards];
        }
    }

    function addPossible(dirX,dirY) {
        for (var x = 0 ; x < 10 ; x++) {
            for (var y = 0 ; y < 10 ; y++) {
                if (!outOfBounds(x,y) && !outOfBounds(x + 4*dirX,y + 4*dirY)) {
                    //
                    var info = {
                        position:[x,y],
                        direction:[dirX,dirY],
                        //to be filled in later
                        collisions:[],
                        //single collisions that can be used for double series
                        singleCols:[],
                        sharedCards:[],
                        turnsToFinish:[],
                        cardsToFinish:[]
                        //this will hold other stuff
                    };
                    possible.push(info);
                }
            }
        }
    }


    //returns x,y coordinates for the card, does not work with Js
    function cardPossible(card) {
        var possible = [];
        if (card === 1) {
            possible = [[0,0],[0,9],[9,0],[9,9]];
        } else if (card < 10) {
            possible = [[0,card-1],[9,10-card]];
        } else {
            var x = Math.floor(card/10);
            var y = card % 10;
            possible = [[x,y],[9-x,9-y]];
        }
        return possible;
    }

    function outOfBounds(x,y) {
        return x > 9 || x < 0 || y > 9 || y < 0;
    }
};
