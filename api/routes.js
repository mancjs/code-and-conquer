var types = require('./types');
var game = require('../game/game');
var requests = require('../game/requests');
var registration = require('../registration/registration');

var root = function(request, response) {
  return response(types.redirect('/register'));
};

var register = function(request, response) {
  return response(types.template('register.html'));
};

var registerTeam = function(request, response) {
  var team = request.body;
  var status = registration.createTeam(team.name, team.email, team.role);

  if (status.err) {
    return response(types.json({ err: status.err }));
  }

  var url = '/account?key=' + status.team.key;

  return response(types.json({ url: url }));
};

var account = function(request, response) {
  var team = registration.getTeamByKey(request.query.key);

  if (!team) {
    return response(types.redirect('/'));
  }

  var model = {
    team: team,
    gameStatus: game.getStatus()
  };

  return response(types.template('account.html', model));
};

var accountData = function(request, response) {
  var team = registration.getTeamByKey(request.query.key);

  if (!team) {
    return response(types.redirect('/'));
  }

  return response(types.json({
    grid: game.query().grid,
    requests: team.requests
  }));
};

var overview = function(request, response) {
  return response(types.template('overview.html', getOverviewData()));
};

var overviewData = function(request, response) {
  return response(types.json(getOverviewData()));
};

var getOverviewData = function() {
  var refreshSeconds = requests.getSecondsUntilNextRefresh({});
  var gameData = game.query();

  return {
    grid: gameData.grid,
    gameStarted: gameData.gameStarted,
    refreshSeconds: (refreshSeconds < 10) ? ('0' + refreshSeconds) : refreshSeconds
  };
};

module.exports = {
  'GET /': root,
  'GET /register': register,
  'POST /register': registerTeam,
  'GET /account': account,
  'GET /api/account-data': accountData,
  'GET /overview': overview,
  'GET /api/overview-data': overviewData
};