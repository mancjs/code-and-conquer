var engine = require('./game/engine');
engine.loadExistingGame();

var admin = require('./admin/server');
admin.startServer(9000);

var account = require('./account/server');
account.startServer(9001);

// var game = require('./game/server');
// game.startServer(9002);