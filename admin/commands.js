var registration = require('../registration/registration');
var game = require('../game/game');

var getStatus = function() {
  var registrationStatus = registration.getStatus();
  var gameStatus = game.getStatus();

  var values = [
    'teams: ' + registrationStatus.teamCount,
    'registration: ' + (registrationStatus.open ? 'open' : 'closed'),
    'grid: ' + gameStatus.width + 'x' + gameStatus.height,
    'x2: ' + gameStatus.doubleSquares,
    'x3: ' + gameStatus.tripleSquares
  ];

  return values.join(', ');
};

var getTeams = function() {
  var teams = registration.getAllTeams();

  var lines = teams.map(function(team) {
    return team.key + ': ' + team.name + ' [' + team.requests + ']';
  }).join('\n');

  var response = teams.length + ' total';

  if (teams.length) {
    response += '\n' + lines;
  }

  return response;
};

var deleteTeam = function(args) {
  if (!args) {
    return 'missing team key';
  }

  return registration.deleteTeam(args);
};

var startGame = function(args) {
  if (!args || args.indexOf('x') === -1) {
    return 'missing grid size (e.g. 10x10)';
  }

  var gridSize = {
    width: parseInt(args.split('x')[0].trim()),
    height: parseInt(args.split('x')[1].trim())
  };

  game.start(gridSize);
};

var openRegistration = function() {
  registration.open();
};

var closeRegistration = function() {
  registration.close();
};

module.exports = {
  'start': startGame,
  'status': getStatus,
  'teams': getTeams,
  'del-team': deleteTeam,
  'open-reg': openRegistration,
  'close-reg': closeRegistration
};