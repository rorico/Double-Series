//this is straight copied from Double Series.js
var speed = 500;
var games = 0;

//game parts
var board;
var helper;
var wins = [];
var ties = 0;

var maxCards = 108;
var handLength = 7;

var hands = [];
var handLengths = [];
var playerNames = [];
var cardsleft = maxCards - 4 * handLength - 1;
var cardsPlayed = [];

var gameId;
var myName;
var me;
var playedCard = -1;
var connection;

$(document).ready(function() {
    board = newBoard();
    helper = boardHelper(board.points);

    me = 0;

    var games;
    var game;
    var curGame;
    var curTurn;
    var paused = false;
    var interval;
    var timeout;

    //functions
    var play;
    var pause;

    //get filename from query
    $.ajax({
        url: decodeURIComponent(location.search.substr(1)),
        success: function(data) {
            games = JSON.parse(data);
            if (games.length) {
                changeGame(0);
                display();
                showControls();
            }
        }
    });

    function changeGame(num) {
        if (num >= games.length) {
            num = games.length - 1;
        } else if (num < 0) {
            num = 0;
        }
        if (curGame !== num) {
            curGame = num;
            curTurn = -1;
            board.newGame();
            game = games[curGame];
            hands = game.startingHands;
            playerNames = game.playerNames;
            //change this later
            myName = playerNames[me];
            createPlayers();
            $("#curGame").html(curGame);
        	$("#curTurn").html(curTurn);
            $("#totTurn").html(game.cardsPlayed.length - 1);
        }
    }

    function changeTurn(turn) {
        if (turn >= game.cardsPlayed.length) {
            turn = game.cardsPlayed.length - 1;
        } else if (turn < 0) {
            turn = -1;
        }
        //negative values show nothing
        if (curTurn > turn) {
            //really inefficient, but works for now
            board.newGame()
            hands = game.startingHands;
            createPlayers();
            for (var i = 0 ; i <= turn ; i++) {
                playCard(game.cardsPlayed[i]);
            }

        } else if (curTurn < turn) {
            for (var i = curTurn + 1 ; i <= turn ; i++) {
                playCard(game.cardsPlayed[i]);
            }
        }
        curTurn = turn;
        $("#curTurn").html(curTurn);
    }

    function display() {
        clearInterval(interval);
        clearTimeout(timeout);
        interval = setInterval(function each() {
            curTurn++;
            plays = game.cardsPlayed;
            if (curTurn >= plays.length) {
                clearInterval(interval);
                if (curGame+1 < games.length) {
                    timeout = setTimeout(function() {
                        changeGame(curGame+1);
                        display();
                    },speed * 3);
                }
                return;
            }
            $("#curTurn").html(curTurn);
            var play = plays[curTurn];
            playCard(play);
        },speed);
    }

    function playCard(play) {
        var player = play.player;
        var team = helper.getTeam(player);
        board.playCard(player,team,play);
        var newCard = play.newCard;
        var playedCard = play.card;
        if (newCard === undefined) {
            hands[player].splice(playedCard,1);
            var size = hands[player].length;
            $("#p"+player+"_"+size).remove();
            for (var i = playedCard ; i < size ; i++) {
                $("#p"+player+"_"+i).html(changeToCards(hands[player][i]));
            }
        } else {
            hands[player][playedCard] = newCard;
            $("#p"+player+"_"+playedCard).html(changeToCards(newCard)).detach().appendTo($("#p" + player));
        }
    }

    function showControls() {
        var playB = button("Pause",function() {
            if (paused) {
                play();
            } else {
                pause();
            }
        });
        play = function() {
            paused = false;
            display();
            playB.val("Pause");
        }
        pause = function() {
            paused = true;
            clearInterval(interval);
            clearTimeout(timeout);
            playB.val("Play");
        }
        var controls = $("<div id='controls'>");
        changeVal(controls,"Game",curGame,games.length - 1,changeGame);
        changeVal(controls,"Turn",curTurn,game.cardsPlayed.length - 1,changeTurn);
        controls.append(playB);
        $("#holder").append(controls);
    }

    function changeVal(hold,name,cur,max,callback) {
        var change = function() {
            callback(+ele.html());
        };
        //name is capitalized
        var ele = $("<span contenteditable='true' id='cur" + name + "'>" + cur + "</span>").blur(change).keydown(function(e) {
            if (e.key === "Enter") {
                change();
                e.preventDefault();
            } else if (isNaN(e.key) && e.key.length === 1 && !e.ctrlKey) {
                //prevent things that aren't numbers
                e.preventDefault();
            } else if (e.key === "ArrowUp") {
                callback(+ele.html() + 1);
            } else if (e.key === "ArrowDown") {
                callback(+ele.html() - 1);
            }
        });
        hold.append(name + " (").append(ele).append("/<span id='tot" + name + "'>" + max + "</span>) ");
    }
});
