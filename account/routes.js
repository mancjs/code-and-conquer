var types = require('./types');
var engine = require('../game/engine');
var requests = require('../game/requests');
var registration = require('./registration');

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
    gameStatus: engine.getStatus()
  };

  return response(types.template('account.html', model));
};

var accountData = function(request, response) {
  var team = registration.getTeamByKey(request.query.key);

  if (!team) {
    return response(types.redirect('/'));
  }

  var teams = registration.getTeamNames();

  return response(types.json({
    teams: teams,
    requests: team.requests,
    grid: engine.query().grid
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
  var response = engine.query();

  return {
    grid: response.result.grid,
    gameStarted: response.result.gameStarted,
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