var db = require('../db/db');

var getByKey = function(key) {
  return db.get().teams.filter(function(team) {
    return team.key === key;
  })[0];
};

var hasRequests = function(key) {
  var team = getByKey(key);
  return team && team.requests > 0;
};

var useRequest = function(key) {
  getByKey(key).requests -= 1;
};

var useAllRequests = function(key) {
  getByKey(key).requests = 0;
};

var resetRequests = function() {
  db.get().teams.forEach(function(team) {
    team.requests = 30;
  });
};

var getRequestsRemaining = function(key) {
  return getByKey(key).requests;
};

var getPublicData = function(key) {
  var team = getByKey(key);

  return {
    name: team.name,
    colour: team.colour
  };
};

module.exports = {
  hasRequests: hasRequests,
  useRequest: useRequest,
  useAllRequests: useAllRequests,
  resetRequests: resetRequests,
  getRequestsRemaining: getRequestsRemaining,
  getPublicData: getPublicData
};