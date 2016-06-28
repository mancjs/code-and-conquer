'use strict';

const config = require('../../config');

let generated = {};

const generateRandomCoords = (width, height, count) => {
  let coords = [];

  for (let i = 0; i < count; i++) {
    let generating = true;

    while (generating) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      const key = `${x},${y}`;

      if (generated[key]) {
        continue;
      }

      generated[key] = true;
      coords.push({ x, y });
      break;
    }
  }

  return { coords };
};

const applyBonusSquares = (cells, coords, bonus) => {
  coords.forEach(coord => {
    cells[coord.y][coord.x].bonus = bonus;
  });
};

const generate = (width, height) => {
  generated = {};

  let cells = [];

  const preownedState = () => {
    return {
      bonus: 1,
      health: config.game.health.cpu,
      history: {
        attacks: {},
        defends: {}
      },
      owner: { 
        name: 'cpu', 
        colour: '#333333' 
      }
    };
  };

  for (let y = 0; y < height; y++) {
    if (!cells[y]) {
      cells[y] = [];
    }

    for (let x = 0; x < width; x++) {
      cells[y].push(preownedState());
    }
  }

  const { x2, x3 } = config.game.bonus;

  const x2Count = Math.ceil(width * height * x2);
  const x3Count = Math.ceil(width * height * x3); 

  const double = generateRandomCoords(width, height, x2Count);
  applyBonusSquares(cells, double.coords, 2);

  const triple = generateRandomCoords(width, height, x3Count);
  applyBonusSquares(cells, triple.coords, 3);

  return {
    cells,
    width,
    height,
    doubleSquares: x2Count,
    tripleSquares: x3Count
  };
};

const getCell = (grid, x, y) => {
  const cells = grid.cells;

  try {
    if (cells[y][x]) {
      return cells[y][x];
    }
  } catch (err) {}
};

const setCellOwner = (cell, ownerData) => {
  cell.owner = ownerData;
  cell.health = config.game.health.player;
  cell.history = { attacks: {}, defends: {} };

  delete cell.lastAttack;
};

const addCellAttackHistory = (cell, name, colour) => {
  if (cell.history.attacks[name] === undefined) {
    cell.history.attacks[name] = 0;
  }

  cell.history.attacks[name] += 1;

  cell.lastAttack = {
    time: new Date().getTime(),
    team: { name, colour }
  };
};

const addCellDefendHistory = (cell, name) => {
  if (cell.history.defends[name] === undefined) {
    cell.history.defends[name] = 0;
  }

  cell.history.defends[name] += 1;
};

module.exports = {
  generate,
  getCell,
  setCellOwner,
  addCellAttackHistory,
  addCellDefendHistory
};
