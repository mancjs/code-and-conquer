var crypto = require('crypto');
var db = require('../db/db');
var log = require('../lib/log');
var colours = require('../lib/colours');

var roles = ['minelayer', 'cloaker', 'spy'];

var createKey = function() {
  return (Math.round(Math.random() * 100000000000)).toString(36);
};

var getGravatarUrl = function(email) {
  var hash = crypto.createHash('md5').update(email).digest('hex');
  return 'http://www.gravatar.com/avatar/' + hash + '?s=130&d=wavatar';
};

var open = function() {
  db.get().registrationOpen = true;
  log('registration', 'open');
};

var close = function() {
  db.get().registrationOpen = false;
  log('registration', 'closed');
};

var getTeamByKey = function(key) {
  var teams = db.get().teams;

  var matches = teams.filter(function(team) {
    return team.key === key;
  });

  return matches[0];
};

var getAllTeams = function() {
  return db.get().teams.map(function(team) {
    return {
      key: team.key,
      name: team.name,
      requests: team.requests
    };
  });
};

var createTeam = function(name, email, role) {
  name = name && name.trim();
  email = email && email.trim();

  var validationError = validate(name, email, role);

  if (validationError) {
    log('registration', 'ignored: ' + validationError);
    return { err: validationError };
  }

  var team = {
    key: createKey(),
    gravatar: getGravatarUrl(email),
    colour: colours.get(db.get().teams.length),
    role: role,
    name: name,
    email: email,
    requests: 30
  };

  db.get().teams.push(team);
  log('registration', team.name + ' (' + team.email +') registered');

  return { team: team };
};

var deleteTeam = function(key) {
  var teams = db.get().teams.filter(function(team) {
    return team.key === key;
  });

  if (teams.length === 0) {
    return 'Team not found';
  }

  db.get().teams = db.get().teams.filter(function(team) {
    return team.key !== key;
  });
};

var getStatus = function() {
  return {
    open: db.get().registrationOpen,
    teamCount: db.get().teams.length
  };
};

var validate = function(name, email, role) {
  if (!db.get().registrationOpen) {
    return 'Registration is currently closed';
  }

  if (colours.all.length <= db.get().teams.length) {
    return 'Server is full (' + colours.all.length + ')';
  }

  if (!email || email.length > 50) {
    return 'Please enter an email address (50 chars or less)';
  }

  if (!name || name.length > 25) {
    return 'Please enter a team name (25 chars or less)';
  }

  if (name === 'cpu') {
    return 'Please enter a valid team name (25 chars or less)';
  }

  var duplicates = db.get().teams.filter(function(team) {
    return team.name === name || team.email === email;
  });

  if (duplicates.length !== 0) {
    return 'A team with the same name or email already exists';
  }

  if (roles.indexOf(role) === -1) {
    return 'Valid roles: ' + roles.join(', ');
  }
};

module.exports = {
  open: open,
  close: close,
  getTeamByKey: getTeamByKey,
  getAllTeams: getAllTeams,
  createTeam: createTeam,
  deleteTeam: deleteTeam,
  getStatus: getStatus
};