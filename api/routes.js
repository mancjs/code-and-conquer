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

  var teams = registration.getTeamNames();

  return response(types.json({
    teams: teams,
    requests: team.requests,
    grid: game.query().grid
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

var verifySingleCellRequest = function(request) {
  if (!request.body) {
    return { err: 'no data sent to request' };
  }

  if (!request.body.key) {
    return { err: 'no key specified' };
  }

  if (request.body.x === undefined) {
    return { err: 'no x grid coordinate specified' };
  }

  if (request.body.y === undefined) {
    return { err: 'no y grid coordinate specified' };
  }
};

var verifyMultipleCellRequest = function(request) {
  if (!request.body) {
    return { err: 'no data sent to request' };
  }

  if (!request.body.key) {
    return { err: 'no key specified' };
  }

  if (!request.body.cells || !request.body.cells.length) {
    return { err: 'no cells specified' };
  }

  for (var i = 0; i < request.body.cells.length; i++) {
    var cell = request.body.cells[i];

    if (!cell || !cell.x) {
      return { err: 'each cell must contain numeric x and y coords' };
    }

    if (!cell || !cell.y) {
      return { err: 'each cell must contain numeric x and y coords' };
    }
  }
};

var attack = function(request, response) {
  var verificationError = verifySingleCellRequest(request);

  if (verificationError) {
    return response(types.json(verificationError));
  }

  var result = game.attack(request.body.key, request.body.x, request.body.y);
  return response(types.json(result));
};

var defend = function(request, response) {
  var verificationError = verifySingleCellRequest(request);

  if (verificationError) {
    return response(types.json(verificationError));
  }

  var result = game.defend(request.body.key, request.body.x, request.body.y);
  return response(types.json(result));
};

var query = function(request, response) {
  var result = game.query();
  return response(types.json(result));
};

var mine = function(request, response) {
  var verificationError = verifySingleCellRequest(request);

  if (verificationError) {
    return response(types.json(verificationError));
  }

  var result = game.layMine(request.body.key, request.body.x, request.body.y);
  return response(types.json(result));
};

var cloak = function(request, response) {
  var verificationError = verifyMultipleCellRequest(request);

  if (verificationError) {
    return response(types.json(verificationError));
  }

  var result = game.cloak(request.body.key, request.body.cells);
  return response(types.json(result));
};

var spy = function(request, response) {
  return response(types.json({ type: 'spy' }));
};

module.exports = {
  'GET /': root,
  'GET /register': register,
  'POST /register': registerTeam,

  'GET /account': account,
  'GET /api/account-data': accountData,

  'GET /overview': overview,
  'GET /api/overview-data': overviewData,

  'POST /game/attack': attack,
  'POST /game/defend': defend,
  'GET /game/query': query,

  'POST /game/role/mine': mine,
  'POST /game/role/cloak': cloak,
  'POST /game/role/spy': spy,
};