var team = require('./team');
var log = require('../../lib/log');

const config = require('../../config');

var interval;
var lastRefresh;

var startRefreshTimer = function(refreshRateSecs) {
  team.resetRequests();
  lastRefresh = new Date;

  var refresh = function() {
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

var stopRefreshTimer = function() {
  clearInterval(interval);
};

var getSecondsUntilNextRefresh = function(args) {
  var refreshRateSecs = args.refreshRateSecs || config.game.requests.refresh;
  var currentTime = args.currentTime || new Date;
  var lastRefreshTime = args.lastRefresh || lastRefresh;

  return Math.round(refreshRateSecs - ((currentTime - lastRefreshTime) / 1000));
};

module.exports = {
  startRefreshTimer: startRefreshTimer,
  stopRefreshTimer: stopRefreshTimer,
  getSecondsUntilNextRefresh: getSecondsUntilNextRefresh
};