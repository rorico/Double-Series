var speed = 500;
var games = 0;

//game parts
var board;
var helper;
var greenwin = 0;
var bluewin = 0;
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
    startConnection();
});

function startConnection() {
    var socket = window.WebSocket || window.MozWebSocket;
    var loc = window.location, new_uri;
    if (loc.protocol === "https:") {
        new_uri = "wss:";
    } else {
        new_uri = "ws:";
    }
    var gameId = loc.pathname.substring(1);
    new_uri += "//" + loc.host + "/websocket?game=" + gameId;
    connection = new socket(new_uri);
    connection.onerror = function (error) {
        console.log(error);
    };

    connection.onclose = function () {
        var message = "Connection to server closed";
        $("body").append("<div id='msg'>" + message + "</div>");
        var leftOffset = ($("body").innerWidth() - $("#msg").outerWidth())/2;
        var topOffset = ($("body").innerHeight() - $("#msg").outerHeight())/2;
        $("#msg").css("left",leftOffset).css("top",topOffset);
    };

    connection.onmessage = function (message) {
        var data = JSON.parse(message.data);
        console.log(data);
        switch (data.type) {
        case "start":
            if (data.gameId) {
                if (gameId !== data.gameId) {
                    gameId = data.gameId;
                    history.pushState({}, null, "/" + gameId);
                }
            }
            joinGameCallback();
            if (data.player === undefined) {
                alert("something went very wrong");
            } else {
                me = data.player;
                if (data.hand) {
                    hands[me] = data.hand;
                }
            }
            if (data.handLengths) {
                handLengths = data.handLengths;
            }
            if (data.playerNames) {
                playerNames = data.playerNames;
            }
            if (data.cardsPlayed) {
                cardsPlayed = data.cardsPlayed;
                if (cardsPlayed.length) {
                    for (var i = 0 ; i < cardsPlayed.length ;i++) {
                        var card = cardsPlayed[i];
                        var team = helper.getTeam(card.player);
                        addCardPlayed(card,team);
                    }
                }
            }
            board = newBoard(data);
            helper = boardHelper(board.points);

            if (data.games) {
                games = data.games;
                if (data.bluewin) {
                    bluewin = data.bluewin;
                    $("#bluewin").text(getPercentage(bluewin,games));
                }
                if (data.greenwin) {
                    greenwin = data.greenwin;
                    $("#greenwin").text(getPercentage(greenwin,games));
                }
            }
            if (data.nextPlayer !== undefined) {
                if (data.nextPlayer === me) {
                    playHuman(me,helper.getTeam(me));
                } else {
                    $("#p" + data.nextPlayer).addClass("myTurn" + helper.getTeam(data.nextPlayer));
                }
            }
            break;
        case "play":
            if (data.player === undefined) {
                alert("something went very wrong");
            } else {
                var team = helper.getTeam(data.player);
                if (data.player === me) {
                    if (data.newCard === undefined) {
                        hands[me].splice(playedCard,1);
                        var size = hands[me].length;
                        $("#p"+me+"_"+size).remove();
                        for (var i = playedCard ; i < size ; i++) {
                            $("#p"+me+"_"+i).html(changeToCards(hands[me][i]));
                        }
                    } else {
                        hands[me][playedCard] = data.newCard;
                        $("#p"+me+"_"+playedCard).html(changeToCards(data.newCard)).detach().appendTo($("#p" + me));
                    }
                } else {
                    $("#p" + data.player).removeClass("myTurn" + helper.getTeam(data.player));
                    if (data.handSize !== undefined) {
                        //assume handSize drops by 1
                        $("#p" + data.player + " div").first().remove();
                        //doesn't matter which is removed
                    }
                    board.playCard(data.player,team,data);
                }
                addCardPlayed(data,team);
                if (data.nextPlayer !== undefined) {
                    if (data.nextPlayer === me) {
                        setTimeout(function() {
                            playHuman(me,helper.getTeam(me));
                        },speed);
                    } else {
                        $("#p" + data.nextPlayer).addClass("myTurn" + helper.getTeam(data.nextPlayer));
                    }
                }
            }
            break;
        case "end":
            switch (data.winner) {
                case 0:
                    ties++;
                    break;
                case 1:
                    bluewin++;
                    break;
                case 3:
                    greenwin++;
                    break;
            }
            games++;
            $("#bluewin").text(getPercentage(bluewin,games));
            $("#greenwin").text(getPercentage(greenwin,games));
            break;
        case "newGame":
            if (data.hand) {
                hands[me] = data.hand;
            }
            if (data.handLengths) {
                handLengths = data.handLengths;
            }
            newPlayers();
            board.newGame();
            if (data.nextPlayer !== undefined) {
                if (data.nextPlayer === me) {
                    playHuman(me,helper.getTeam(me));
                } else {
                    $("#p" + data.nextPlayer).addClass("myTurn" + helper.getTeam(data.nextPlayer));
                }
            }
            break;
        case "home":
            popup();
            break;
        case "change":
            $("#pt" + data.player).html(data.name);
            break;
        case "getGames":
            if (data.games) {
                joinGameClickCallback(data.games);
            }
            break;
        }
    };
}

function playData(player,result) {
    var data = {type:"play",player:player,result:result};
    connection.send(JSON.stringify(data));
}

function getPercentage(num,den) {
    return num + " (" + ((num/den)*100).toFixed(2) + "%)";
}