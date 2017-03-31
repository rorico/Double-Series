var helpers = require("./playHelper.js");
var constants = require("../constants");

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
    var board = info.board;
    var points = info.points;

    var possible = [];
    var references = [];
    var cardsLeft = [];
    var totCardsLeft;
    var numPlusJ;
    var numMinusJ;

    var movesLeft = [Infinity,Infinity];

    probSetup();

    return {
        play:playProb,
        setup:setup,
        onPlay:onPlay,
        onNewGame:onNewGame
    }

    function onPlay(play) {
        console.log(play);
        cardsLeft[play.card]--;
        totCardsLeft--;
        if (play.action === constants.PLAY_FINISH) {
            for (var i = 0 ; i < player.finishedLines.length ; i++) {
                updatePosition(player.finishedLines[i],play.action);
            }
        } else if (play.action === constants.PLAY_REPLACE) {
            var cardOptions
            for (var i = 0 ; i < player.finishedLines.length ; i++) {
                updatePosition(player.finishedLines[i],play.action);
            }

        } else {
            updatePosition(play.position,play.action);
        }
    }

    function onNewGame(info) {
        var hand = info.hand;
        //starting at higher # is slightly faster
        for (var i = 49 ; i >= 2 ; i++) {
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

            //calculate some stuff here for these cards
        }
    }

    function updatePosition(pos,action) {
        var x = pos[0];
        var y = pos[1];
        //what the place has been turned into
        for (var i = 0 ; i < references[x][y] ; i++) {
            var lineProb = references[x][y];
            switch (action) {
                case constants.PLAY_FINISH:
                case constants.PLAY_FINISH:
            }
        }
        switch (points[x][y]) {
            case 1:
            case 0:
        }
    }

    function playProb(hand,team,info) {

        //update probabilities
        //get best probability
        var max = 0;

        for (var i = 0 ; i < hand.length ; i++) {
            var card = hand[i];
            if (card === 0 || card === -1) {

            } else {
                var lines = references[card];
                for (var j = 0 ; j < lines.length ; j++) {
                    var line = lines[j];
                }
            }
        }



                    var info = {
                        position:[x,y],
                        direction:[dirX,dirY],
                        probabilities:[1,1],
                        done:[0,0],
                        //to be filled in later
                        collisions:[]
                    };


        for (var i = 0 ; i < possible.length ; i++) {

        }
        
    }

    function probSetup() {
        start(1,1);
        start(1,0);
        start(0,1);
        start(1,-1);
        for (var i = 0 ; i < 10 ; i++) {
            var temp = [];
            for (var j = 0 ; j < 10 ; j++) {
                var temp.push([]);
            }
            references.push(temp);
        }
        for (var i = 0 ; i < possible.length ; i++) {
            var p = possible[i];
            var x = p[0][0];
            var y = p[0][1];
            var dirX = p[1][0];
            var dirY = p[1][1];

            for (var j = 0 ; j < 4 ; j++) {
                references[x + j*dirX][y + j*dirY].push(i);
            }
        }
        /*for (var i = 0 ; i < possible.length ; i++) {
            for (var j = i + 1 ; j < possible.length ; j++) {
                var meet = true;
                var meetPoint;
                if (sameDir(possible[i],possible[j])) {
                    var p1 = possible[i];
                    var p2 = possible[j];
                    if (dirX) {
                        var x1 = p1[0][0];
                        var x2 = p2[0][0];
                        if ((x1 > x2 && x1 + 5 < x2) || (x2 > x1 && x2 + 5 < x1)) {
                            meet = true;
                        } else {
                            meet = false;
                        }
                    }
                    if (p1[0][0] === )
                } else {

                }
            }
        }*/
    }

    function sameDir(dir1,dir2) {
        return dir1[0] === dir2[0] && dir1[1] === dir2[1];
    }

    function isDiag(dir) {
        return dirX && Math.abs(dirY);
    }

    function start(dirX,dirY) {
        for (var x = 0 ; x < 10 ; x++) {
            for (var y = 0 ; y < 10 ; y++) {
                if (!outOfBounds(x,y) && !outOfBounds(x + 4*dirX,y + 4*dirY)) {
                    //
                    var info = {
                        position:[x,y],
                        direction:[dirX,dirY],
                        probabilities:[1,1],
                        done:[0,0],
                        //to be filled in later
                        collisions:[]
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
}