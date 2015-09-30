var types = require('./types');
var game = require('../game/game');
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

module.exports = {
  'GET /': root,
  'GET /register': register,
  'POST /register': registerTeam,
  'GET /account': account
};