var db = require('../db/db');
var expect = require('expect.js');
var game = require('../game/game');
var grid = require('../game/grid');
var roles = require('../game/roles');
var events = require('../game/events');

beforeEach(function() {
  db.init();
});

describe('game', function() {
  describe('init', function() {
    it('creates game with correct state', function() {
      this.slow(10000);

      game.init({ width: 10, height: 10 });

      var state = db.get();

      // registration should be closed by default on new games
      expect(state.registrationOpen).to.be(false);

      // the game should not yet be playable
      expect(state.gameStarted).to.be(false);

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
      game.init({ width: 5, height: 5 });
    });

    it('returns not started error if requests sent before start', function() {
      var result = game.attack('team-key', 0, 0);

      expect(result.err).to.be('game not started');
    });

    it('returns no requests error if team key is invalid', function() {
      game.start();

      var result = game.attack('invalid', 0, 0);

      expect(result.err).to.be('no requests left');
    });

    it('returns no requests error if requests run out', function() {
      var state = db.get();

      var team1 = { key: 'team-1', requests: 3 };
      var team2 = { key: 'team-2', requests: 3 };

      state.teams.push(team1, team2);

      game.start();
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

      game.start();
      var result = game.attack('team-1', 1, 1);

      expect(result.requestsRemaining).to.be(29);
    });
  });

  describe('commands', function() {
    beforeEach(function() {
      events.clear();
      game.init({ width: 5, height: 5 });
      game.start();
    });

    it('returns invalid cell error if coords are invalid', function() {
      db.get().teams.push({ key: 'team-1', requests: 1 });
      db.get().teams.push({ key: 'team-2', requests: 1 });

      var result1 = game.attack('team-1', 5, 0);
      var result2 = game.attack('team-2', 0, 5);

      expect(result1.err).to.be('no cell found at 5,0');
      expect(result2.err).to.be('no cell found at 0,5');
    });

    it('updates correct cell state for an attack command', function() {
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

    it('updates correct cell state for a defend command', function() {
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

    it('updates correct cell state for change of owner', function() {
      var state = db.get();

      var cell = grid.getCell(state.grid, 1, 1);

      state.teams.push({ key: 'team-1', name: 'Team 1', requests: 60 });

      for (var i = 0; i < 59; i++) {
        game.attack('team-1', 1, 1);
      }

      expect(cell.health).to.be(1);

      game.attack('team-1', 1, 1);

      expect(cell.health).to.be(120);
      expect(cell.owner.name).to.be('Team 1');
      expect(Object.keys(cell.history.attacks).length).to.be(0);
      expect(Object.keys(cell.history.defends).length).to.be(0);
      expect(cell.lastAttack).to.be(undefined);
    });

    it('updates lastAttack data on cell for each attack command', function() {
      var state = db.get();

      var cell = grid.getCell(state.grid, 1, 1);

      state.teams.push({ key: 'team-1', name: 'Team 1', colour: 'colour-one', requests: 30 });
      state.teams.push({ key: 'team-2', name: 'Team 2', colour: 'colour-two', requests: 30 });

      game.attack('team-1', 1, 1);

      expect(cell.health).to.be(59);
      expect(cell.lastAttack.team.name).to.be('Team 1');
      expect(cell.lastAttack.team.colour).to.be('colour-one');
      expect(cell.lastAttack.time).to.be.within((new Date).getTime() - 5000, (new Date).getTime());

      game.attack('team-2', 1, 1);

      expect(cell.health).to.be(58);
      expect(cell.lastAttack.team.name).to.be('Team 2');
      expect(cell.lastAttack.team.colour).to.be('colour-two');
      expect(cell.lastAttack.time).to.be.within((new Date).getTime() - 5000, (new Date).getTime());
    });

    it('adds message to event log when cell is conquered', function() {
      var state = db.get();

      var cell = grid.getCell(state.grid, 1, 1);
      cell.health = 1;

      state.teams.push({ key: 'team-1', name: 'Team 1', colour: 'colour-one', requests: 30 });
      state.teams.push({ key: 'team-2', name: 'Team 2', colour: 'colour-two', requests: 30 });

      expect(events.getAll().length).to.be(0);

      game.attack('team-1', 1, 1);

      expect(events.getAll().length).to.be(1);
      expect(events.getAll()[0]).to.match(/Team 1 conquered cell 1,1 from cpu/);
    });

    it('adds message to event log when cell is conquered', function() {
      var state = db.get();

      var team1 = { key: 'team-1', name: 'Team 1', colour: 'colour-one', requests: 60 };
      var team2 = { key: 'team-2', name: 'Team 2', colour: 'colour-two', requests: 60 };
      var team3 = { key: 'team-3', name: 'Team 3', colour: 'colour-three', requests: 60 };

      state.teams.push(team1, team2, team3);

      // team-1 attacks cell 0,0 once
      game.attack('team-1', 0, 0);

      // team-2 attacks cell 0,1 60 times
      for (var i = 0; i < 60; i++) {
        game.attack('team-2', 0, 1);
      }

      // team-3 attacks 0,2 3 times and defends once
       game.attack('team-3', 0, 2);
       game.attack('team-3', 0, 2);
       game.attack('team-3', 0, 2);
       game.defend('team-3', 0, 2);

       var result = game.query();

       // cell 0,0 has one attack from team-1
       var cell1 = result.grid[0][0];

       expect(cell1.health).to.be(59);
       expect(cell1.owner.name).to.be('cpu');
       expect(cell1.owner.colour).not.be(undefined);
       expect(Object.keys(cell1.history.attacks).length).to.be(1);
       expect(Object.keys(cell1.history.defends).length).to.be(0);
       expect(cell1.history.attacks[team1.name]).to.be(1);

       // cell 0,1 gets conquered by team-2
       var cell2 = result.grid[1][0];

       expect(cell2.health).to.be(120);
       expect(cell2.owner.name).to.be('Team 2');
       expect(cell2.owner.colour).to.be(team2.colour);
       expect(Object.keys(cell2.history.attacks).length).to.be(0);
       expect(Object.keys(cell2.history.defends).length).to.be(0);

       // cell 0,2 has three attacks and one defend from team-3
       var cell3 = result.grid[2][0];

       expect(cell3.health).to.be(58);
       expect(cell3.owner.name).to.be('cpu');
       expect(cell3.owner.colour).not.be(undefined);
       expect(Object.keys(cell3.history.attacks).length).to.be(1);
       expect(Object.keys(cell3.history.defends).length).to.be(1);
       expect(cell3.history.attacks[team3.name]).to.be(3);
       expect(cell3.history.defends[team3.name]).to.be(1);
    });
  });

  describe('roles', function() {
    beforeEach(function() {
      events.clear();
      game.init({ width: 10, height: 10 });
      game.start();
    });

    it('fails if team plays a role they do not own', function() {
      var state = db.get();

      var team1 = { key: 'team-1', role: 'minelayer', requests: 1 };
      var team2 = { key: 'team-2', role: 'cloaker', requests: 1 };
      var team3 = { key: 'team-3', role: 'spy', requests: 1 };

      state.teams.push(team1, team2, team3);

      var result1 = game.layMine(team3.key, 0, 0);
      expect(result1.err).to.match(/you are not a minelayer/);

      var result2 = game.cloak(team1.key, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      expect(result2.err).to.match(/you are not a cloaker/);

      var result3 = game.spy(team2.key, team1.name);
      expect(result3.err).to.match(/you are not a spy/);
    });

    it('only allows a role to be played once', function() {
      var state = db.get();

      var team1 = { key: 'team-1', role: 'minelayer', requests: 2 };
      var team2 = { key: 'team-2', role: 'cloaker', requests: 2 };
      var team3 = { key: 'team-3', role: 'spy', requests: 2 };

      state.teams.push(team1, team2, team3);

      var result1 = game.layMine(team1.key, 0, 0);
      expect(result1.err).to.be(undefined);
      expect(result1.requestsRemaining).to.be(1);

      var error1 = game.layMine(team1.key, 0, 0);
      expect(error1.err).to.match(/you can only play a role once/);

      var result2 = game.cloak(team2.key, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      expect(result2.err).to.be(undefined);
      expect(result2.requestsRemaining).to.be(1);

      var error2 = game.cloak(team2.key, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      expect(error2.err).to.match(/you can only play a role once/);

      var result3 = game.spy(team3.key, team1.name, 0, 0);
      expect(result3.err).to.be(undefined);
      expect(result3.requestsRemaining).to.be(1);

      var error3 = game.spy(team3.key, team1.name);
      expect(error3.err).to.match(/you can only play a role once/);
    });

    it('rejects mine lays at invalid cells', function() {
      var state = db.get();

      state.teams.push({ key: 'team-1', role: 'minelayer', requests: 1 });

      var result = game.layMine('team-1', 42, 42);
      expect(result.err).to.match(/no cell found at 42,42/);
    });

    it('stores successful mine lay in state', function() {
      var state = db.get();

      state.teams.push({ key: 'team-1', name: 'Team 1', role: 'minelayer', requests: 1 });

      var result = game.layMine('team-1', 4, 5);

      expect(result.err).to.be(undefined);
      expect(state.roleData.mines['4,5'].owner).to.be('Team 1');
      expect(state.roleData.mines['4,5'].triggered).to.be(false);
    });

    it('wipes player requests when mine is triggered and disables mine', function() {
      var state = db.get();

      var team1 = { key: 'team-1', name: 'Team 1', role: 'minelayer', requests: 30 };
      var team2 = { key: 'team-2', name: 'Team 2', role: 'cloaker', requests: 30 };
      var team3 = { key: 'team-3', name: 'Team 3', role: 'spy', requests: 30 };

      state.teams.push(team1, team2, team3);

      var result1 = game.layMine('team-1', 2, 2);
      expect(result1.err).to.be(undefined);
      expect(result1.requestsRemaining).to.be(29);
      expect(state.grid.cells[2][2].health).to.be(60);

      expect(state.roleData.mines['2,2'].triggered).to.be(false);
      expect(state.roleData.mines['2,2'].owner).to.be('Team 1');
      expect(state.roleData.mines['2,2'].triggeredBy).to.be(undefined);
      expect(team1.mineSetAt).to.be('2,2');

      var result2 = game.defend('team-2', 2, 2);
      expect(result2.err).to.be(undefined);
      expect(result2.requestsRemaining).to.be(0);
      expect(result2.triggeredMine.owner).to.be('Team 1');
      expect(state.grid.cells[2][2].health).to.be(60);
      expect(team2.requests).to.be(0);

      expect(state.roleData.mines['2,2'].triggered).to.be(true);
      expect(state.roleData.mines['2,2'].owner).to.be('Team 1');
      expect(state.roleData.mines['2,2'].triggeredBy).to.be('Team 2');

      expect(team1.mineTriggeredBy).to.be('Team 2');

      var result3 = game.attack('team-3', 2, 2);
      expect(result3.err).to.be(undefined);
      expect(result3.requestsRemaining).to.be(29);
    });

    it('laying mine on top of another mine triggers both', function() {
      var state = db.get();

      var team1 = { key: 'team-1', name: 'Team 1', role: 'minelayer', requests: 30 };
      var team2 = { key: 'team-2', name: 'Team 2', role: 'minelayer', requests: 30 };

      state.teams.push(team1, team2);

      var result1 = game.layMine('team-1', 5, 5);
      expect(result1.err).to.be(undefined);
      expect(result1.requestsRemaining).to.be(29);
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(team1.requests).to.be(29);

      var result2 = game.layMine('team-2', 5, 5);
      expect(result2.err).to.be(undefined);
      expect(result2.requestsRemaining).to.be(0);
      expect(result2.triggeredMine.owner).to.be('Team 1');
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(team2.requests).to.be(0);

      expect(state.roleData.mines['5,5'].triggered).to.be(true);
      expect(state.roleData.mines['5,5'].owner).to.be('Team 1');
      expect(state.roleData.mines['5,5'].triggeredBy).to.be('Team 2');

      expect(team1.mineTriggeredBy).to.be('Team 2');

      team2.requests = 30;

      var result3 = game.layMine('team-2', 5, 5);
      expect(result3.err).to.match(/you can only play a role once/);
      expect(team2.requests).to.be(30);
    });

    it('applying cloak to more than 3 cells fails', function() {
      var state = db.get();

      var team = { key: 'team-1', name: 'Team 1', role: 'cloaker', requests: 30 };

      state.teams.push(team);

      var cells = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 }
      ];

      var result = game.cloak('team-1', cells);
      expect(result.err).to.match(/cloakers can cloak up to 3 cells max/);
      expect(team.requests).to.be(30);
    });

    it('applying cloak to invalid cells fails', function() {
      var state = db.get();

      var team1 = { key: 'team-1', name: 'Team 1', role: 'cloaker', requests: 30 };
      var team2 = { key: 'team-2', name: 'Team 2', role: 'cloaker', requests: 30 };

      state.teams.push(team1, team2);

      var cells1 = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 42 }
      ];

      var result1 = game.cloak('team-1', cells1);
      expect(result1.err).to.match(/no cell found at 2,42/);
      expect(team1.requests).to.be(30);

      var cells2 = [
        { x: 12, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 42 }
      ];

      var result2 = game.cloak('team-2', cells2);
      expect(result2.err).to.match(/no cell found at 12,0/);
      expect(team2.requests).to.be(30);
    });

    it('applying cloak to cells stores correct role state', function() {
      var state = db.get();

      var team = { key: 'team-1', name: 'Team 1', role: 'cloaker', roleUsed: false, requests: 30 };

      state.teams.push(team);

      var cells = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 }
      ];

      var result = game.cloak('team-1', cells);
      expect(result.err).to.be(undefined);
      expect(team.requests).to.be(29);

      expect(state.roleData.cloaks[0].cloakTime).to.be.within((new Date).getTime() - 5000, (new Date).getTime());
      expect(state.roleData.cloaks[0].owner).to.be('Team 1');
      expect(state.roleData.cloaks[0].x).to.be(0);
      expect(state.roleData.cloaks[0].y).to.be(0);

      expect(state.roleData.cloaks[1].cloakTime).to.be.within((new Date).getTime() - 5000, (new Date).getTime());
      expect(state.roleData.cloaks[1].owner).to.be('Team 1');
      expect(state.roleData.cloaks[1].x).to.be(1);
      expect(state.roleData.cloaks[1].y).to.be(1);

      expect(state.roleData.cloaks[2].cloakTime).to.be.within((new Date).getTime() - 5000, (new Date).getTime());
      expect(state.roleData.cloaks[2].owner).to.be('Team 1');
      expect(state.roleData.cloaks[2].x).to.be(2);
      expect(state.roleData.cloaks[2].y).to.be(2);

      expect(team.roleUsed).to.be(true);
      expect(team.cloakTime).to.not.be(undefined);
      expect(team.cloakedCells).to.be('0,0 1,1 2,2');
    });

    it('applying cloak to cells causes their health to be reported as 100% in queries for 5 mins', function() {
      var state = db.get();

      var team = { key: 'team-1', name: 'Team 1', role: 'cloaker', requests: 30 };

      state.teams.push(team);

      state.grid.cells[3][2].health = 10;
      state.grid.cells[5][4].health = 1;

      var result = game.cloak('team-1', [ { x: 2, y: 3 }, { x: 4, y: 5 } ]);
      expect(result.err).to.be(undefined);
      expect(team.requests).to.be(29);

      var queryState1 = game.query();

      expect(queryState1.grid[3][2].health).to.be(120);
      expect(queryState1.grid[5][4].health).to.be(120);

      roles.test.setCurrentTime(new Date().getTime() + (2.5 * 60 * 1000));

      var queryState2 = game.query();

      expect(queryState2.grid[3][2].health).to.be(120);
      expect(queryState2.grid[5][4].health).to.be(120);

      roles.test.setCurrentTime(new Date().getTime() + (6 * 60 * 1000));

      var queryState3 = game.query();

      expect(queryState3.grid[3][2].health).to.be(10);
      expect(queryState3.grid[5][4].health).to.be(1);
    });

    it('applying spy to unknown team or invalid square fails', function() {
      var state = db.get();

      var team1 = { key: 'team-1', name: 'Team 1', role: 'spy', requests: 30 };
      var team2 = { key: 'team-2', name: 'Team 2', role: 'minelayer', requests: 30 };

      state.teams.push(team1, team2);

      var result1 = game.spy('team-1', 'Unknown Team', 4, 4);
      expect(result1.err).to.match(/team not found: Unknown Team/);
      expect(team1.requests).to.be(30);

      var result2 = game.spy('team-1', 'Team 2', 42, 4);
      expect(result2.err).to.match(/no cell found at 42,4/);
      expect(team1.requests).to.be(30);
    });

    it('applying spy to valid team and square stores correct role state', function() {
      var state = db.get();

      var team1 = { key: 'team-1', name: 'Team 1', role: 'spy', requests: 30 };
      var team2 = { key: 'team-2', name: 'Team 2', role: 'cloaker', requests: 30 };

      state.teams.push(team1, team2);

      var result = game.spy('team-1', 'Team 2', 1, 3);
      expect(result.err).to.be(undefined);
      expect(result.requestsRemaining).to.be(29);
      expect(team1.requests).to.be(29);

      expect(state.roleData.redirects['Team 2'].remaining).to.be(15);
      expect(state.roleData.redirects['Team 2'].owner).to.be('Team 1');
      expect(state.roleData.redirects['Team 2'].x).to.be(1);
      expect(state.roleData.redirects['Team 2'].y).to.be(3);

      expect(team1.roleUsed).to.be(true);
      expect(team1.redirectedTeam).to.be('Team 2');
      expect(team1.redirectedTo).to.be('1,3');
    });

    it('attack commands from a redirected team go to the redirected square', function() {
      var state = db.get();

      var team1 = { key: 'team-1', name: 'Team 1', role: 'spy', requests: 30 };
      var team2 = { key: 'team-2', name: 'Team 2', role: 'cloaker', requests: 30 };

      state.teams.push(team1, team2);

      var result1 = game.spy('team-1', 'Team 2', 1, 1);
      expect(result1.err).to.be(undefined);
      expect(result1.requestsRemaining).to.be(29);
      expect(team1.requests).to.be(29);

      for (var i = 0; i < 14; i++) {
        expect(game.attack('team-2', 5, 5).err).to.be(undefined);
      }

      expect(team2.requests).to.be(16);
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(state.grid.cells[1][1].health).to.be(46);
      expect(state.roleData.redirects['Team 2'].remaining).to.be(1);

      expect(game.attack('team-2', 5, 5).err).to.be(undefined);

      expect(team2.requests).to.be(15);
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(state.grid.cells[1][1].health).to.be(45);
      expect(state.roleData.redirects['Team 2'].remaining).to.be(0);

      expect(game.attack('team-2', 5, 5).err).to.be(undefined);

      expect(team2.requests).to.be(14);
      expect(state.grid.cells[5][5].health).to.be(59);
      expect(state.grid.cells[1][1].health).to.be(45);
      expect(state.roleData.redirects['Team 2'].remaining).to.be(0);
    });

    it('defend commands from a redirected team go to the redirected square', function() {
      var state = db.get();

      var team1 = { key: 'team-1', name: 'Team 1', role: 'spy', requests: 30 };
      var team2 = { key: 'team-2', name: 'Team 2', role: 'cloaker', requests: 30 };

      state.teams.push(team1, team2);

      var result1 = game.spy('team-1', 'Team 2', 1, 1);
      expect(result1.err).to.be(undefined);
      expect(result1.requestsRemaining).to.be(29);
      expect(team1.requests).to.be(29);

      for (var i = 0; i < 7; i++) {
        expect(game.attack('team-2', 5, 5).err).to.be(undefined);
      }

      expect(team2.requests).to.be(23);
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(state.grid.cells[1][1].health).to.be(53);
      expect(state.roleData.redirects['Team 2'].remaining).to.be(8);

      for (var j = 0; j < 8; j++) {
        expect(game.defend('team-2', 5, 5).err).to.be(undefined);
      }

      expect(team2.requests).to.be(15);
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(state.grid.cells[1][1].health).to.be(60);
      expect(state.roleData.redirects['Team 2'].remaining).to.be(0);
    });
  });
});