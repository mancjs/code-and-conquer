const engine = require('./game/engine');
engine.loadExistingGame();

const admin = require('./admin/server');
admin.startServer(9000);

const account = require('./account/server');
account.startServer(9001);

const game = require('./game/server');
game.startServer(9002);