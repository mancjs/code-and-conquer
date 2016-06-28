'use strict';

const config = require('../../config');
const log = require('../../lib/log');
const team = require('./team');

let interval;
let lastRefresh;

const startRefreshTimer = refreshRateSecs => {
  team.resetRequests();
  lastRefresh = new Date;

  const refresh = () => {
    if (new Date - lastRefresh >= (refreshRateSecs || config.game.requests.refresh) * 1000) {
      team.resetRequests();
      lastRefresh = new Date;
      log('requests', 'replenished all');
    }
  };

  stopRefreshTimer();
  interval = setInterval(refresh, 900);
  log('requests', 'refresh timer started');
};

const stopRefreshTimer = () => {
  clearInterval(interval);
};

const getSecondsUntilNextRefresh = args => {
  const refreshRateSecs = args.refreshRateSecs || config.game.requests.refresh;
  const currentTime = args.currentTime || new Date;
  const lastRefreshTime = args.lastRefresh || lastRefresh;

  return Math.round(refreshRateSecs - ((currentTime - lastRefreshTime) / 1000));
};

module.exports = {
  startRefreshTimer,
  stopRefreshTimer,
  getSecondsUntilNextRefresh
};
