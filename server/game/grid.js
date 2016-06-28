'use strict';

const config = require('../../config');

let generated = {};

var generateRandomCoords = function(width, height, count) {
  var coords = [];

  for (var i = 0; i < count; i++) {
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

var applyBonusSquares = function(cells, coords, bonus) {
  coords.forEach(function(coord) {
    cells[coord.y][coord.x].bonus = bonus;
  });
};

var generate = function(width, height) {
  generated = {};

  var cells = [];

  var preownedState = function() {
    return {
      bonus: 1,
      health: config.game.health.cpu,
      history: {
        attacks: {},
        defends: {}
      },
      owner: { name: 'cpu', colour: '#333333' }
    };
  };

  for (var y = 0; y < height; y++) {
    if (!cells[y]) {
      cells[y] = [];
    }

    for (var x = 0; x < width; x++) {
      cells[y].push(preownedState());
    }
  }

  const { x2, x3 } = config.game.bonus;

  const x2Count = Math.ceil(width * height * x2);
  const x3Count = Math.ceil(width * height * x3); 

  var double = generateRandomCoords(width, height, x2Count);
  applyBonusSquares(cells, double.coords, 2);

  var triple = generateRandomCoords(width, height, x3Count);
  applyBonusSquares(cells, triple.coords, 3);

  return {
    cells: cells,
    width: width,
    height: height,
    doubleSquares: x2Count,
    tripleSquares: x3Count
  };
};

var getCell = function(grid, x, y) {
  var cells = grid.cells;

  try {
    if (cells[y][x]) return cells[y][x];
  } catch (err) {}
};

var setCellOwner = function(cell, ownerData) {
  cell.owner = ownerData;
  cell.health = 120;
  cell.history = { attacks: {}, defends: {} };
  delete cell.lastAttack;
};

var addCellAttackHistory = function(cell, name, colour) {
  if (cell.history.attacks[name] === undefined) {
    cell.history.attacks[name] = 0;
  }

  cell.history.attacks[name] += 1;

  cell.lastAttack = {
    time: new Date().getTime(),
    team: {
      name: name,
      colour: colour
    }
  };
};

var addCellDefendHistory = function(cell, name) {
  if (cell.history.defends[name] === undefined) {
    cell.history.defends[name] = 0;
  }

  cell.history.defends[name] += 1;
};

module.exports = {
  generate: generate,
  getCell: getCell,
  setCellOwner: setCellOwner,
  addCellAttackHistory: addCellAttackHistory,
  addCellDefendHistory: addCellDefendHistory
};