'use strict';

const crypto = require('crypto');

const colours = require('../../lib/colours');
const config = require('../../config');
const db = require('../../lib/db');
const log = require('../../lib/log');

const roles = ['minelayer', 'cloaker', 'spy'];

const createKey = () => {
  return (Math.round(Math.random() * 100000000000)).toString(36);
};

const getGravatarUrl = email => {
  const hash = crypto.createHash('md5').update(email).digest('hex');
  return `http://www.gravatar.com/avatar/${hash}?s=130&d=wavatar`;
};

const open = () => {
  db.get().registrationOpen = true;
  log('registration', 'open');
};

const close = () => {
  db.get().registrationOpen = false;
  log('registration', 'closed');
};

const getTeamByKey = key => {
  const teams = db.get().teams;

  const matches = teams.filter(team => {
    return team.key === key;
  });

  return matches[0];
};

const getTeamNames = () => {
  return db.get().teams.map(team => {
    return {
      name: team.name,
      colour: team.colour,
      gravatar: team.gravatar
    };
  });
};

const getAllTeams = () => {
  return db.get().teams.map(team => {
    return {
      key: team.key,
      name: team.name,
      role: team.role,
      requests: team.requests
    };
  });
};

const createTeam = (name, email, role) => {
  name = name && name.trim();
  email = email && email.trim();

  const validationError = validate(name, email, role);

  if (validationError) {
    log('registration', `ignored: ${validationError}`);
    return { err: validationError };
  }

  const team = {
    key: createKey(),
    gravatar: getGravatarUrl(email),
    colour: colours.get(db.get().teams.length),
    roleUsed: false,
    role: role,
    name: name,
    email: email,
    requests: config.game.requests.amount
  };

  db.get().teams.push(team);
  log('registration', `${team.name} (${team.email}) registered`);

  return { team: team };
};

const deleteTeam = key => {
  const teams = db.get().teams.filter(team => {
    return team.key === key;
  });

  if (teams.length === 0) {
    return 'Team not found';
  }

  db.get().teams = db.get().teams.filter(team => {
    return team.key !== key;
  });
};

const getStatus = () => {
  return {
    open: db.get().registrationOpen,
    teamCount: db.get().teams.length
  };
};

const validate = (name, email, role) => {
  if (!db.get().registrationOpen) {
    return 'Registration is currently closed';
  }

  if (colours.all.length <= db.get().teams.length) {
    return `Server is full (${colours.all.length})`;
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

  if (!name.match(/^\w+$/)) {
    return 'Team name must match /^\w+$/';
  }

  const duplicates = db.get().teams.filter(team => {
    return team.name === name || team.email === email;
  });

  if (duplicates.length !== 0) {
    return 'A team with the same name or email already exists';
  }

  if (roles.indexOf(role) === -1) {
    return `Valid roles: ${roles.join(', ')}`;
  }
};

module.exports = {
  open,
  close,
  getTeamByKey,
  getTeamNames,
  getAllTeams,
  createTeam,
  deleteTeam,
  getStatus
};
