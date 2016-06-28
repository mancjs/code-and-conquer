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
  var gameData = engine.query();

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

    if (!cell || cell.x === undefined) {
      return { err: 'each cell must contain numeric x and y coords' };
    }

    if (!cell || cell.y === undefined) {
      return { err: 'each cell must contain numeric x and y coords' };
    }
  }
};

var verifySpyRequest = function(request) {
  if (!request.body) {
    return { err: 'no data sent to request' };
  }

  if (!request.body.key) {
    return { err: 'no key specified' };
  }

  if (!request.body.teamName) {
    return { err: 'no teamName specified' };
  }

  if (request.body.x === undefined) {
    return { err: 'no x grid coordinate specified' };
  }

  if (request.body.y === undefined) {
    return { err: 'no y grid coordinate specified' };
  }
};

// var attack = function(request, response) {
//   var verificationError = verifySingleCellRequest(request);

//   if (verificationError) {
//     return response(types.json(verificationError));
//   }

//   var result = engine.attack(request.body.key, request.body.x, request.body.y);
//   return response(types.json(result));
// };

var defend = function(request, response) {
  var verificationError = verifySingleCellRequest(request);

  if (verificationError) {
    return response(types.json(verificationError));
  }

  var result = engine.defend(request.body.key, request.body.x, request.body.y);
  return response(types.json(result));
};

var query = function(request, response) {
  var result = engine.query();
  return response(types.json(result));
};

var mine = function(request, response) {
  var verificationError = verifySingleCellRequest(request);

  if (verificationError) {
    return response(types.json(verificationError));
  }

  var result = engine.layMine(request.body.key, request.body.x, request.body.y);
  return response(types.json(result));
};

var cloak = function(request, response) {
  var verificationError = verifyMultipleCellRequest(request);

  if (verificationError) {
    return response(types.json(verificationError));
  }

  var result = engine.cloak(request.body.key, request.body.cells);
  return response(types.json(result));
};

var spy = function(request, response) {
  var verificationError = verifySpyRequest(request);

  if (verificationError) {
    return response(types.json(verificationError));
  }

  var result = engine.spy(request.body.key, request.body.teamName, request.body.x, request.body.y);
  return response(types.json(result));
};

module.exports = {
  'GET /': root,
  'GET /register': register,
  'POST /register': registerTeam,

  'GET /account': account,
  'GET /api/account-data': accountData,

  'GET /overview': overview,
  'GET /api/overview-data': overviewData

  // 'POST /game/attack': attack,
  // 'POST /game/defend': defend,
  // 'GET /game/query': query,

  // 'POST /game/role/mine': mine,
  // 'POST /game/role/cloak': cloak,
  // 'POST /game/role/spy': spy
};