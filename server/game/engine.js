const db = require('../../db/db');
const grid = require('./grid');
const log = require('../../lib/log');
const team = require('./team');
const roles = require('./roles');
const clone = require('../../lib/clone');
const requests = require('./requests');
const statuses = require('./statuses');
const config = require('../../config');

const verifyTeam = (key) => {
  if (!db.get().gameStarted) {
    return statuses.gameNotStarted;
  }

  if (!team.hasRequests(key)) {
    return statuses.noRequestsLeft;
  }
};

const roleVerify = (key, role) => {
  if (!roles.verify(key, role)) {
    return statuses.roleNotAssigned;
  }

  if (roles.roleUsed(key)) {
    return statuses.roleAlreadyUsed;
  }
};

const init = gridSize => {
  const state = db.init();

  state.grid = grid.generate(gridSize.width, gridSize.height);
  requests.stopRefreshTimer();

  log('game', `initialised with ${gridSize.width}x${gridSize.height} grid`);
};

const loadExistingGame = () => {
  const state = db.load();

  if (state.gameStarted) {
    requests.startRefreshTimer();
    log('game', `loaded game from ${new Date(state.date)}`);
  }
};

const getStatus = () => {
  const state = db.get();

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

const start = () => {
  const state = db.get();

  state.gameStarted = true;

  if (process.env.NODE_ENV !== 'test') {
    requests.startRefreshTimer();
  }

  log('game', 'started');
};

const stop = () => {
  const state = db.get();

  state.gameStarted = false;

  if (process.env.NODE_ENV !== 'test') {
    requests.stopRefreshTimer();
  }

  db.takeFinalSnapshot();
  log('game', 'stopped');
};

const attack = (key, x, y) => {
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
      status: statuses.okMineTriggered,
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
      status: statuses.okMineTriggered,
      result: {
        requestsRemaining: team.getRequestsRemaining(key),
        owner: mineResult.owner
      }
    };
  }

  cell.health += 1;

  const { cpu, player } = config.game.health;
  const maxHealth = (cell.owner.name === 'cpu') ? cpu : player;

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

const mine = (key, x, y) => {
  const verificationError = verifyTeam(key);

  if (verificationError) {
    return { status: verificationError };
  }

  const roleError = roleVerify(key, 'minelayer');

  if (roleError) {
    return { status: roleError };
  }

  const state = db.get();
  const cell = grid.getCell(state.grid, x, y);

  if (!cell) {
    return { 
      status: statuses.invalidCell,
      result: { x, y }  
    };
  }

  team.useRequest(key);
  roles.useRole(key);

  const mineResult = roles.checkMineTrigger(key, x, y);

  if (mineResult.triggered) {
    team.useAllRequests(key);

    return {
      status: statuses.okMineTriggered,
      result: {
        requestsRemaining: team.getRequestsRemaining(key),
        owner: mineResult.owner
      }
    };
  }

  roles.setMine(key, x, y);

  return {
    status: statuses.ok,
    result: {
      requestsRemaining: team.getRequestsRemaining(key)
    }
  };
};

const cloak = (key, cells) => {
  const roleError = roleVerify(key, 'cloaker');

  if (roleError) {
    return { status: roleError };
  }

  if (cells.length > 3) {
    return { 
      status: statuses.roleTooManyCells,
      result: { maxCells: 3 } 
    };
  }

  const state = db.get();

  for (let i = 0; i < cells.length; i++) {
    const cell = grid.getCell(state.grid, cells[i].x, cells[i].y);

    if (!cell) {
      return { 
        status: statuses.invalidCell,
        result: { x: cells[i].x, y: cells[i].y }  
      };
    }
  }

  roles.setCloak(key, cells);
  team.useRequest(key);
  roles.useRole(key);

  return {
    status: statuses.ok,
    result: {
      requestsRemaining: team.getRequestsRemaining(key)
    }
  };
};

const spy = (key, teamName, x, y) => {
  const roleError = roleVerify(key, 'spy');

  if (roleError) {
    return { status: roleError };
  }

  if (!team.existsByName(teamName)) {
    return { 
      status: statuses.roleTeamNotFound,
      result: {
        team: teamName
      } 
    };
  }

  const state = db.get();
  const cell = grid.getCell(state.grid, x, y);

  if (!cell) {
    return { 
      status: statuses.invalidCell,
      result: { x, y }  
    };
  }

  roles.setSpy(key, teamName, x, y);
  team.useRequest(key);
  roles.useRole(key);

  return {
    status: statuses.ok,
    result: {
      requestsRemaining: team.getRequestsRemaining(key)
    }
  };
};

module.exports = {
  init,
  loadExistingGame,
  getStatus,
  start,
  stop,
  attack,
  defend,
  query,
  mine,
  cloak,
  spy  
};