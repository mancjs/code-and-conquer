const engine = require('./server/game/engine');
engine.loadExistingGame();

const admin = require('./server/admin/server');
admin.startServer(9000);

const account = require('./server/account/server');
account.startServer(9001);

const game = require('./server/game/server');
game.startServer(9002);