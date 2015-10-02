var db = require('../db/db');
var grid = require('./grid');
var log = require('../lib/log');
var team = require('./team');

var start = function(gridSize) {
  var state = db.init();

  state.grid = grid.generate(gridSize.width, gridSize.height);

  log('game', 'started with ' + gridSize.width + 'x' + gridSize.height + ' grid');
};

var attack = function(key, x, y) {
  if (!team.hasRequests(key)) {
    return { err: 'no requests left' };
  }

  var state = db.get();
  var cell = grid.getCell(state.grid, x, y);

  if (!cell) {
    return { err: ['no cell found at ', x, ',', y].join('') };
  }

  cell.health -= 1;

  if (cell.health <= 0) {
    grid.setCellOwner(cell, team.getPublicData(key));
  } else {
    grid.addCellAttackHistory(cell, key);
  }

  team.useRequest(key);

  return {
    requestsRemaining: team.getRequestsRemaining(key)
  };
};

var defend = function(key, x, y) {
  if (!team.hasRequests(key)) {
    return { err: 'no requests left' };
  }

  var state = db.get();
  var cell = grid.getCell(state.grid, x, y);

  if (!cell) {
    return { err: ['no cell found at ', x, ',', y].join('') };
  }

  cell.health += 1;

  var maxHealth = (cell.owner.name === 'cpu') ? 60 : 120;

  if (cell.health > maxHealth) {
    cell.health = maxHealth;
  }

  grid.addCellDefendHistory(cell, key);

  team.useRequest(key);

  return {
    requestsRemaining: team.getRequestsRemaining(key)
  };
};

// setTimeout(function() {
//   console.log(attack('12wdfcqx'));
// }, 1000);

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
  attack: attack,
  defend: defend,
  getStatus: getStatus,
  loadExistingGame: loadExistingGame
};