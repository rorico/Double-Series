function modal() {
    return $("<div id='modal' class='block'></div>");
}

function button(text,click) {
    return $("<input class='block' type='button' name='name' value='" + text + "'>").click(click);
}

function showNewGame() {
    var popup = modal();
    popup.html("Do you want to start a new game?<br />");
    popup.append(button("Yes",function() {
        sendNewGame();
        popup.html("Waiting on other players...");
    }));
    popup.append(button("No",function() {
        popup.remove();
    }));
    $("#holder").append(popup);
}

function popup() {
    var popup = modal();
    var nameField = $("<input class='block' type='text' name='name' value='Your Name'>");
    nameField.change(function(e) {
        myName = nameField.val();
        /*var data = {type:"change",name:myName};
        connection.send(JSON.stringify(data));*/
    });
    popup.append(nameField);
    popup.append("<br />");

    var newGameButton = $("<input class='block' type='button' name='name' value='Create Game'>");
    newGameButton.click(createGame);
    popup.append(newGameButton);
    var joinGameButton = $("<input class='block' type='button' name='name' value='Join game'>");
    joinGameButton.click(joinGameClick);
    popup.append(joinGameButton);

    $("#holder").append(popup);
    //var topOffset = ($("body").innerHeight() - $("#modal").outerHeight())/2;
    //$("#modal").css("top",topOffset);
}

function createGame() {
    //for now just create and join a game
    $("#modal").html("Loading...");
    var data = {type:"createGame",name:myName};
    connection.send(JSON.stringify(data));
}

function createGameCallback(gameInfo) {
}

function joinGameClick() {
    $("#modal").html("Loading...");
    var data = {type:"getGames"};
    connection.send(JSON.stringify(data));
}

function joinGameClickCallback(gameInfo) {
    $("#modal").empty();
    for (var i = 0 ; i < gameInfo.length ; i++) {
        var gameId = gameInfo[i][0] || "";
        var stats = gameInfo[i][1];
        var activePlayers = stats.activePlayers;
        var maxNumHumanPlayers = stats.maxNumHumanPlayers;
        var text = "Game " + gameInfo[i][0] + "<br />Players: " + activePlayers + "/" + maxNumHumanPlayers;
        var html = $("<button class='block' name='name'>" + text + "</button>");
        html.click(function(gameId) {
            return function() {
                var data = {type:"joinGame",gameId:gameId,name:myName};
                connection.send(JSON.stringify(data));
            };
        }(gameId));
        $("#modal").append(html);
    }
}

function joinGame() {
    $("#modal").html("Loading...");
}

function joinGameCallback() {
    $("#modal").remove();
}

function boardDisplay(board,points) {
    //create board display

    var cnt = 1;

    var html = "<table>";
    for (var i = 0 ; i < board.length ; i++) {
        html += "<tr>";
        for (var j = 0 ; j < board[i].length ; j++) {
            html += "<td class='v" + points[i][j] + "' id='" + cnt  +"'>" + changeToCards(board[i][j]) + "</td>";
            cnt++;
        }
        html += "</tr>";
    }
    html += "</table>";

    var display = $("<table><tr><td></td><td id='topPlayer'></td><td id='card_played'></td></tr>" + 
                    "<tr><td id='leftPlayer'></td><td id='board'>" + html + "</td><td id='rightPlayer'></td></tr>" + 
                    "<tr><td id='blueData'></td><td id='botPlayer'></td><td id='greenData'></td></tr>" + 
                    "<tr><td></td><td id='options'></td><td></td></tr></table>");
    
    $("#game").html(display);

    $("#blueData").html("Blue<br /><span id='bluewin'>0 (0.00%)</span>");
    $("#greenData").html("Green<br /><span id='greenwin'>0 (0.00%)</span>");
    cardHistorySetup();
    createPlayers();
}

//shows Hand on board
function createPlayers() {
    var currentPlayer = me ? me : 0;
    $("#botPlayer").html(playerHtml(currentPlayer));
    $("#p" + me).sortable();
    $("#pt" + me).prop("contenteditable",true).blur(function() {
        var data = {type:"change",name:$(this).html()};
        connection.send(JSON.stringify(data));
    });
    currentPlayer = (currentPlayer + 1) % 4;
    $("#rightPlayer").html("<div class='boardSide sideHolder'><div id='rightSide' class='rotate270'>" + playerHtml(currentPlayer) + "</div></div>");
    currentPlayer = (currentPlayer + 1) % 4;
    $("#topPlayer").html("<div class='sideHolder'><div class='rotate180'>" + playerHtml(currentPlayer) + "</div></div>");
    currentPlayer = (currentPlayer + 1) % 4;
    $("#leftPlayer").html("<div class='boardSide sideHolder'><div id='leftSide' class='rotate90'>" + playerHtml(currentPlayer) + "</div></div>");

    var height = $("#botPlayer").height();
    var width = $("#botPlayer").width();

    $(".boardSide").width(height).height(width);
    $("#rightSide").width(width).height(height);
    $("#leftSide").width(width).height(height);
}

