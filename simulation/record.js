var WebSocketClient = require('websocket').client;
const fs = require("fs");
 
var allGames = [];
function run(game) {
    var client = new WebSocketClient();
    client.on('connectFailed', function(error) {
        console.log('Connect Error: ' + error.toString());
    });
     
    client.on('connect', function(connection) {
        connection.on('error', function(error) {
            console.log('Connection Error: ' + error.toString());
        });
        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                var data = JSON.parse(message.utf8Data);
                if (data.type === 'start') {
                    allGames[game] = data;
                    console.log(game)
                    connection.close()
                    run(game+1)
                } else if (data.type === 'home') {
                    fs.writeFile("record.json",JSON.stringify(allGames));
                    connection.close()
                }
            }
        });
    });
     
    client.connect('ws://sample-env.whhkfidpsv.us-west-2.elasticbeanstalk.com/websocket?game=' + game);
}
run(0)
