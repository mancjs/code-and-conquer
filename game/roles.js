var db = require('../db/db');

var getTeamByKey = function(key) {
  return db.get().teams.filter(function(team) {
    return team.key === key;
  })[0];
};

var verify = function(key, role) {
  return getTeamByKey(key).role === role;
};

var useRole = function(key) {
  getTeamByKey(key).roleUsed = true;
};

var roleUsed = function(key) {
  return getTeamByKey(key).roleUsed;
};

var setMine = function(key, x, y) {
  var state = db.get();
  var team = getTeamByKey(key);

  state.roleData.mines[x + ',' + y] = { triggered: false, owner: team.name };
};

var checkMineTrigger = function(key, x, y) {
  var state = db.get();

  var mineData = state.roleData.mines[x + ',' + y];

  if (mineData && !mineData.triggered) {
    mineData.triggered = true;
    mineData.triggeredBy = getTeamByKey(key).name;

    return {
      triggered: true,
      owner: mineData.owner
    };
  }

  return {
    triggered: false
  };
};

var setCloak = function(key, cells) {
  if (!cells.length) {
    return;
  }

  var state = db.get();
  var team = getTeamByKey(key);

  cells.forEach(function(cell) {
    state.roleData.cloaks[cell.x + ',' + cell.y] = { cloakTime: new Date().getTime(), owner: team.name };
  });
};

module.exports = {
  verify: verify,
  useRole: useRole,
  roleUsed: roleUsed,
  setMine: setMine,
  checkMineTrigger: checkMineTrigger,
  setCloak: setCloak
};