function playerHtml(player) {
    var playerName = player === me ? myName : (playerNames[player] || "Player " + (player + 1));
    return "<div class='playerTitle'><span id='pt" + player + "'>" + playerName + "</span></div><div class='hand' id='p" + player + "'>" + cardHtml(player) + "</div>";
}

function newPlayers() {
    for (var player = 0 ; player < hands.length ; player++) {
        $("#p" + player).html(cardHtml(player));
    }
}

function cardHtml(player) {
    var html = "";
    var hand = hands[player];
    if (hand) {
        for (var i = 0 ; i < hand.length ; i++) {
            html += "<div id='p" + player + "_" + i + "'>" + changeToCards(hand[i]) + "</div>";
        }
    } else {
        //should be defined, but assume 7 incase
        var handLength = handLengths[player] === undefined ? 7 : handLengths[player];
        for (var i = 0 ; i < handLength ; i++) {
            html += "<div></div>";
        }
    }
    return html;
}

function cardHistorySetup() {
    $("#card_played").append("<div id='placeholder' class='card'><div id='cardHolder'></div></div>");
    $("#cardHolder").hover(function(){
        $("#cardHolder").css("maxHeight","250px");
    },function(){
        $("#cardHolder").css("maxHeight","40px").scrollTop(0);
    });
}

function addCardPlayed(obj,team) {
    $("#cardHolder").prepend(cardPlayedEle(obj,team));
}

function cardPlayedEle(obj,team) {
    var card = $("<div class='c"+team+" card'>"+changeToCards(obj.cardPlayed)+"</div>");
    var position = obj.position;
    card.hover(function(){
        $("body").append("<div class='hide'></div>");
        $("#card_played").addClass("show");
        getPosition(position[0],position[1]).addClass("show");
    },function(){
        $(".hide").remove();
        $(".show").removeClass("show");
    });
    return card;
}

function newGameDisplay() {
    for (var i = 1 ; i <= 100 ; i++) {
        $("#"+i).removeClass().addClass("v0");
    }
    $("#cardHolder").empty();
    //may want to move this somewhere else
    cardsPlayed = [];
}

function getPosition(x,y) {
    return $("#" + (10*x + y + 1));
}

function changeBoard(x,y,val) {
    getPosition(x,y).removeClass().addClass("v" + val);
}

function showFinishLine(line,team) {
    for (var i = 0 ; i < line.length ; i++) {
        showFinishPoint(line[i][0],line[i][1],team);
    }
}

function showFinishPoint(x,y,team) {
    getPosition(x,y).removeClass("v" + team).addClass("v"+(team+1));
}

//change card numbers to corresponding card in game
function changeToCards(number) {
    switch (number) {
        case -1:
            return "J -";
        case 0:
            return "J +";
        case 1:
            return "&#9734";
        case 2:
            return "10 &#9825";
        case 3:
            return "9 &#9825";
        case 4:
            return "8 &#9825";
        case 5:
            return "7 &#9825";
        case 6:
            return "7 &#9827";
        case 7:
            return "8 &#9827";
        case 8:
            return "9 &#9827";
        case 9:
            return "10 &#9827";
        case 10:
            return "10 &#9824";
        case 11:
            return "K &#9825";
        case 12:
            return "6 &#9825";
        case 13:
            return "5 &#9825";
        case 14:
            return "4 &#9825";
        case 15:
            return "4 &#9827";
        case 16:
            return "5 &#9827";
        case 17:
            return "6 &#9827";
        case 18:
            return "K &#9827";
        case 19:
            return "10 &#9671";
        case 20:
            return "9 &#9824";
        case 21:
            return "6 &#9824";
        case 22:
            return "Q &#9825";
        case 23:   
            return "3 &#9825";
        case 24:   
            return "2 &#9825";
        case 25:   
            return "2 &#9827";
        case 26:   
            return "3 &#9827";
        case 27:   
            return "Q &#9827";
        case 28:   
            return "6 &#9671";
        case 29:
            return "9 &#9671";
        case 30:
            return "8 &#9824";
        case 31:
            return "5 &#9824";
        case 32:
            return "3 &#9824";
        case 33:
            return "Q &#9824";
        case 34:
            return "A &#9825";
        case 35:
            return "A &#9827";
        case 36:
            return "Q &#9671";
        case 37:
            return "3 &#9671";
        case 38:
            return "5 &#9671";
        case 39:
            return "8 &#9671";
        case 40:
            return "7 &#9824";
        case 41:  
            return "4 &#9824";
        case 42:  
            return "2 &#9824";
        case 43:  
            return "A &#9824";
        case 44:  
            return "K &#9824";
        case 45:  
            return "K &#9671";
        case 46:  
            return "A &#9671";
        case 47:  
            return "2 &#9671";
        case 48:  
            return "4 &#9671";
        case 49:  
            return "7 &#9671";
        default:
            return "-2";
    }
}