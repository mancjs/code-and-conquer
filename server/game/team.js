'use strict';

const config = require('../../config');
const db = require('../../lib/db');

const getByKey = key => {
  return db.get().teams.filter(team => {
    return team.key === key;
  })[0];
};

const existsByName = name => {
  const team = db.get().teams.filter(team => {
    return team.name === name;
  })[0];

  return !!team;
};

const hasRequests = key => {
  const team = getByKey(key);
  return team && team.requests > 0;
};

const useRequest = key => {
  getByKey(key).requests -= 1;
};

const useAllRequests = key => {
  getByKey(key).requests = 0;
};

const resetRequests = () => {
  db.get().teams.forEach(team => {
    team.requests = config.game.requests.amount;
  });
};

const getRequestsRemaining = key => {
  return getByKey(key).requests;
};

const getPublicData = key => {
  const team = getByKey(key);

  return {
    name: team.name,
    colour: team.colour
  };
};

module.exports = {
  existsByName,
  hasRequests,
  useRequest,
  useAllRequests,
  resetRequests,
  getRequestsRemaining,
  getPublicData
};
