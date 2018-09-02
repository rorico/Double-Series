function playHuman(player,team) {
    var hand = hands[player];
    for (var card = 0 ; card < hand.length ; card++) {
        var cardEle = $("#p"+player+"_"+card);
        cardEle.addClass("choose");
        var options = [];
        //jacks, don't need to calculate possible for them at this stage
        if (hand[card] === 0 || hand[card] === -1) {
            cardEle.addClass("special");
        } else {
            options = helper.cardOptions(hand[card]);
            //no possible moves for the card
            if (!options.length) {
                cardEle.addClass("special");
            } else {
                //show possible moves
                for (var side = 0 ; side < options.length ; side++) {
                    var x = options[side][0];
                    var y = options[side][1];
                    showChoosePosition(player,team,card,constants.PLAY_ADD,x,y);
                }
            }
        }
        //need to add event data because loop
        cardEle.click({card:card,options:options}, function(event) {
            clearHuman();
            var e = event.data;
            chooseCard(player,team,e.card,e.options);
        });
    }
}

function chooseCard(player,team,card,options) {
    addOption(player,"BACK",function() {
        clearHuman();
        playHuman(player,team);
    });

    var action = constants.PLAY_ADD;
    if (hands[player][card] === 0) {
        options = helper.addJoptions();
    } else if (hands[player][card] === -1) {
        action = constants.PLAY_REMOVE;
        options = helper.removeJoptions(team);
    } else if (!options.length) {     //useless card
        addOption(player,"REMOVE",function() {
            clearHuman();
            var ret = {
                card:card,
                action:constants.PLAY_REPLACE
            };
            choosePlay(player,ret);
        });
    }
    
    for (var side = 0 ; side < options.length ; side++) {
        var x = options[side][0];
        var y = options[side][1];
        showChoosePosition(player,team,card,action,x,y);
    }
}

function addOption(player,text,funct) {
    var button = $("<div class='choose options' id='back'>" + text + "</div>");
    button.click(funct);
    $("#options").append(button);
}

function showChoosePosition(player,team,card,action,x,y) {
    getPosition(x,y).addClass("choose").unbind()
    .click(function() {
        clearHuman();
        var ret = {
            card:card,
            action:action,
            position:[x,y]
        };
        var possible;
        board.playCard(player,team,ret);

        if (action === constants.PLAY_ADD && (possible = helper.checker(x,y,team),possible.length)) {
            showFinish(player,team,ret,possible);
        } else {
            choosePlay(player,ret);
        }
    });
}

function showFinish(player,team,ret,possible) {
    ret.action = constants.PLAY_FINISH;
    var linesFinished = board.linesDone[team];
    var choose = [];
    //if play is going to finish the game, it doesn't matter what i picked
    if (possible.length >= 2 - linesFinished) {
        for (var i = 0 ; i < possible.length ; i++) {
            var line = possible[i];
            var random = Math.floor(Math.random() * (line.length - 5));
            choose.push(line.slice(random,random + 5));
        }
        finish();
    } else {
        var unFinished = 0;
        for (var i = 0 ; i < possible.length ; i++) {
            var line = possible[i];
            var random = Math.floor(Math.random() * (line.length - 5));
            if (line.length === 5) {
                choose.push(line);
                showFinishLine(line,team);
            } else {
                unFinished++;

                var start = line.length - 5;
                var end = 5;
                showFinishLine(line.slice(start,end),team);
                for (var j = 0 ; j < line.length ; j = j === start - 1 ? end : j + 1) {
                    getPosition(line[j][0],line[j][1]).addClass("choose")
                    .click({line:line,i:j}, function(event) {
                        var e = event.data;
                        var poss = e.line;
                        if (e.i >= 5) {
                            var thisEnd = e.i + 1; //slice doesn't include current
                            showFinishLine(line.slice(end,thisEnd),team);
                            for (var j = end ; j < thisEnd ; j++) {
                                getPosition(poss[j][0],poss[j][1]).removeClass("choose").unbind();
                                getPosition(poss[j-5][0],poss[j-5][1]).removeClass("choose").unbind();
                            }
                            end = thisEnd;
                        } else {
                            showFinishLine(poss.slice(e.i,start),team);
                            for (var j = e.i ; j < start ; j++) {
                                getPosition(poss[j][0],poss[j][1]).removeClass("choose").unbind();
                                getPosition(poss[j+5][0],poss[j+5][1]).removeClass("choose").unbind();
                            }
                            start = e.i;
                        }
                        if (end - start >= 5) {
                            choose.push(poss.slice(start,end));
                            if (!--unFinished) {
                                finish();
                            }
                        }
                    });
                }
            }
        }
        //no choices
        if (!unFinished) {
            finish();
        }
    }
    function finish() {
        clearHuman();
        ret.finishedLines = choose;
        board.playCard(player,team,ret);
        choosePlay(player,ret);
    }
}

//clears clicks and classes that playHuman made
function clearHuman() {
    $(".choose").unbind("click");
    $(".special").removeClass("special");
    $(".choose").removeClass("choose");
    $(".options").remove();
}

function choosePlay(player,ret) {
    playedCard = ret.card;
    playData(player,ret);
}