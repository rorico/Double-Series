var helpers = require("./playHelper.js");
var constants = require("../constants");

var playRandom = module.exports = function(info) {
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
    var points = info.points;

    return {
        play:playBest
    };

    function playBest(hand,value,info) {
        var options = getOptions(hand);
        var useless = hasUselessCard(options);
        if (useless !== -1) {
            return {action:constants.PLAY_REPLACE,card:useless};
        }
        var best = bestMove(options,value,offensive);

        //if best line is 4
        if (best[0]!==4) {

            //determines if has remove Jack
            var removePos = hasRemove(hand);
            if (removePos!==-1) {
                var options2 = removeJ(value);
                if (options2.length!==0) {
                    var side = Math.floor(Math.random()*options2.length);
                    return {action:constants.PLAY_REMOVE,card:removePos,position:options2[side]};
                }  else if (hasOnlyRemoveJ(hand)){
                    options = removeJoptions(value);
                    var side = Math.floor(Math.random()*options.length);
                    return {action:constants.PLAY_REMOVE,card:removePos,position:options[side]};
                }
            }

            //determines if has add Jack
            var addPos = hasAdd(hand);
            if (addPos!==-1) {
                var options2 = addJ(value,offensive);
                if (options2.length!=0) {
                    var side = Math.floor(Math.random()*options2.length);
                    return {action:constants.PLAY_ADD,card:addPos,position:options2[side]};
                } else if (hasOnlyJ(hand)){
                    options = addJoptions();
                    var side = Math.floor(Math.random()*options.length);
                    return {action:constants.PLAY_ADD,card:addPos,position:options[side]};
                }
            }
        }

        //determine what value to play
        //best[0] is longest line
        //best[1] is best play info
        //best[1][cards] is the cards that play the best line
        //best[1][card][0] is card
        //best[1][card][1] is side
        var random = Math.floor(Math.random()*best[1].length);
        var card = best[1][random][0];
        var side = best[1][random][1];

        return {action:constants.PLAY_ADD,card:card,position:options[card][side]};
    }

    //returns indexes for options with greatest value
    function bestMove(options,value,offensive) {
        var type = value;
        var typeFor = value;
        var typeAgainst = 4 - value;
        var number = 4; //helps a line of four
        var worth = [];
        var best = 0;
        var multiplier = 1;
        
        var possibleBoard = copyArray(points);
        
        //initialize worth to be 0
        for (var i = 0 ; i<options.length ; i++){
            var worthrow = [];

            //if Jacks, push -1
            if (options[i]==-1||options[i]==0) {
                worthrow.push(-1);
            } else {
                for (var j = 0 ; j<options[i].length ; j++) {
                    worthrow.push(0);
                    var x = options[i][j][0];
                    var y = options[i][j][1];
                    if (possibleBoard[x][y]===10) {
                        possibleBoard[x][y] = 11;
                    } else {
                        possibleBoard[x][y] = 10;
                    }
                    
                }
            }
            worth.push(worthrow);
        }
        //if finds a line of 4,breakopenbreaks out of for loop
        for (var card = 0; card<options.length ; card++){
            //continue out if a Jack
            if (options[card]===-1||options[card]===0) {
                continue;
            }

            for (var side = 0; side<options[card].length ; side++){
                var x = options[card][side][0];
                var y = options[card][side][1];
                if (possibleBoard[x][y]===10) {
                    possibleBoard[x][y] = 0;
                } else if (possibleBoard[x][y]===11) {
                    possibleBoard[x][y] = 10;
                } else {
                    console.log("error");
                }
            }

            
            for (var side = 0; side<options[card].length ; side++){
                //switches from offensive to defensive
                for (var blah = 0 ; blah<=1; blah++){
                    if (blah===0) {
                        type = typeFor;
                        multiplier = 1;
                    } else {
                        type = typeAgainst;
                        multiplier = 0.5;
                    }
                    
                    /*if (blah===0) {
                        type = typeFor;
                    } else if (offensive||number<3) {
                        continue;
                    } else if (!offensive) {
                        type = typeAgainst;
                    }*/
                    
                    
                    //row x, col y
                    var x = options[card][side][0];
                    var y = options[card][side][1];
                    
                    var d11 = checkCard(x,y,1,1,type,possibleBoard);
                    var d01 = checkCard(x,y,0,1,type,possibleBoard);
                    var d13 = checkCard(x,y,1,-1,type,possibleBoard);
                    var d10 = checkCard(x,y,1,0,type,possibleBoard);
                    
                    best = Math.max(best,d11[0],d01[0],d13[0],d10[0]);
                    worth[card][side]+=(d11[1]+d01[1]+d13[1]+d10[1])*multiplier;
                    
                }
            }
            
            for (var side = 0; side<options[card].length ; side++){
                var x = options[card][side][0];
                var y = options[card][side][1];
                if (possibleBoard[x][y]===10) {
                    possibleBoard[x][y] = 11;
                } else {
                    possibleBoard[x][y] = 10;
                }
            }
        }

        //return max
        var returnValues = [best];
        var max = 0;
        for ( var i = 0 ; i<worth.length ; i++ ){
            for ( var j = 0 ; j<worth[i].length ; j++ ){
                if (max<worth[i][j]) {
                    max = worth[i][j];
                }
            }
        }
        var returnValuesValues = [];
        for ( var i = 0 ; i<worth.length ; i++ ){
            for ( var j = 0 ; j<worth[i].length ; j++ ){
                if (max===worth[i][j]) {
                    returnValuesValues.push([i,j]);
                }
            }
        }
        returnValues.push(returnValuesValues);
        return returnValues;
        
    }

    function checkCard(x,y,dirX,dirY,type,points) {
        var check = false;
        
        var checkOpen = true;
        var checkClosed = 0;
        var checkremove = true;
        var removed = 0; 
        var cnt = 0;
        var tnpX;
        var tnpY;
        
        var max = 0;
        var worth = 0;
        
        var inhand = 0;
        
        for (var i = 1 ; i < 5 ; i++) { 
            tnpX = x - dirX * i;
            tnpY = y - dirY * i;
            if (tnpX!==-1 && tnpY!==-1 && tnpX!==10 && tnpY!==10){
                if (points[tnpX][tnpY]===type) {
                    cnt++;
                } else if (points[tnpX][tnpY]===10||points[tnpX][tnpY]===11){
                    cnt++;
                    inhand++;
                } else if (points[tnpX][tnpY]!==0){
                    checkClosed++;
                }
            } else {
                removed=5-i;
                break;
            }
        }
        for (var i = 1 ; i<=removed ; i++){
            tnpX = x + dirX * i;
            tnpY = y + dirY * i;
            if (tnpX!==-1 && tnpY!==-1 && tnpX!==10 && tnpY!==10){
                if (points[tnpX][tnpY]===type) {
                    cnt++;
                } else if (points[tnpX][tnpY]===10||points[tnpX][tnpY]===11){
                    cnt+=0.5;
                    inhand++;
                } else if (points[tnpX][tnpY]!==0){
                    checkClosed++;
                }
            } else {
                checkremove = false;
                break;
            }
        }
        
        if (checkremove) {
            if (checkClosed===0) {
                if (cnt>max) {
                    max = cnt;
                }
                checkOpen = false;
                check = true;
                worth+=Math.pow(3,cnt);
            }
            for (var i = removed + 1 ; i<5 ; i++){
                tnpX = x + dirX * i;
                tnpY = y + dirY * i;
                if (tnpX===-1 || tnpY===-1 || tnpX===10 || tnpY===10) {
                    break;
                }
                if (points[tnpX-dirX *5][tnpY-dirY *5]===type) {
                    cnt--;
                } else if (points[tnpX-dirX *5][tnpY-dirY *5]===10||points[tnpX-dirX *5][tnpY-dirY *5]===11){
                    cnt-=0.5;
                    inhand--;
                } else if (points[tnpX-dirX *5][tnpY-dirY *5]!==0){
                    checkClosed--;
                }
                if (points[tnpX][tnpY]===type) {
                    cnt++;
                } else if (points[tnpX][tnpY]===10||points[tnpX][tnpY]===11){
                    cnt+=0.5;
                    inhand++;
                } else if (points[tnpX][tnpY]!==0){
                    checkClosed++;
                } else {
                    checkOpen = true;
                }
                if (checkClosed===0&&checkOpen) {
                    if (cnt>max) {
                        max = cnt;
                    }
                    checkOpen = false;
                    check = true;
                    worth+=Math.pow(3,cnt);
                }
            }
        }
        
        return [max,worth];
    }

    function copyArray(array) {
        var retArray = [];
        var check = false;
        for (var i = 0 ; i<array.length ; i++) {
            if (Array.isArray(array[i])) {
                retArray.push(copyArray(array[i]));
            } else {
                check = true;
                break;
            }
        }
        if (check === true) {
            retArray = array.slice();
        }
        return retArray;
    }
}