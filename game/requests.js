var team = require('./team');

var interval;
var lastRefresh;

var startRefreshTimer = function(refreshRateSecs) {
  team.resetRequests();
  lastRefresh = new Date;

  var refresh = function() {
    if (new Date - lastRefresh >= (refreshRateSecs || 60) * 1000) {
      team.resetRequests();
      lastRefresh = new Date;
    }
  };

  interval = setInterval(refresh, 900);
};

var getSecondsUntilNextRefresh = function(args) {
  var refreshRateSecs = args.refreshRateSecs || 60;
  var currentTime = args.currentTime || new Date;
  var lastRefreshTime = args.lastRefresh || lastRefresh;

  return Math.round(refreshRateSecs - ((currentTime - lastRefreshTime) / 1000));
};

var stopRefreshTimer = function() {
  clearInterval(interval);
};

module.exports = {
  startRefreshTimer: startRefreshTimer,
  getSecondsUntilNextRefresh: getSecondsUntilNextRefresh,
  stopRefreshTimer: stopRefreshTimer
};

startRefreshTimer();