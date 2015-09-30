var game = require('./game/game');
game.loadExistingGame();

var api = require('./api/api');
api.startServer(9000);

var admin = require('./admin/admin');
admin.startServer(9001);