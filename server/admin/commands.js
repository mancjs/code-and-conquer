'use strict';

const db = require('../../lib/db');
const ddos = require('../account/ddos');
const engine = require('../game/engine');
const registration = require('../account/registration');

const initGame = args => {
  if (!args || args.indexOf('x') === -1) {
    return 'missing grid size (e.g. 10x10)';
  }

  const gridSize = {
    width: parseInt(args.split('x')[0].trim()),
    height: parseInt(args.split('x')[1].trim())
  };

  engine.init(gridSize);

  return getStatus();
};

const startGame = () => {
  const state = db.get();

  if (!state.grid) {
    return 'no game initialised';
  }

  registration.close();
  engine.start();

  return getStatus();
};

const stopGame = () => {
  const state = db.get();

  if (!state.grid) {
    return 'no game initialised';
  }

  registration.close();
  engine.stop();

  return getStatus();
};

const openRegistration = () => {
  registration.open();
  return getStatus();
};

const closeRegistration = () => {
  registration.close();
  return getStatus();
};

const getTeams = () => {
  const teams = registration.getAllTeams();

  const lines = teams.map(team => {
    return team.key + ': ' + team.name + ' [' + team.role + '] [' + team.requests + ']';
  }).join('\n');

  let response = `${teams.length} total`;

  if (teams.length) {
    response += '\n' + lines;
  }

  return response;
};

const deleteTeam = args => {
  if (!args) {
    return 'missing team key';
  }

  return registration.deleteTeam(args);
};

const getStatus = () => {
  const registrationStatus = registration.getStatus();
  const gameStatus = engine.getStatus();

  if (!gameStatus) {
    return 'init game first';
  }

  const values = [
    `ddos: ${ddos.isEnabled() ? 'on' : 'off' }`,
    `teams: ${registrationStatus.teamCount}`,
    `registration: ${registrationStatus.open ? 'open' : 'closed' }`,
    `game: ${gameStatus.started ? 'started' : 'stopped' }`,
    `grid: ${gameStatus.width}x${gameStatus.height}`,
    `x2: ${gameStatus.doubleSquares}`,
    `x3: ${gameStatus.tripleSquares}`
  ];

  return values.join('\n');
};

const simulate = () => {
  db.init();
  engine.init({ width: 8, height: 8 });
  registration.open();

  const result1 = registration.createTeam('Team 1', 'a@b.c1', 'minelayer');
  const result2 = registration.createTeam('Team 2', 'a@b.c2', 'minelayer');
  const result3 = registration.createTeam('Team 3', 'a@b.c3', 'spy');
  const result4 = registration.createTeam('Team 4', 'a@b.c4', 'spy');
  const result5 = registration.createTeam('Team 5', 'a@b.c5', 'cloaker');
  const result6 = registration.createTeam('Team 6', 'a@b.c6', 'cloaker');

  const teams = [result1.team, result2.team, result3.team, result4.team, result5.team, result6.team];

  startGame();

  const state = db.get();

  for (let i = 0; i < 40; i++) {
    const x = Math.floor(Math.random() * 8);
    const y = Math.floor(Math.random() * 8);

    state.grid.cells[y][x].health = 1;
    engine.attack(teams[Math.floor(Math.random() * teams.length)].key, x, y);

    if (i % 2 === 0) {
      engine.attack(teams[Math.floor(Math.random() * teams.length)].key, x, y);
    }
  }

  return getStatus();
};

const getScores = () => {
  const state = db.get();

  if (!state.gameStarted) {
    return;
  }

  let teams = {};

  state.grid.cells.forEach(row => {
    row.forEach(cell => {
      const key = cell.owner.name;

      if (key === 'cpu') {
        return;
      }

      if (!teams[key]) {
        teams[key] = { name: key, score: 0 };
      }

      teams[key].score += (1 * cell.bonus);
    });
  });

  teams = Object.keys(teams).map(key => {
    return teams[key];
  });

  teams.sort((left, right) => {
    return right.score - left.score;
  });

  let position = 1;
  let lastScore;

  return teams.map(team => {
    if (lastScore && (team.score < lastScore)) {
      position += 1;
    }

    lastScore = team.score;
    return `${position}: ${team.name}, score: ${team.score}`;
  }).join('\n');
};

const ddosEnable = () => {
  ddos.enable(true);
  return getStatus();
};

const ddosDisable = () => {
  ddos.enable(false);
  return getStatus();
};

const ddosClear = () => {
  ddos.clear();
  return getStatus();
};

const ddosList = () => {
  const clients = ddos.getData();
  const keys = Object.keys(clients);

  let response = `clients: ${keys.length}`;

  if (keys.length > 0) {
    response += '\n' + keys.map(address => {
      const client = clients[address];
      const timeLeft = 60 - Math.round((new Date().getTime() - client.added) / 1000);
      const bannedState = (client.banned ? ` | BANNED (${timeLeft}s)` : '');

      return `${address} | requests = ${client.requests}${bannedState}`;
    }).join('\n');
  }

  return response;
};

module.exports = {
  'init-game': initGame,
  'start-game': startGame,
  'stop-game': stopGame,
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
