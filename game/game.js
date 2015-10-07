var db = require('../db/db');
var grid = require('./grid');
var log = require('../lib/log');
var team = require('./team');
var roles = require('./roles');
var events = require('./events');
var clone = require('../lib/clone');
var requests = require('./requests');

var init = function(gridSize) {
  var state = db.init();

  state.grid = grid.generate(gridSize.width, gridSize.height);
  requests.stopRefreshTimer();

  log('game', 'initialised with ' + gridSize.width + 'x' + gridSize.height + ' grid');
};

var start = function() {
  var state = db.get();

  state.gameStarted = true;

  if (process.env.NODE_ENV !== 'test') {
    requests.startRefreshTimer();
  }

  log('game', 'started');
};

var loadExistingGame = function() {
  var state = db.load();

  if (state.gameStarted) {
    requests.startRefreshTimer();
    log('game', 'loaded game from ' + new Date(state.date));
  }
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

  var redirection = roles.isTeamRedirected(key);

  if (redirection) {
    x = redirection.x;
    y = redirection.y;
  }

  var state = db.get();
  var cell = grid.getCell(state.grid, x, y);

  if (!cell) {
    return { err: ['no cell found at ', x, ',', y].join('') };
  }

  var mineResult = roles.checkMineTrigger(key, x, y);

  if (mineResult.triggered) {
    team.useAllRequests(key);

    return {
      requestsRemaining: team.getRequestsRemaining(key),
      triggeredMine: { owner: mineResult.owner }
    };
  }

  cell.health -= 1;

  var teamData = team.getPublicData(key);

  if (cell.health <= 0) {
    events.squareConquered({
      coords: { x: x, y: y },
      previousOwner: cell.owner.name,
      newOwner: teamData.name
    });

    grid.setCellOwner(cell, teamData);
  } else {
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

  var redirection = roles.isTeamRedirected(key);

  if (redirection) {
    x = redirection.x;
    y = redirection.y;
  }

  var state = db.get();
  var cell = grid.getCell(state.grid, x, y);

  if (!cell) {
    return { err: ['no cell found at ', x, ',', y].join('') };
  }

  var mineResult = roles.checkMineTrigger(key, x, y);

  if (mineResult.triggered) {
    team.useAllRequests(key);

    return {
      requestsRemaining: team.getRequestsRemaining(key),
      triggeredMine: { owner: mineResult.owner }
    };
  }

  cell.health += 1;

  var maxHealth = (cell.owner.name === 'cpu') ? 60 : 120;

  if (cell.health > maxHealth) {
    cell.health = maxHealth;
  }

  grid.addCellDefendHistory(cell, team.getPublicData(key).name);

  team.useRequest(key);

  return {
    requestsRemaining: team.getRequestsRemaining(key)
  };
};

var query = function() {
  var state = db.get();
  var grid = clone(state.grid);

  roles.updateGridWithCloaks(grid);

  return {
    grid: grid.cells,
    gameStarted: state.gameStarted
  };
};

var roleVerify = function(key, role) {
  var verificationError = verifyTeam(key);

  if (verificationError) {
    return verificationError;
  }

  if (!roles.verify(key, role)) {
    return { err: 'you are not a ' + role };
  }

  if (roles.roleUsed(key)) {
    return { err: 'you can only play a role once' };
  }

  return {
    ok: true
  };
};

var layMine = function(key, x, y) {
  var result = roleVerify(key, 'minelayer');

  if (result.err) {
    return result;
  }

  var state = db.get();
  var cell = grid.getCell(state.grid, x, y);

  if (!cell) {
    return { err: ['no cell found at ', x, ',', y].join('') };
  }

  team.useRequest(key);
  roles.useRole(key);

  var mineResult = roles.checkMineTrigger(key, x, y);

  if (mineResult.triggered) {
    team.useAllRequests(key);

    return {
      requestsRemaining: team.getRequestsRemaining(key),
      triggeredMine: { owner: mineResult.owner }
    };
  }

  roles.setMine(key, x, y);

  return {
    requestsRemaining: team.getRequestsRemaining(key)
  };
};

var cloak = function(key, cells) {
  var result = roleVerify(key, 'cloaker');

  if (result.err) {
    return result;
  }

  if (cells.length > 3) {
    return { err: 'cloakers can cloak up to 3 cells max' };
  }

  var state = db.get();

  for (var i = 0; i < cells.length; i++) {
    var cell = grid.getCell(state.grid, cells[i].x, cells[i].y);

    if (!cell) {
      return { err: ['no cell found at ', cells[i].x, ',', cells[i].y].join('') };
    }
  }

  roles.setCloak(key, cells);

  team.useRequest(key);
  roles.useRole(key);

  return {
    requestsRemaining: team.getRequestsRemaining(key)
  };
};

var spy = function(key, teamName, x, y) {
  var result = roleVerify(key, 'spy');

  if (result.err) {
    return result;
  }

  if (!team.existsByName(teamName)) {
    return { err: 'team not found: ' + teamName };
  }

  var state = db.get();
  var cell = grid.getCell(state.grid, x, y);

  if (!cell) {
    return { err: ['no cell found at ', x, ',', y].join('') };
  }

  roles.setSpy(key, teamName, x, y);

  team.useRequest(key);
  roles.useRole(key);

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

module.exports = {
  init: init,
  start: start,
  attack: attack,
  defend: defend,
  query: query,
  layMine: layMine,
  cloak: cloak,
  spy: spy,
  getStatus: getStatus,
  loadExistingGame: loadExistingGame
};