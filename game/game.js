var db = require('../db/db');
var grid = require('./grid');
var log = require('../lib/log');

var start = function(gridSize) {
  var game = db.clear();

  game.grid = grid.generate(gridSize.width, gridSize.height);
  game.date = new Date;

  log('game', 'started with ' + gridSize.width + 'x' + gridSize.height + ' grid');
};

var getStatus = function() {
  var grid = db.get().grid;

  return {
    width: grid.width || 0,
    height: grid.height || 0,
    doubleSquares: grid.doubleSquares || 0,
    tripleSquares: grid.tripleSquares || 0
  };
};

var loadExistingGame = function() {
  db.load();
};

module.exports = {
  start: start,
  getStatus: getStatus,
  loadExistingGame: loadExistingGame
};