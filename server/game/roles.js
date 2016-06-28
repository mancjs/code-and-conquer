var db = require('../../db/db');
var log = require('../../lib/log');

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
  team.mineSetAt = x + ',' + y;

  log('roles', team.name + ' set mine at ' + x + ',' + y);
};

var checkMineTrigger = function(key, x, y) {
  var state = db.get();

  var mineData = state.roleData.mines[x + ',' + y];

  if (mineData && !mineData.triggered) {
    mineData.triggered = true;
    mineData.triggeredBy = getTeamByKey(key).name;

    var owner = getTeamByName(mineData.owner);
    owner.mineTriggeredBy = mineData.triggeredBy;

    log('roles', mineData.owner + '\'s mine triggered by ' + mineData.triggeredBy);

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

  log('roles', team.name + ' deployed cloak');
};

var updateGridWithCloaks = function(grid) {
  var state = db.get();

  var cloakValidityMs = 5 * 60 * 1000;

  state.roleData.cloaks.filter(function(cloak) {
    var age = (test.timeOverride || new Date().getTime()) - cloak.cloakTime;
    return age <= cloakValidityMs;
  }).forEach(function(cloak) {
    grid.cells[cloak.y][cloak.x].health = 120;
    grid.cells[cloak.y][cloak.x].history = { attacks: {}, defends: {} };
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

  log('roles', team.name + ' set redirect on ' + team.redirectedTeam + ' to ' + x + ',' + y);
};

var isTeamRedirected = function(key) {
  var state = db.get();
  var team = getTeamByKey(key);

  var redirect = state.roleData.redirects[team.name];

  if (redirect && redirect.remaining > 0) {
    redirect.remaining -= 1;

    log('roles', team.name + '\'s request redirected to ' + redirect.x + ',' + redirect.y);

    return {
      x: redirect.x,
      y: redirect.y
    };
  }

  return false;
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
  isTeamRedirected: isTeamRedirected,
  test: {
    setCurrentTime: setCurrentTime
  }
};