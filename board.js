var frontEnd = true;
//shared between back end and front end
if (typeof module === "object" && module && typeof module.exports === "object") {
    frontEnd = false;
    var constants = require("./constants.js");
    module.exports = newBoard;
} else {
    //var board = newBoard();
}

function newBoard(start) {
    //game parts
    var board = [];
    var pointworth = [];
    var points = [];
    var linesDone = {
        1:0,
        3:0
    };
    //create in case start is missing things
    createBoard();
    if (start) {
        board = start.board || board;
        pointworth = start.pointworth || pointworth;
        points = start.points || points;
        linesDone = start.linesDone || linesDone;
    }

    if (frontEnd) {
        boardDisplay(board,points);
    }

    return {
        getInfo:getInfo,
        newGame:newGame,
        playCard:playCard,
        board:board,
        points:points,
        linesDone:linesDone
    };

    //since there are primitive types, need to refresh everything called
    function getInfo() {
        return {
            board:board,
            points:points,
            linesDone:linesDone
        };
    }

    function playCard(player,team,play) {
        var position = play.position;
        var x = position ? position[0] : -1;
        var y = position ? position[1] : -1;
        switch (play.action) {
        case constants.PLAY_REPLACE:
            //do nothing here
            break;
        case constants.PLAY_REMOVE:
            removePoint(x,y);
            break;
        case constants.PLAY_ADD:
            addPoint(x,y,team);
            break;
        case constants.PLAY_FINISH:
            addPoint(x,y,team);
            finishLines(play.finishedLines,team);
            break;
        }
    }
    //---------------------------------------------//

    //-----------------game functions--------------//
    //creates board and deck
    function createBoard() {
        //creates indexes for rows 1 - 5
        for (var row = 0 ; row < 5 ; row++) {
            var rowinfo = [];
            var pointsrow = [];
            var pointworthrow = [];
            for (var col = 1 ; col <= 10 ; col++) {
                if (row === 0) {
                    if (col === 1 || col === 10) {
                        rowinfo.push(1);
                        pointsrow.push(0);
                        pointworthrow.push(0);
                    } else {
                        rowinfo.push(col);
                        pointsrow.push(0);
                        pointworthrow.push(0);
                    }
                } else {
                    rowinfo.push(10*row + col - 1);
                    pointsrow.push(0);
                    pointworthrow.push(0);
                }
            }
            board.push(rowinfo);
            points.push(pointsrow);
            pointworth.push(pointworthrow);
        }

        //copies a reverse of rows 1 - 5
        for (var i = 0 ; i < 5 ; i++) {
            board.push(board[4-i].slice().reverse());
            points.push(points[4-i].slice());
            pointworth.push(pointworth[4-i].slice());
        }
    }

    //restart game
    function newGame() {
        for (var row = 0 ; row < 10 ; row++) {
            for (var col = 0 ; col < 10 ; col++) {
                points[row][col]=0;
            }
        }
        linesDone[1] = 0;
        linesDone[3] = 0;
        if (frontEnd) {
            newGameDisplay();
        }
    }

    //changes a team to 0 because of remove J
    function removePoint(x,y) {
        points[x][y] = 0;
        if (frontEnd) {
            changeBoard(x,y,0);
        }
    }

    //changes team to given team of card played
    function addPoint(x,y,team) {
        points[x][y] = team;
        if (frontEnd) {
            changeBoard(x,y,team);
        }
    }

    //creates a line
    function finishLines(lines,team) {
        for (var i = 0 ; i < lines.length ; i++) {
            var line = lines[i];
            for (var j = 0 ; j < line.length ; j++) {
                var x = line[j][0];
                var y = line[j][1];
                points[x][y] = team + 1;
                pointworth[x][y]++;
                if (frontEnd) {
                    showFinishPoint(x,y,team);
                }
            }
            linesDone[team]++;
        }
    }
}