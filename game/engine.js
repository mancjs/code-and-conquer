const db = require('../db/db');
const grid = require('./grid');
const log = require('../lib/log');
const team = require('./team');
const roles = require('./roles');
const clone = require('../lib/clone');
const requests = require('./requests');
const statuses = require('./statuses');

const init = gridSize => {
  const state = db.init();

  state.grid = grid.generate(gridSize.width, gridSize.height);
  requests.stopRefreshTimer();

  log('game', `initialised with ${gridSize.width}x${gridSize.height} grid`);
};

var stop = function() {
  var state = db.get();

  state.gameStarted = false;

  if (process.env.NODE_ENV !== 'test') {
    requests.stopRefreshTimer();
  }

  db.takeFinalSnapshot();
  log('game', 'stopped');
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
    return statuses.gameNotStarted;
  }

  if (!team.hasRequests(key)) {
    return statuses.noRequestsLeft;
  }
};

const attack = (key, x, y) => {
  const verificationError = verifyTeam(key);

  if (verificationError) {
    return { status: verificationError };
  }

  var redirection = roles.isTeamRedirected(key);

  if (redirection) {
    x = redirection.x;
    y = redirection.y;
  }

  const state = db.get();
  let cell = grid.getCell(state.grid, x, y);

  if (!cell) {
    return { 
      status: statuses.invalidCell,
      result: { x, y }  
    };
  }

  const mineResult = roles.checkMineTrigger(key, x, y);

  if (mineResult.triggered) {
    team.useAllRequests(key);

    return {
      status: statuses.infoMineTriggered,
      result: {
        requestsRemaining: team.getRequestsRemaining(key),
        owner: mineResult.owner
      }
    };
  }

  cell.health -= 1;

  const teamData = team.getPublicData(key);

  if (cell.health <= 0) {
    grid.setCellOwner(cell, teamData);
    log('game', `${teamData.name} conquered cell ${x},${y} from ${cell.owner.name}`);
  } else {
    grid.addCellAttackHistory(cell, teamData.name, teamData.colour);
  }

  team.useRequest(key);

  return {
    status: statuses.ok,
    result: {
      requestsRemaining: team.getRequestsRemaining(key)
    }
  };
};

const defend = (key, x, y) => {
  const verificationError = verifyTeam(key);

  if (verificationError) {
    return { status: verificationError };
  }

  const redirection = roles.isTeamRedirected(key);

  if (redirection) {
    x = redirection.x;
    y = redirection.y;
  }

  const state = db.get();
  const cell = grid.getCell(state.grid, x, y);

  if (!cell) {
    return { 
      status: statuses.invalidCell,
      result: { x, y }  
    };
  }

  const mineResult = roles.checkMineTrigger(key, x, y);

  if (mineResult.triggered) {
    team.useAllRequests(key);

    return {
      status: statuses.infoMineTriggered,
      result: {
        requestsRemaining: team.getRequestsRemaining(key),
        owner: mineResult.owner
      }
    };
  }

  cell.health += 1;

  const maxHealth = (cell.owner.name === 'cpu') ? 60 : 120;

  if (cell.health > maxHealth) {
    cell.health = maxHealth;
  }

  grid.addCellDefendHistory(cell, team.getPublicData(key).name);

  team.useRequest(key);

  return {
    status: statuses.ok,
    result: {
      requestsRemaining: team.getRequestsRemaining(key)
    }
  };
};

const query = () => {
  const state = db.get();

  if (!state.grid) {
    return {
      status: statuses.ok,
      result: {
        grid: [],
        gameStarted: false
      }
    };
  }

  const grid = clone(state.grid);

  roles.updateGridWithCloaks(grid);

  return {
    status: statuses.ok,
    result: {
      grid: grid.cells,
      gameStarted: state.gameStarted
    }
  };
};

const roleVerify = (key, role) => {
  const verificationError = verifyTeam(key);

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

  if (!state.grid) {
    return null;
  }

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
  stop: stop,
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