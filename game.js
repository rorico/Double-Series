const newHelper = require("./boardHelper");
const constants = require("./constants");
const newBoard = require("./board");

module.exports = function(settings) {
    var ret = {};

    //settings
    var board = newBoard();
    var helper = newHelper(board.points);
    var maxGame = 1000;
    var speed = 500;
    var checkValid = true;
    var defaultAI = "playAIphil";
    var maxNumHumanPlayers = 4;

    //game parts
    var deck = [];
    var games = 0;
    var nextPlayer = 0;
    var greenwin = 0;
    var bluewin = 0;
    var ties = 0;

    var maxCards = 108;
    var handLength = 7;

    var hands = [];
    var handLengths = [];
    var cardsleft;
    var cardsPlayed;
    var cardsDrawn;
    var gameEnd;
    var winner;
    var winningPlayer = -1;

    var setSettings = ret.setSettings = function(obj) {
        if (obj) {
            maxGame = obj.maxGame === undefined ? maxGame : obj.maxGame;
            speed = obj.speed === undefined ? speed : obj.speed;
            checkValid = obj.checkValid === undefined ? checkValid : obj.checkValid;
            maxNumHumanPlayers = obj.maxNumHumanPlayers === undefined ? maxNumHumanPlayers : obj.maxNumHumanPlayers;
        }
    };

    //this iife generally controls the flow of the game
    (function() {
        var players = [];
        var playerNames = [];
        var spectators = [];
        var activePlayers = 0;
        var nextPlayTimer = -1;
        var recentLeave = -1;
        var removeTimer;

        var waitingFor = [];

        ret.addHuman = addHuman;
        ret.addSpectator = addSpectator;
        ret.setAI = setAI;
        ret.spaces = function() {
            return {activePlayers:activePlayers,maxNumHumanPlayers:maxNumHumanPlayers};
        };

        //start
        setSettings(settings);
        createDeck();
        initializeDefaultAI();

        newGame();

        function initializeDefaultAI() {
            setAI([0,1,2,3],defaultAI);
        }

        function setAI(playerList,AIname) {
            try {
                var constructor = require("./AI/" + AIname);
                for (var i = 0 ; i < playerList.length ; i++) {
                    var player = playerList[i];
                    addPlayer(player,constructor,false);
                }
                return true;
            } catch (err) {
                console.log(err);
                return false;
            }
        }

        function addHuman(playerObj) {
            var ret = {};
            var player = recentLeave === -1 ? getOpenPlayerSlot() : (clearTimeout(removeTimer), recentLeave);
            recentLeave = -1;
            if (player !== -1 && addPlayer(player,playerObj,true)) {
                ret.success = true;
                ret.change = function(name) {
                    playerNames[player] = name;
                    players[player].name = name;
                    sendData("change",{player:player,name:name});
                };
                ret.remove = function() {
                    removePlayer(player);
                };

                activePlayers++;
                if (activePlayers === 1) {
                    //this means this is only player, and was paused
                    start();
                }
            } else {
                ret.success = false;
            }
            return ret;
        }

        //returns true on success
        function addPlayer(player,playerConstructor,human) {
            var gameInfo = getAllInfo();
            gameInfo.type = "start";
            gameInfo.player = player;
            gameInfo.team = helper.getTeam(player);
            gameInfo.hand = hands[player];
            try {
                var playerObj = playerConstructor(gameInfo);
                playerObj.human = human;
                if (typeof playerObj.play !== "function") {
                    return false;
                }
                if (human) {
                    playerObj.name = playerObj.name || "Player " + (player + 1);
                } else {
                    playerObj.name = playerObj.name || "Computer " + (player + 1);
                    //wrap AI play to be callback, don't want to change the way AI returns
                    var AIplay = playerObj.play;
                    playerObj.play = function(hand,team,info,callback) {
                        var startTime;
                        if (speed) {
                            startTime = +new Date();
                        }
                        var result = AIplay(hand,team,info);
                        if (speed) {
                            nextPlayTimer = setTimeout(function() {
                                callback(result);
                            },speed - new Date() + startTime);
                        } else {
                            callback(result);
                        }
                    };
                    //all AI always want to play another game
                    playerObj.newGame = function(callback) {
                        //need to wrap as to not run into infinite loop
                        setTimeout(function() {
                            callback();
                        },0);
                    };
                }
                players[player] = playerObj;
                playerNames[player] = playerObj.name;

                if (player === nextPlayer) {
                    //this will stop the currently running AI if its holding this spot
                    clearTimeout(nextPlayTimer);
                }

                repeatWait(player); //if empty, nothing happens
                sendData("change",{player:player,name:playerObj.name});
                return true;
            } catch (err) {
                console.log(err.stack);
                return false;
            }
        }

        function getOpenPlayerSlot() {
            for (var player = 0 ; player < players.length ; player++) {
                if (!players[player].human) {
                    return player;
                }
            }
            return -1;
        }

        function addSpectator(spectateObj,level) {
            //this is only used for simulation, so a lot things are missing - remove, etc
            var ret = {};
            spectators.push(spectateObj);

            //from addPlayer
            var gameInfo = getAllInfo();
            gameInfo.type = "start";
            if (spectateObj.setup) {
                spectateObj.setup(JSON.stringify(gameInfo));
            }

            ret.success = true;

            activePlayers++;
            if (activePlayers === 1) {
                //this means this is only player
                start();
            }

            return ret;
        }

        function removePlayer(player) {
            //only really care about human players
            //let some time before really removing them
            if (players[player].human) {
                recentLeave = player;
                removeTimer = setTimeout(function() {
                    if (players[player].human) {
                        setAI([player],defaultAI);
                    }
                    if (recentLeave === player) {
                        recentLeave = -1;
                    }
                    activePlayers--;
                    if (!activePlayers) {
                        pause();
                    }
                },5000);
            }
        }

        function playNext() {
            var player = nextPlayer;
            var team = helper.getTeam(player);
            var hand = hands[player];
            try {
                waitFor(player,"play",[hand,team,getInfo()],function(result) {
                    playCard(player,result);
                });
            } catch (err) {
                //this will stop everything
                console.log(err.stack);
                //may want to change AI to something else
            }
        }

        function playCard(player,result) {
            if (!result) {
                //so to not destroy processTurn, will be caught later
                result = {};
            }
            var ret = processTurn(player,result);
            if (ret.status === -1) {
                console.log("something wrong with play");
            } else {
                if (ret.status === 1) {
                    playNext();
                } else if (ret.status === 3) {
                    handleEndGame();
                } else {
                    console.log("something went wrong");
                }
                sendPlay(ret);
            }
        }

        function sendPlay(data) {
            //copy to not affect outside function
            var send = copyObject(data.all);
            var newCard = data.newCard;
            var specialData = [];
            specialData[send.player] = newCard;
            sendData("play",send,specialData,"newCard");
        }

        function handleEndGame() {
            sendData("endGame",{winner:winner});

            if (games < maxGame) {
                //restart game
                var waiting = 0;
                var check = function() {
                    if (!waiting) {
                        setTimeout(function() {
                            newGame();
                            playNext();
                        },speed * 3);
                    }
                };
                var cb = function() {
                    waiting--;
                    check();
                };
                for (var i = 0 ; i < players.length ; i++) {
                    if (players[i].newGame) {
                        waiting++;
                        waitFor(i,"newGame",cb);
                    }
                }
                check();
            } else {
                sendData("allDone",{bluewin:bluewin,greenwin:greenwin,ties:ties,games:games});
            }
        }

        //restart game
        function newGame() {
            board.newGame();
            gameEnd = false;
            winner = -1;
            nextPlayer = (winningPlayer + 1) % 4;
            shuffle(deck);
            cardsleft = maxCards;
            //4 players
            for (var i = 0 ; i < 4 ; i++) {
                hands[i] = deck.slice(cardsleft - handLength,cardsleft);
                handLengths[i] = handLength;
                cardsleft -= handLength;
            }
            cardsPlayed = [];
            cardsDrawn = [];
            sendData("newGame",getAllInfo(),hands,"hand");
        }

        function sendData(type,data,special,prop) {
            data.type = type;
            //assume type isn't empty, want to do camelCase
            var listener = "on" + type[0].toUpperCase() + type.substr(1);
            for (var player = 0 ; player < players.length ; player++) {
                var listener = players[player][listener];
                if (listener) {
                    if (special && special[player] !== undefined) {
                        data[prop] = special[player];
                        listener(data);
                        delete data[prop];
                    } else {
                        listener(data);
                    }
                }
            }
            for (var i = 0 ; i < spectators.length ; i++) {
                var listener = spectators[i][listener];
                if (listener) {
                    var specL = spectator.lvl;
                    if (specL >= 5) {
                        //send everything
                        //this might break somethings as its not in the same format
                        data[prop] = special;
                        listener(data);
                        delete data[prop];
                    } else if (special && special[specL] !== undefined) {
                        data[prop] = special[specL];
                        listener(data);
                        delete data[prop];
                    } else {
                        listener(data);
                    }
                }
            }
        }
        
        //for now, assume callback is the last input into the function
        function waitFor(player,name,inputs,callback) {
            if (!callback) {
                callback = inputs;
                inputs = [];
            }
            var cb = function() {
                callback.apply(null,arguments);
                waitingFor[player] = null;
            };
            inputs.push(cb);
            waitingFor[player] = [name,inputs];
            players[player][name].apply(null,inputs);
        }

        function repeatWait(player) {
            var wait = waitingFor[player];
            if (wait) {
                var name = wait[0];
                var inputs = wait[1];
                players[player][name].apply(null,inputs);
            }
        }

        function start() {
            playNext();
        }

        function pause() {
            // this timeout if for AIs
            clearTimeout(nextPlayTimer);
        }

        function getInfo() {
            var info = board.getInfo();
            info.cardsPlayed = cardsPlayed;
            info.cardsleft = cardsleft;
            info.handLengths = handLengths;
            return info;
        }

        function getAllInfo() {
            var info = getInfo();
            info.bluewin = bluewin;
            info.greenwin = greenwin;
            info.games = games;
            info.playerNames = playerNames;
            info.handLengths = handLengths;
            info.nextPlayer = nextPlayer;
            info.gameEnd = gameEnd;
            return info;
        }

        function copyObject(obj) {
            return JSON.parse(JSON.stringify(obj));
        }
    })();

    function processTurn(player,play) {
        //play object will change, but not used outside the function
        var ret = {};
        var team = helper.getTeam(player);
        var hand = hands[player];
        var action = play.action;
        var card = play.card;
        var position = play.position;
        var x = position ? position[0] : -1;
        var y = position ? position[1] : -1;
        var finishedLines = play.finishedLines;
        if (checkValid && !checkValidPlay(player,action,card,x,y,team,finishedLines)) {
            console.log("error playing: player:",player,"cards:",hand,"team:",team,"play:",play);
            ret.status = -1;
        } else {
            var replace = false;
            switch (action) {
            case constants.PLAY_REPLACE:
                //do nothing here
                replace = true;
                break;
            case constants.PLAY_REMOVE:
                break;
            case constants.PLAY_ADD: //same check for both
            case constants.PLAY_FINISH:
                //need to finish before checking, or will get same lines
                var check = helper.checker(x,y,team,finishedLines);
                if (check.length) {
                    var checkLines = chooseFinishLine(check);
                    if (action === constants.PLAY_FINISH) {
                        play.finishedLines.concat(checkLines);
                    } else {
                        play.action = constants.PLAY_FINISH;
                        play.finishedLines = checkLines;
                    }
                }
                break;
            }
            board.playCard(player,team,play);

            //add check to see if finished
            if (play.action === constants.PLAY_FINISH) {
                checkGameDone();
            }

            ret.status = 1;     //this may be overriten later

            var all = play;     //used to tell everyone what happened this turn
            ret.all = all;
            all.player = player;
            all.cardPlayed = hands[player][card];

            cardsPlayed.push(all);
            var newCard = drawCard(player,card,team,replace);
            if (newCard === undefined) {
                all.handSize = handLengths[player];
            } else {
                //for history purposes, hold newCard
                cardsDrawn.push(newCard);
                ret.newCard = newCard;
            }

            if (gameEnd) {
                ret.status = 3;
                ret.winner = winner;
                winningPlayer = player;
                //for allInfo - new player
                nextPlayer = -1;
            }

            if (ret.status === 1) {
                //get player who plays next
                if (replace) {
                    nextPlayer = player;
                } else {
                    nextPlayer = (player+1) % 4;
                }

                //if nextHand is empty, keep going
                for (var i = 0 ; i < 4 ; i++) {
                    if (hands[nextPlayer].length) {
                        break;
                    } else {
                        nextPlayer = (nextPlayer+1) % 4;
                    }
                }
                all.nextPlayer = nextPlayer;
            }
        }
        return ret;
    }

    function checkValidPlay(player,action,cardIndex,x,y,team,finishedLines) {
        if (gameEnd) {
            return false;
        }
        if (nextPlayer !== player) {
            return false;
        }
        var card = hands[player][cardIndex];
        switch (action) {
        case constants.PLAY_REPLACE: //throw away card
            if (card === 0 || card === -1) {
                return false;
            }
            if (helper.cardOptions(card).length) {
                return false;
            }
            break;
        case constants.PLAY_REMOVE: //remove J
            if (card !== -1) {
                return false;
            }
            if (helper.outOfBounds(x,y)) {
                return false;
            }
            if (board.points[x][y] !== 4 - team) {
                return false;
            }
            break;
        case constants.PLAY_FINISH: //add and finish line
            if (!finishedLines) {
                return false;
            }
            for (var i = 0 ; i < finishedLines.length ; i++) {
                var line = finishedLines[i];
                //has to include current point
                var hasPoint = false;
                var slope = [-1,-1];
                for (var j  = 0 ; j < line.length ; j++) {
                    var point = line[j];
                    if (helper.outOfBounds(point[0],point[1])) {
                        return false;
                    }
                    if (x===point[0] && y===point[1]) {
                        hasPoint = true;
                    } else if (board.points[point[0]][point[1]] !== team) {
                        //can't check current point, maybe not updated yet
                        return false;
                    }
                    //check the line is all in the same line
                    if (j) {
                        var prevPoint = line[j - 1];
                        var thisSlope = [point[0] - prevPoint[0],point[1] - prevPoint[1]];
                        if (j !== 1 && !(thisSlope[0] === slope[0] && thisSlope[1] === slope[1])) {
                            return false;
                        }
                        slope = thisSlope;
                    }
                }
                if (!hasPoint) {
                    return false;
                }
                //check the line has correct length
                if ((line.length - 1*hasPoint) % 4) {
                    return false;
                }
            }
            //fall through and also check add
        case constants.PLAY_ADD: //add
            if (helper.outOfBounds(x,y)) {
                return false;
            }
            if (board.points[x][y] !== 0) {
                return false;
            }
            if (card !== 0) {
                if (board.board[x][y] !== card) {
                    return false;
                }
            }
            break;
        default: //shouldn't get here
            return false;
        }
        return true;
    }

    //pick up new card, return value of newCard
    function drawCard(player,card,team,replace) {
        if (cardsleft > 0) {
            cardsleft--; //0 index
            hands[player][card] = deck[cardsleft];
            return hands[player][card];
        } else {
            hands[player].splice(card,1);
            handLengths[player]--;
            checkNoCards();
            //returns nothing
        }
    }

    //updates gameEnd if game is done
    function checkGameDone() {
        if (board.linesDone[3] >= 2) {
            winner = 3;
            greenwin++;
            games++;
            gameEnd = true;
        } else if (board.linesDone[1] >= 2) {
            winner = 1;
            bluewin++;
            games++;
            gameEnd = true;
        }
    }

    //updates gameEnd if no cards left to play is done
    function checkNoCards() {
        for (var i = 0 ; i < hands.length ; i++) {
            if (hands[i].length) {
                return;
            }
        }
        //no cards left
        gameEnd = true;
        winner = 0;
        ties++;
        games++;
    }

    //default choose, picks randomly
    function chooseFinishLine(lines) {
        var chosen = [];
        for (var i = 0 ; i < lines.length ; i++) {
            var line = lines[i];
            if (line.length > 5) {
                var random = Math.floor(Math.random() * (line.length - 5));
                chosen.push(line.slice(random,random + 5));
            } else if (line.length === 5) {
                chosen.push(line);
            }
        }
        return chosen;
    }

    //-----------------game functions--------------//
    function createDeck() {
        //creates deck with 4 add Js, 4 remove Js, 4 corner pieces, and 2 of each other card
        for (var i = 2 ; i < 50 ; i++) {
            deck.push(i);
            deck.push(i);
        }
        for (var i = 0 ; i < 4 ; i++) {
            deck.push(1);
            deck.push(0);
            deck.push(-1);
        }
    }

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
    return ret;
};
