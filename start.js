const engine = require('./server/game/engine');
engine.loadExistingGame();

const admin = require('./server/admin/server');
admin.startServer();

const account = require('./server/account/server');
account.startServer();

const game = require('./server/game/server');
game.startServer();