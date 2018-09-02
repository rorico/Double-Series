//shared between back end and front end
if (typeof module === "object" && module && typeof module.exports === "object") {
    module.exports = boardHelper;
}

function boardHelper(points) {
    return {
        getOptions:getOptions,
        checker:checker,
        cardOptions:cardOptions,
        getTeam:getTeam,
        outOfBounds:outOfBounds,
        addJoptions:addJoptions,
        removeJoptions:removeJoptions
    };
    
    //DEPRECATED
    //array of options that player can play
    //Output [card][side][row x, col y]
    function getOptions(cards) {
        var options = [];
        for ( var k = 0 ; k < cards.length ; k++) {
            var sides = [];
            var card = cards[k];
            //if jacks, just push jacks
            if (card === 0 || card === -1) {
                sides = card;
            } else {
                sides = cardOptions(card);
            }
            options.push(sides);
        }
        return options;
    }

    //returns x,y coordinates for the card, does not work with Js
    function cardOptions(card) {
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
        var sides = [];
        for ( var i = 0 ; i < possible.length ; i++ )
        {
            if (points[possible[i][0]][possible[i][1]]===0) {
                sides.push([possible[i][0],possible[i][1]]);
            }
        }
        return sides;
    }

    //random add jack
    function addJoptions() {
        var options = [];
        for (var x = 0 ; x < points.length ; x++) {
            for (var y = 0 ; y < points[x].length ; y++) {
                if (points[x][y] === 0) {
                    options.push([x,y]);
                }
            }
        }
        return options;
    }

    //random remove jack 
    function removeJoptions(team) {
        var opTeam = 4 - team;
        var options = [];
        for (var x = 0 ; x < points.length ; x++) {
            for (var y = 0 ; y < points[x].length ; y++) {
                if (points[x][y] === opTeam) {
                    options.push([x,y]);
                }
            }
        }
        return options;
    }

    //checks if lines is won and turns them over
    //if can finish multiple, finishes all
    function checker(x,y,team,finishedLines) {
        var ret = [];
        var dirs = [
            [1,1],
            [1,0],
            [0,1],
            [1,-1]
        ];

        //if there are finished lines, don't search for those directions
        if (finishedLines) {
            for (var i = 0 ; i < finishedLines.length ; i++) {
                var line = finishedLines[i];
                if (line[0] && line[1]) {
                    var slope = [line[1][0] - line[0][0],line[1][1] - line[0][1]];
                    //first should be positive
                    if (slope[0] < 0) {
                        slope[0] = -slope[0];
                        slope[1] = -slope[1];
                    }
                    for (var j = 0 ; j < dirs.length ; j++) {
                        if (dirs[j][0] === slope[0] && dirs[j][1] === slope[1]) {
                            dirs.splice(j,1);
                            break;
                        }
                    }
                } else {
                    console.log("this shouldn't happen");
                }
            }
        }

        for (var i = 0 ; i < dirs.length ; i++) {
            var lines = checkDirection(x,y,dirs[i][0],dirs[i][1],team);
            if (lines.length === 9) {
                //2 lines, seperate them
                ret.push(lines.slice(0,5));
                ret.push(lines.slice(4,9));
            } else if (lines.length >= 5) {
                ret.push(lines);
            }
        }
        return ret;
    }

    function checkDirection(x,y,dirX,dirY,team) {
        var list = [[x,y]];

        var checkUp = true;
        var checkDown = true;
        
        var xUp = x;
        var xDown = x;
        var yUp = y;
        var yDown = y;
        
        for (var i = 1 ; i < 5 && checkUp; i++) {
            xUp += dirX;
            yUp += dirY;
            if (!outOfBounds(xUp,yUp) && points[xUp][yUp]===team) {
                list.push([xUp,yUp]);
            } else {
                checkUp = false;
            }
        }
        for (var i = 1 ; i < 5 && checkDown; i++) {
            xDown -= dirX;
            yDown -= dirY;
            if (!outOfBounds(xDown,yDown) && points[xDown][yDown]===team) {
                list.unshift([xDown,yDown]);
            } else {
                checkDown = false;
            }
        }
        return list;
    }

    function outOfBounds(x,y) {
        return x > 9 || x < 0 || y > 9 || y < 0;
    }

    function getTeam(player) {
        //1 for player 1 and 3, 3 for 2 and 4
        return ((player % 2) * 2) + 1;
    }
}