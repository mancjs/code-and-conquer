var db = require('../db/db');
var ddos = require('../api/ddos');
var game = require('../game/game');
var registration = require('../registration/registration');

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
    return team.key + ': ' + team.name + ' [' + team.role + '] [' + team.requests + ']';
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
    'ddos: ' + (ddos.isEnabled() ? 'on' : 'off'),
    'teams: ' + registrationStatus.teamCount,
    'registration: ' + (registrationStatus.open ? 'open' : 'closed'),
    'game: ' + (gameStatus.started ? 'started' : 'stopped'),
    'grid: ' + gameStatus.width + 'x' + gameStatus.height,
    'x2: ' + gameStatus.doubleSquares,
    'x3: ' + gameStatus.tripleSquares
  ];

  return values.join('\n');
};

var simulate = function() {
  db.init();
  game.init({ width: 8, height: 8 });
  registration.open();

  var result1 = registration.createTeam('Team 1', 'a@b.c1', 'minelayer');
  var result2 = registration.createTeam('Team 2', 'a@b.c2', 'minelayer');
  var result3 = registration.createTeam('Team 3', 'a@b.c3', 'spy');
  var result4 = registration.createTeam('Team 4', 'a@b.c4', 'spy');
  var result5 = registration.createTeam('Team 5', 'a@b.c5', 'cloaker');
  var result6 = registration.createTeam('Team 6', 'a@b.c6', 'cloaker');

  var teams = [result1.team, result2.team, result3.team, result4.team, result5.team, result6.team];

  startGame();

  var state = db.get();

  for (var i = 0; i < 40; i++) {
    var x = Math.floor(Math.random() * 8);
    var y = Math.floor(Math.random() * 8);

    state.grid.cells[y][x].health = 1;
    game.attack(teams[Math.floor(Math.random() * teams.length)].key, x, y);

    if (i % 2 === 0) {
      game.attack(teams[Math.floor(Math.random() * teams.length)].key, x, y);
    }
  }
};

var getScores = function() {
  var state = db.get();

  var teams = {};

  state.grid.cells.forEach(function(row) {
    row.forEach(function(cell) {
      var key = cell.owner.name;

      if (key === 'cpu') {
        return;
      }

      if (!teams[key]) {
        teams[key] = { name: key, score: 0 };
      }

      teams[key].score += (1 * cell.bonus);
    });
  });

  teams = Object.keys(teams).map(function(key) {
    return teams[key];
  });

  teams.sort(function(left, right) {
    return right.score - left.score;
  });

  var position = 1;
  var lastScore;

  return teams.map(function(team) {
    if (lastScore && (team.score < lastScore)) {
      position += 1;
    }

    lastScore = team.score;
    return position + ': ' + team.name + ', score: ' + team.score;
  }).join('\n');
};

var ddosEnable = function() {
  ddos.enable(true);
};

var ddosDisable = function() {
  ddos.enable(false);
};

var ddosClear = function() {
  ddos.clear();
};

var ddosList = function() {
  var clients = ddos.getData();
  var keys = Object.keys(clients);

  var response = 'clients: ' + keys.length;

  if (keys.length > 0) {
    response += '\n' + keys.map(function(address) {
      var client = clients[address];
      var timeLeft = 60 - Math.round((new Date().getTime() - client.added) / 1000);
      var bannedState = (client.banned ? ' | BANNED (' + timeLeft + 's)' : '');

      return address + ' | requests = ' + client.requests + bannedState;
    }).join('\n');
  }

  return response;
};

module.exports = {
  'init-game': initGame,
  'start-game': startGame,
  'open-reg': openRegistration,
  'close-reg': closeRegistration,
  'get-teams': getTeams,
  'del-team': deleteTeam,
  'status': getStatus,
  'scores': getScores,
  'simulate': simulate,
  'enable-ddos': ddosEnable,
  'disable-ddos': ddosDisable,
  'clear-ddos': ddosClear,
  'ddos-list': ddosList
};