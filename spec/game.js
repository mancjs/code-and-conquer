var db = require('../db/db');
var expect = require('expect.js');
var game = require('../game/game');

beforeEach(function() {
  db.clear();
});

describe('game', function() {
  it('new game starts with correct state', function() {
    this.slow(10000);

    game.start({ width: 10, height: 10 });

    var state = db.get();

    // registration should be closed by default on new games
    expect(state.registrationOpen).to.be(false);

    // game time should be within the last 5 seconds
    expect(state.date.getTime()).to.be.within((new Date).getTime() - 5000, (new Date).getTime());

    // game grid should be initialised with correct fields
    expect(state.grid).to.have.keys('cells', 'width', 'height', 'doubleSquares', 'tripleSquares');

    // grid dimensions should be 10x10
    expect(state.grid.width).to.be(10);
    expect(state.grid.height).to.be(10);

    // grid should have a non-zero number of x2 and x3 squares
    expect(state.grid.doubleSquares).to.be.above(0);
    expect(state.grid.tripleSquares).to.be.above(0);

    // grid should contain the correct number of y,x cells
    expect(state.grid.cells.length).to.be(10);
    expect(state.grid.cells[0].length).to.be(10);

    state.grid.cells.forEach(function(row) {
      row.forEach(function(cell) {
        // all cells should be initialised with correct fields
        expect(cell).to.have.keys('bonus', 'owned', 'history');

        // all cells should have at least a bonus of 1
        expect(cell.bonus).to.be.above(0);

        // no cells should be owned
        expect(cell.owned).to.be(false);

        // no cells should have history
        expect(Object.prototype.toString.call(cell.history)).to.match(/Object/);
        expect(Object.keys(cell.history).length).to.be(0);
      });
    });
  });
});