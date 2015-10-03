var db = require('../db/db');
var grid = require('./grid');
var log = require('../lib/log');
var team = require('./team');
//var events = require('./events');

var init = function(gridSize) {
  var state = db.init();
  state.grid = grid.generate(gridSize.width, gridSize.height);

  log('game', 'initialised with ' + gridSize.width + 'x' + gridSize.height + ' grid');
};

var start = function() {
  var state = db.get();
  state.gameStarted = true;

  log('game', 'started');
};

var verifyTeam = function(key) {
  if (!db.get().gameStarted) {
    return { err: 'game not started' };
  }

  if (!team.hasRequests(key)) {
    return { err: 'no requests left' };
  }
};

var attack = function(key, x, y) {
  var verificationError = verifyTeam(key);

  if (verificationError) {
    return verificationError;
  }

  var state = db.get();
  var cell = grid.getCell(state.grid, x, y);

  if (!cell) {
    return { err: ['no cell found at ', x, ',', y].join('') };
  }

  cell.health -= 1;

  if (cell.health <= 0) {
    grid.setCellOwner(cell, team.getPublicData(key));
    //events.add(message);
  } else {
    var teamData = team.getByKey(key);
    grid.addCellAttackHistory(cell, teamData.name, teamData.colour);
  }

  team.useRequest(key);

  return {
    requestsRemaining: team.getRequestsRemaining(key)
  };
};

var defend = function(key, x, y) {
  var verificationError = verifyTeam(key);

  if (verificationError) {
    return verificationError;
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

  grid.addCellDefendHistory(cell, team.getByKey(key).name);

  team.useRequest(key);

  return {
    requestsRemaining: team.getRequestsRemaining(key)
  };
};

var getStatus = function() {
  var state = db.get();

  return {
    started: state.gameStarted,
    width: state.grid.width || 0,
    height: state.grid.height || 0,
    doubleSquares: state.grid.doubleSquares || 0,
    tripleSquares: state.grid.tripleSquares || 0
  };
};

var loadExistingGame = function() {
  db.load();
};

module.exports = {
  init: init,
  start: start,
  attack: attack,
  defend: defend,
  getStatus: getStatus,
  loadExistingGame: loadExistingGame
};