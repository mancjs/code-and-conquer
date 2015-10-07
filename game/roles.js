var db = require('../db/db');

var test = {
  timeOverride: null
};

var getTeamByKey = function(key) {
  return db.get().teams.filter(function(team) {
    return team.key === key;
  })[0];
};

var getTeamByName = function(name) {
  return db.get().teams.filter(function(team) {
    return team.name === name;
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

    var owner = getTeamByName(mineData.owner);
    owner.mineTriggeredBy = mineData.triggeredBy;

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

  var getTimestamp = function() {
    var time = new Date;

    return [time.getHours(), time.getMinutes(), time.getSeconds()].map(function(part) {
      return part < 10 ? '0' + part : part;
    }).join(':');
  };

  var state = db.get();
  var team = getTeamByKey(key);

  team.cloakTime = getTimestamp();

  team.cloakedCells = cells.map(function(cell) {
    return cell.x + ',' + cell.y;
  }).join(' ');

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

var setSpy = function(key, teamName, x, y) {
  var state = db.get();
  var team = getTeamByKey(key);

  team.redirectedTeam = getTeamByName(teamName).name;
  team.redirectedTo = x + ',' + y;

  state.roleData.redirects[teamName] = {
    remaining: 15,
    owner: team.name,
    x: x,
    y: y
  };
};

var setCurrentTime = function(time) {
  test.timeOverride = time;
};

module.exports = {
  getTeamByName: getTeamByName,
  verify: verify,
  useRole: useRole,
  roleUsed: roleUsed,
  setMine: setMine,
  checkMineTrigger: checkMineTrigger,
  setCloak: setCloak,
  updateGridWithCloaks: updateGridWithCloaks,
  setSpy: setSpy,
  test: {
    setCurrentTime: setCurrentTime
  }
};