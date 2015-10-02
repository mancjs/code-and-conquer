var registration = require('../registration/registration');
var game = require('../game/game');

var initGame = function(args) {
  if (!args || args.indexOf('x') === -1) {
    return 'missing grid size (e.g. 10x10)';
  }

  var gridSize = {
    width: parseInt(args.split('x')[0].trim()),
    height: parseInt(args.split('x')[1].trim())
  };

  game.init(gridSize);
};

var startGame = function() {
  registration.close();
  game.start();
};

var openRegistration = function() {
  registration.open();
};

var closeRegistration = function() {
  registration.close();
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

var getStatus = function() {
  var registrationStatus = registration.getStatus();
  var gameStatus = game.getStatus();

  var values = [
    'teams: ' + registrationStatus.teamCount,
    'registration: ' + (registrationStatus.open ? 'open' : 'closed'),
    'game: ' + (gameStatus.started ? 'started' : 'stopped'),
    'grid: ' + gameStatus.width + 'x' + gameStatus.height,
    'x2: ' + gameStatus.doubleSquares,
    'x3: ' + gameStatus.tripleSquares
  ];

  return values.join(', ');
};

module.exports = {
  'init-game': initGame,
  'start-game': startGame,
  'open-reg': openRegistration,
  'close-reg': closeRegistration,
  'get-teams': getTeams,
  'del-team': deleteTeam,
  'status': getStatus
};