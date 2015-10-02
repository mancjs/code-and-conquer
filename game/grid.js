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

  var double = generateRandomCoords(width, height, Math.ceil(width * height * 0.1));
  applyBonusSquares(cells, double.coords, 2);

  var triple = generateRandomCoords(width, height, Math.ceil(width * height * 0.05));
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
};

var addCellAttackHistory = function(cell, key) {
  if (cell.history.attacks[key] === undefined) {
    cell.history.attacks[key] = 0;
  }

  cell.history.attacks[key] += 1;
};

var addCellDefendHistory = function(cell, key) {
  if (cell.history.defends[key] === undefined) {
    cell.history.defends[key] = 0;
  }

  cell.history.defends[key] += 1;
};

module.exports = {
  generate: generate,
  getCell: getCell,
  setCellOwner: setCellOwner,
  addCellAttackHistory: addCellAttackHistory,
  addCellDefendHistory: addCellDefendHistory
};