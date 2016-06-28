'use strict';

const config = require('../../config');
const db = require('../../lib/db');
const log = require('../../lib/log');

let test = {
  timeOverride: null
};

const getTeamByKey = key => {
  return db.get().teams.filter(team => {
    return team.key === key;
  })[0];
};

const getTeamByName = name => {
  return db.get().teams.filter(team => {
    return team.name === name;
  })[0];
};

const verify = (key, role) => {
  return getTeamByKey(key).role === role;
};

const useRole = key => {
  getTeamByKey(key).roleUsed = true;
};

const roleUsed = key => {
  return getTeamByKey(key).roleUsed;
};

const setMine = (key, x, y) => {
  const state = db.get();
  const team = getTeamByKey(key);

  state.roleData.mines[`${x},${y}`] = { triggered: false, owner: team.name };
  team.mineSetAt = `${x},${y}`;

  log('roles', `${team.name} set mine at ${x},${y}`);
};

const checkMineTrigger = (key, x, y) => {
  const state = db.get();

  const mineData = state.roleData.mines[`${x},${y}`];

  if (mineData && !mineData.triggered) {
    mineData.triggered = true;
    mineData.triggeredBy = getTeamByKey(key).name;

    const owner = getTeamByName(mineData.owner);
    owner.mineTriggeredBy = mineData.triggeredBy;

    log('roles', `${mineData.owner}'s mine triggered by ${mineData.triggeredBy}`);

    return {
      triggered: true,
      owner: mineData.owner
    };
  }

  return {
    triggered: false
  };
};

const setCloak = (key, cells) => {
  if (!cells.length) {
    return;
  }

  const getTimestamp = () => {
    const time = new Date;

    return [time.getHours(), time.getMinutes(), time.getSeconds()].map(part => {
      return part < 10 ? `0${part}` : part;
    }).join(':');
  };

  const state = db.get();
  const team = getTeamByKey(key);

  team.cloakTime = getTimestamp();

  team.cloakedCells = cells.map(cell => {
    return `${cell.x},${cell.y}`;
  }).join(' ');

  cells.forEach(cell => {
    state.roleData.cloaks.push({
      cloakTime: new Date().getTime(),
      owner: team.name,
      x: cell.x,
      y: cell.y
    });
  });

  log('roles', `${team.name} deployed cloak`);
};

const updateGridWithCloaks = grid => {
  const state = db.get();

  const cloakValidityMs = config.game.roles.cloak.minutes * 60 * 1000;

  state.roleData.cloaks.filter(cloak => {
    const age = (test.timeOverride || new Date().getTime()) - cloak.cloakTime;
    return age <= cloakValidityMs;
  }).forEach(cloak => {
    grid.cells[cloak.y][cloak.x].health = config.game.health.player;
    grid.cells[cloak.y][cloak.x].history = { attacks: {}, defends: {} };
  });
};

const setSpy = (key, teamName, x, y) => {
  const state = db.get();
  const team = getTeamByKey(key);

  team.redirectedTeam = getTeamByName(teamName).name;
  team.redirectedTo = `${x},${y}`;

  state.roleData.redirects[teamName] = {
    remaining: config.game.roles.spy.redirects,
    owner: team.name,
    x,
    y
  };

  log('roles', `${team.name} set redirect on ${team.redirectedTeam} to ${x},${y}`);
};

const isTeamRedirected = key => {
  const state = db.get();
  const team = getTeamByKey(key);

  let redirect = state.roleData.redirects[team.name];

  if (redirect && redirect.remaining > 0) {
    redirect.remaining -= 1;

    log('roles', `${team.name}'s request redirected to ${redirect.x},${redirect.y}`);

    return {
      x: redirect.x,
      y: redirect.y
    };
  }

  return false;
};

const setCurrentTime = time => {
  test.timeOverride = time;
};

module.exports = {
  getTeamByName,
  verify,
  useRole,
  roleUsed,
  setMine,
  checkMineTrigger,
  setCloak,
  updateGridWithCloaks,
  setSpy,
  isTeamRedirected,
  test: { setCurrentTime }
};
