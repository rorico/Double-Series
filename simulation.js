const newGame = require("./game");
const fs = require("fs");

var defaultSettings = {
    speed:0,
    maxGame:100,
    checkValid:true,
    storeData:true
};
var AIs = [];
var dbL = 1;

var validOptions = {
    "-s": {
        opt: "speed",
        type: "start",
        parse: function(str) {return +str;}
    },
    "-m": {
        opt: "maxGame",
        type: "start",
        parse: function(str) {return +str;}
    },
    "-c": {
        opt: "checkValid",
        type: "start",
        parse: function(str) {return !!str;}
    },
    "-s": {
        opt: "storeData",
        type: "start",
        parse: function(str) {return !!str;}
    },
    "-a": {
        opt: "defaultAI",
        type: "other",
        parse: function(str) {
            //TODO add possble AIs
            var list = str.split(",");
            for (var i = 0 ; i < 4 ; i++) {
                AIs[i] = list[i%list.length];
            }
        }
    },
    "-d": {
        opt: "debugLevel",
        type: "other",
        parse: function(str) {
            dbL = +str;
        }
    }
};

var args = process.argv.slice(2);
for (var i = 0 ; i < args.length ; i++) {
    var arg = args[i];
    var option = validOptions[arg];
    if (option) {
        i++;
        var parsed = option.parse(args[i]);
        if (option.type === "start") {
            defaultSettings[option.opt] = parsed;
        }
    } else {
        //show some debug info
        console.log("usage:");
        for (var opt in validOptions) {
            console.log("    " + opt + ": " + validOptions[opt].opt);
        }
        process.exit(1);
    }
}


var game = newGame(defaultSettings);
for (var i = 0 ; i < AIs.length ; i++) {
    if (!game.setAI([i],AIs[i])) {
        process.exit(1);
    }
}

var dbLs = ["onAllDone","onEndGame","onPlay"];
var sendData = function(info) {
    console.log(info);
};
var player = {
    lvl:5,
    onAllDone:function(info) {
        console.log(info);
        if (info.allGames && info.allGames.length) {
            var timestamp = (new Date()).toISOString().replace(/:/g,"'");
            var filename = "games/simulation" + args.join("") + "-" + timestamp + ".json";
            console.log(filename)
            fs.writeFile(filename,JSON.stringify(info.allGames));
        }
        process.stdin.pause();
    }
};
//always show alldone
for (var i = 1 ; i < dbLs.length ; i++) {
    player[dbLs[i]] = dbL >= i ? sendData : null;
}

var res = game.addSpectator(player);
if (res.success) {
    //keep process running
    process.stdin.resume();
} else {
    console.log("couldn't add simulation");
}
