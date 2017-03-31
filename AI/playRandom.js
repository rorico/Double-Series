var helpers = require("./playHelper");
var constants = require("../constants");

var playRandom = module.exports = function(info) {
    var helper = helpers(info.board,info.points);
    var getOptions = helper.getOptions;
    var hasUselessCard = helper.hasUselessCard;
    var addJoptions = helper.addJoptions;
    var removeJoptions = helper.removeJoptions;

    return {
        play:playRandom
    };

    function playRandom(hand,value,info) {
        var options = getOptions(hand,info);
        var useless = hasUselessCard(options);
        if (useless !== -1) {
            return {action:constants.PLAY_REPLACE,card:useless};
        }
        var action = constants.PLAY_ADD;
        var card = Math.floor(Math.random()*options.length);
        var spots = options[card];
        if (spots === 0){
            spots = addJoptions();
        } else if (options[card] === -1) {
            spots = removeJoptions(value);
            if (!spots.length) {
                //have to choose another card, just change cards
                return playRandom(hand,value,info);
            }
            action = constants.PLAY_REMOVE;
        }
        var side = Math.floor(Math.random()*spots.length);
        return {action:action,card:card,position:spots[side]};
    }
};