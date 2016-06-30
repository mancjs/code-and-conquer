'use strict';

const config = require('../../config');
const engine = require('./engine');
const statuses = require('./statuses');

let teamQueryHistory = {};

const queryLimitHit = team => {
  if (!teamQueryHistory[team]) {
    teamQueryHistory[team] = new Date;
    return false;
  }

  const gap = new Date - teamQueryHistory[team];
  teamQueryHistory[team] = new Date;

  return gap < config.server.game.minQueryGap;
};

const verifyProtocol = (team, args, argCount) => {
  if (!team) {
    return statuses.protocolMissingTeam;
  }

  if (!args || args.length !== argCount) {
    return statuses.protocolBadArgs;
  }
};

const verifySingleCellRequest = request => {
  if (!request.team) {
    return statuses.missingTeamKey;
  }

  const isEmpty = str => {
    return str === undefined || str === '';
  };

  if (isEmpty(request.x)) {
    return statuses.missingXCoord;
  }

  if (isEmpty(request.y)) {
    return statuses.missingYCoord;
  }
};

const verifyMultipleCellRequest = request => {
  if (!request.team) {
    return statuses.missingTeamKey;
  }

  if (!request.cells || request.cells.length > 0) {
    return statuses.missingCells;
  }

  const isEmpty = str => {
    return str === undefined || str === '';
  };

  for (let i = 0; i < request.cells.length; i++) {
    const cell = request.cells[i];

    if (isEmpty(cell.x)) {
      return statuses.missingXCoord;
    } 

    if (isEmpty(cell.y)) {
      return statuses.missingYCoord;
    }    
  }
};

const verifySpyRequest = request => {
  if (!request.team) {
    return statuses.missingTeamKey;
  }

  if (!request.target) {
    return statuses.missingTargetTeam;
  }

  const isEmpty = str => {
    return str === undefined || str === '';
  };

  if (isEmpty(request.x)) {
    return statuses.missingXCoord;
  }

  if (isEmpty(request.y)) {
    return statuses.missingYCoord;
  }
};

const ping = () => {
  return { status: statuses.okPong };
};

const attack = (team, args) => {
  const protocolError = verifyProtocol(team, args, 1);

  if (protocolError) {
    return { status: protocolError };
  }

  const request = {
    team: team,
    x: args[0].split(',')[0],
    y: args[0].split(',')[1]
  };

  const error = verifySingleCellRequest(request);

  if (error) {
    return { status: error };
  }

  return engine.attack(request.team, request.x, request.y);
};

const defend = (team, args) => {
  const protocolError = verifyProtocol(team, args, 1);

  if (protocolError) {
    return { status: protocolError };
  }

  const request = {
    team: team,
    x: args[0].split(',')[0],
    y: args[0].split(',')[1]
  };

  const error = verifySingleCellRequest(request);

  if (error) {
    return { status: error };
  }

  return engine.defend(request.team, request.x, request.y);
};

const query = team => {
  if (!team) {
    return { status: statuses.protocolMissingTeam };
  }

  const limitError = queryLimitHit(team);

  if (limitError) {
    return { status: statuses.protocolRateLimit };
  }

  return engine.query(team);
};

const mine = (team, args) => {
  const protocolError = verifyProtocol(team, args, 1);

  if (protocolError) {
    return { status: protocolError };
  }

  const request = {
    team: team,
    x: args[0].split(',')[0],
    y: args[0].split(',')[1]
  };

  const error = verifySingleCellRequest(request);

  if (error) {
    return { status: error };
  }

  return engine.mine(request.team, request.x, request.y);
}; 

const cloak = (team, args) => {
  const protocolError = verifyProtocol(team, args, 3);

  if (protocolError) {
    return { status: protocolError };
  }

  const request = {
    team: team,
    cells: args.map(arg => {
      return {
        x: arg.split(',')[0],
        y: arg.split(',')[1]
      };
    })
  };

  const error = verifyMultipleCellRequest(request);

  if (error) {
    return { status: error };
  }

  return engine.cloak(request.team, request.cells);
};

const spy = (team, args) => {
  const protocolError = verifyProtocol(team, args, 2);

  if (protocolError) {
    return { status: protocolError };
  }

  const request = {
    team: team,
    target: args[0],
    x: args[1].split(',')[0],
    y: args[1].split(',')[1]
  };

  const error = verifySpyRequest(request);

  if (error) {
    return { status: error };
  }

  return engine.spy(request.team, request.target, request.x, request.y);
};

module.exports = {
  ping,
  attack,
  defend,
  query,
  mine,
  cloak,
  spy
};