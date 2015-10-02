var db = require('../db/db');
var expect = require('expect.js');
var game = require('../game/game');
var grid = require('../game/grid');

beforeEach(function() {
  db.init();
});

describe('game', function() {
  describe('init', function() {
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
          expect(cell).to.have.keys('bonus', 'health', 'history', 'owner');

          // all cells should have at least a bonus of 1
          expect(cell.bonus).to.be.above(0);

          // all cells should have health of 60
          expect(cell.health).to.be(60);

          // all cells should be owned by CPU
          expect(cell.owner.name).to.be('cpu');
          expect(cell.owner.colour).not.be(undefined);

          // cells should have empty attack and defend history
          expect(Object.keys(cell.history.attacks).length).to.be(0);
          expect(Object.keys(cell.history.defends).length).to.be(0);
        });
      });
    });
  });

  describe('requests', function() {
    beforeEach(function() {
      game.start({ width: 5, height: 5 });
    });

    it('returns no requests error if team key is invalid', function() {
      db.get().teams.push({ key: 'key', requests: 0 });

      var result = game.attack('invalid', 0, 0);

      expect(result.err).to.be('no requests left');
    });

    it('returns no requests error if requests run out', function() {
      var state = db.get();

      var team1 = { key: 'team-1', requests: 3 };
      var team2 = { key: 'team-2', requests: 3 };

      state.teams.push(team1, team2);

      game.attack('team-1', 1, 1);
      game.attack('team-1', 1, 1);

      game.attack('team-2', 1, 2);
      game.attack('team-2', 1, 2);
      game.attack('team-2', 1, 2);

      expect(team1.requests).to.be(1);
      expect(team2.requests).to.be(0);

      var result = game.attack('team-2', 1, 2);
      expect(result.err).to.be('no requests left');
    });

    it('returns remaining requests if successful', function() {
      db.get().teams.push({ key: 'team-1', requests: 30 });

      var result = game.attack('team-1', 1, 1);
      expect(result.requestsRemaining).to.be(29);
    });
  });

  describe('commands', function() {
    beforeEach(function() {
      game.start({ width: 5, height: 5 });
    });

    it('returns invalid cell error if coords are off-grid', function() {
      db.get().teams.push({ key: 'team-1', requests: 1 });
      db.get().teams.push({ key: 'team-2', requests: 1 });

      var result1 = game.attack('team-1', 5, 0);
      var result2 = game.attack('team-2', 0, 5);

      expect(result1.err).to.be('no cell found at 5,0');
      expect(result2.err).to.be('no cell found at 0,5');
    });

    it('modifies correct cell state for an attack command', function() {
      var state = db.get();

      state.teams.push({ key: 'team-1', name: 'Team 1', requests: 30 });
      state.teams.push({ key: 'team-2', name: 'Team 2', requests: 30 });

      var cell1 = grid.getCell(state.grid, 4, 1);
      var cell2 = grid.getCell(state.grid, 2, 3);

      game.attack('team-1', 4, 1);
      expect(cell1.history.attacks['Team 1']).to.be(1);
      expect(cell1.health).to.be(59);

      game.attack('team-1', 4, 1);
      expect(cell1.history.attacks['Team 1']).to.be(2);
      expect(cell1.health).to.be(58);

      game.attack('team-2', 2, 3);
      expect(cell2.history.attacks['Team 2']).to.be(1);
      expect(cell2.health).to.be(59);

      game.attack('team-2', 4, 1);
      expect(cell1.history.attacks['Team 1']).to.be(2);
      expect(cell1.history.attacks['Team 2']).to.be(1);
      expect(cell1.health).to.be(57);
    });

    it('modifies correct cell state for a defend command', function() {
      var state = db.get();

      state.teams.push({ key: 'team-1', name: 'Team 1', requests: 30 });
      state.teams.push({ key: 'team-2', name: 'Team 2', requests: 30 });

      var cell1 = grid.getCell(state.grid, 1, 1);
      var cell2 = grid.getCell(state.grid, 1, 2);
      var cell3 = grid.getCell(state.grid, 1, 3);

      game.defend('team-1', 1, 1);
      expect(cell1.history.defends['Team 1']).to.be(1);
      expect(cell1.health).to.be(60);

      game.attack('team-2', 1, 2);
      game.defend('team-1', 1, 2);
      expect(cell2.history.attacks['Team 2']).to.be(1);
      expect(cell2.history.defends['Team 1']).to.be(1);
      expect(cell2.health).to.be(60);

      game.attack('team-2', 1, 3);
      game.defend('team-1', 1, 3);
      game.attack('team-2', 1, 3);
      expect(cell3.history.attacks['Team 2']).to.be(2);
      expect(cell3.history.defends['Team 1']).to.be(1);
      expect(cell3.health).to.be(59);
    });
  });
});