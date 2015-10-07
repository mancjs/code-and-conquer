var db = require('../db/db');

var test = {
  timeOverride: null
};

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
    state.roleData.cloaks.push({
      cloakTime: new Date().getTime(),
      owner: team.name,
      x: cell.x,
      y: cell.y
    });
  });
};

var updateGridWithCloaks = function(grid) {
  var state = db.get();

  var cloakValidityMs = 5 * 60 * 1000;

  state.roleData.cloaks.filter(function(cloak) {
    var age = (test.timeOverride || new Date().getTime()) - cloak.cloakTime;
    return age <= cloakValidityMs;
  }).forEach(function(cloak) {
    grid.cells[cloak.y][cloak.x].health = 120;
  });
};

var setCurrentTime = function(time) {
  test.timeOverride = time;
};

module.exports = {
  verify: verify,
  useRole: useRole,
  roleUsed: roleUsed,
  setMine: setMine,
  checkMineTrigger: checkMineTrigger,
  setCloak: setCloak,
  updateGridWithCloaks: updateGridWithCloaks,
  test: {
    setCurrentTime: setCurrentTime
  }
};