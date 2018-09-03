const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const WebSocketServer = require("websocket").server;
const newGame = require("./game.js");
const express = require("express");
var app = express();

var port = process.env.PORT || 8081,
    ip   = process.env.IP || "0.0.0.0";

//start with a game
var currentGameId = 0;
var activeGames = {"0":newGame()};

app.use(function(req,res,next) {
    var svrUrl = url.parse(req.url);
    var filename = svrUrl.pathname;
    //paths with numbers in them correspond to specific games
    filename = filename.substr(1);
    if (!filename || filename === "game" || activeGames.hasOwnProperty(filename)) {
        filename = "Double Series.html";
    } else if (filename === "replay") {
        //if no game specified, show replay list
        if (svrUrl.query) {
            filename = "replay.html";
        } else {
            filename = "replayList.html";
        }
    }
    req.url = "/" + filename;
    next();
});
app.use(express.static("./"));
app.get("/replayList.json",function(req,res,next) {
    fs.readdir("games",function(err,files) {
        if (err) {
            res.status(404).send("something went wrong");
        } else {
            res.json(files);
        }
    });
});
// do this for websocket
var server = http.createServer(app);
server.listen(port,function() {
    console.log("Server running at http://" + ip + ":" + port);
});

var wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on("request", function(request) {
    var connection = request.accept(null, request.origin);
    var query = request && request.resourceURL && request.resourceURL.query;
    var gameId = query.game;

    var messageHandler;
    var closeHandler;

    var sendData = function(info) {
        connection.sendUTF(JSON.stringify(info));
    };

    if (!joinGame(gameId)) {
        sendData({type:"home"});
        messageHandler = function(message) {
            var query = JSON.parse(message);
            var type = query ? query.type : "";
            switch(type) {
                case "getGames":
                    var list = [];
                    for (var gameId in activeGames) {
                        list.push([gameId,activeGames[gameId].spaces()]);
                    }
                    var ret = {type:"getGames",games:list};
                    sendData(ret);
                    break;
                case "joinGame":
                    joinGame(query.gameId,query.name);
                    break;
                case "createGame":
                    var thisGame = newGame();
                    currentGameId++;
                    activeGames[currentGameId] = thisGame;
                    joinGame(currentGameId,query.name);
                    break;
            }
        };
    }

    //these allow changes in the functions outside
    connection.on("message", function(message) {
        if (message.type === "utf8" && typeof messageHandler === "function") {
            messageHandler(message.utf8Data);
        }
    });

    connection.on("close", function() {
        if (typeof closeHandler === "function") {
            closeHandler();
        }
    });

    function joinGame(gameId,name) {
        if (activeGames.hasOwnProperty(gameId)) {
            var game = activeGames[gameId];
            var playCallback;
            var startCallback;

            var play = function(a,b,c,callback) {
                playCallback = callback;
            }

            var newGame = function(callback) {
                startCallback = callback;
            }

            var player = {
                play:play,
                newGame:newGame,
                onNewGame:sendData,
                onPlay:sendData,
                onEndGame:sendData,
                onChange:sendData,
                name:name
            };

            function playerObj(info) {
                info.gameId = gameId;
                sendData(info);
                return player;
            }
            //var res = game.addSpectator(player);
            var res = game.addHuman(playerObj);
            if (res.success) {
                messageHandler = function(message) {
                    var query = JSON.parse(message);
                    var type = query ? query.type : "";
                    switch(type) {
                        case "play":
                            if (typeof playCallback === "function") {
                                //the callback can set itself again, reset it before calling
                                var callback = playCallback;
                                playCallback = null;
                                callback(query.result);
                            } else {
                                console.log("not your turn?");
                            }
                            break;
                        case "change":
                            res.change(query.name);
                            break;
                        case "start":
                            if (typeof startCallback === "function") {
                                //the callback can set itself again, reset it before calling
                                var callback = startCallback;
                                startCallback = null;
                                callback(query.result);
                            } else {
                                console.log("game not ended?");
                            }
                            break;
                    }
                };
                closeHandler = res.remove;
                return true;
            }
        }
        return false;
    }
});
