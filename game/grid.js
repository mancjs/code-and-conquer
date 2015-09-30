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

  var unownedState = function() {
    return {
      bonus: 1,
      owned: false,
      history: []
    };
  };

  for (var y = 0; y < height; y++) {
    if (!cells[y]) {
      cells[y] = [];
    }

    for (var x = 0; x < width; x++) {
      cells[y].push(unownedState());
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

module.exports = {
  generate: generate
};