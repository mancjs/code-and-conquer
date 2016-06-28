'use strict';

const config = require('../../config');

var generateRandomCoords = function(width, height, count) {
  var coords = [];
  var generated = {};

  for (var i = 0; i < count; i++) {
    var x = Math.floor(Math.random() * width);
    var y = Math.floor(Math.random() * height);

    generated[x.toString() + y.toString()] = true;

    coords.push({
      x: x,
      y: y
    });
  }

  return {
    coords: coords,
    count: Object.keys(generated).length
  };
};

var applyBonusSquares = function(cells, coords, bonus) {
  coords.forEach(function(coord) {
    cells[coord.y][coord.x].bonus = bonus;
  });
};

var generate = function(width, height) {
  var cells = [];

  var preownedState = function() {
    return {
      bonus: 1,
      health: 60,
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

  var double = generateRandomCoords(width, height, Math.ceil(width * height * x2));
  applyBonusSquares(cells, double.coords, 2);

  var triple = generateRandomCoords(width, height, Math.ceil(width * height * x3));
  applyBonusSquares(cells, triple.coords, 3);

  return {
    cells: cells,
    width: width,
    height: height,
    doubleSquares: double.count,
    tripleSquares: triple.count
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