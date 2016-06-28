const types = require('./types');
const  engine = require('../game/engine');
const  requests = require('../game/requests');
const  registration = require('./registration');
const config = require('../../config');

const root = (request, response) => {
  return response(types.redirect('/register'));
};

const register = (request, response) => {
  return response(types.template('register.html'));
};

const registerTeam = (request, response) => {
  const team = request.body;
  const status = registration.createTeam(team.name, team.email, team.role);

  if (status.err) {
    return response(types.json({ err: status.err }));
  }

  const url = `/account?key=${status.team.key}`;

  return response(types.json({ url: url }));
};

const account = (request, response) => {
  const team = registration.getTeamByKey(request.query.key);

  if (!team) {
    return response(types.redirect('/'));
  }

  const model = {
    team: team,
    gameStatus: engine.getStatus()
  };

  return response(types.template('account.html', model));
};

const accountData = (request, response) => {
  const team = registration.getTeamByKey(request.query.key);

  if (!team) {
    return response(types.redirect('/'));
  }

  const teams = registration.getTeamNames();

  return response(types.json({
    teams: teams,
    requests: team.requests,
    grid: engine.query().grid
  }));
};

const overview = (request, response) => {
  return response(types.template('overview.html', getOverviewData()));
};

const overviewData = (request, response) => {
  return response(types.json(getOverviewData()));
};

const getOverviewData = () => {
  const refreshSeconds = requests.getSecondsUntilNextRefresh({});
  const response = engine.query();

  return {
    grid: response.result.grid,
    gameStarted: response.result.gameStarted,
    refreshSeconds: (refreshSeconds < 10) ? ('0' + refreshSeconds) : refreshSeconds,
    secondsPerRound: config.game.requests.refresh
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
