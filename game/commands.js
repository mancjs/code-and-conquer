'use strict';

const statuses = require('./statuses');
const engine = require('./engine');

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

const attack = (team, args) => {
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

const query = () => {
  return engine.query();
};

module.exports = {
  attack,
  defend,
  query
};