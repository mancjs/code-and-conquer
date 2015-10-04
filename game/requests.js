var team = require('./team');
var log = require('../lib/log');

var interval;
var lastRefresh;

var startRefreshTimer = function(refreshRateSecs) {
  team.resetRequests();
  lastRefresh = new Date;

  var refresh = function() {
    if (new Date - lastRefresh >= (refreshRateSecs || 60) * 1000) {
      team.resetRequests();
      lastRefresh = new Date;
      log('requests', 'replenished all');
    }
  };

  clearInterval(interval);
  interval = setInterval(refresh, 900);
  log('requests', 'refresh timer started');
};

var getSecondsUntilNextRefresh = function(args) {
  var refreshRateSecs = args.refreshRateSecs || 60;
  var currentTime = args.currentTime || new Date;
  var lastRefreshTime = args.lastRefresh || lastRefresh;

  return Math.round(refreshRateSecs - ((currentTime - lastRefreshTime) / 1000));
};

module.exports = {
  startRefreshTimer: startRefreshTimer,
  getSecondsUntilNextRefresh: getSecondsUntilNextRefresh
};

startRefreshTimer();