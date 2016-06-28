/* eslint-env mocha */

const db = require('../db/db');
const expect = require('expect.js');
const engine = require('../server/game/engine');
const grid = require('../server/game/grid');
const roles = require('../server/game/roles');
const statuses = require('../server/game/statuses');
const config = require('../config');

beforeEach(() => {
  db.init();
});

describe('game', () => {
  describe('init', () => {
    it('creates game with correct state', () => {
      engine.init({ width: 10, height: 10 });

      const state = db.get();

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

      state.grid.cells.forEach(row => {
        row.forEach(cell => {
          // all cells should be initialised with correct fields
          expect(cell).to.have.keys('bonus', 'health', 'history', 'owner');

          // all cells should have at least a bonus of 1
          expect(cell.bonus).to.be.above(0);

          // all cells should have health of 60
          expect(cell.health).to.be(config.game.health.cpu);

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

  describe('requests', () => {
    beforeEach(() => {
      engine.init({ width: 5, height: 5 });
    });

    it('returns not started error if requests sent before start', () => {
      const result = engine.attack('team-key', 0, 0);

      expect(result.status).to.be(statuses.gameNotStarted);
    });

    it('returns no requests error if team key is invalid', () => {
      engine.start();

      const result = engine.attack('invalid', 0, 0);

      expect(result.status).to.be(statuses.noRequestsLeft);
    });

    it('returns no requests error if requests run out', () => {
      const state = db.get();

      const team1 = { key: 'team-1', requests: 3 };
      const team2 = { key: 'team-2', requests: 3 };

      state.teams.push(team1, team2);

      engine.start();
      engine.attack('team-1', 1, 1);
      engine.attack('team-1', 1, 1);

      engine.attack('team-2', 1, 2);
      engine.attack('team-2', 1, 2);
      engine.attack('team-2', 1, 2);

      expect(team1.requests).to.be(1);
      expect(team2.requests).to.be(0);

      const result = engine.attack('team-2', 1, 2);
      expect(result.status).to.be(statuses.noRequestsLeft);
    });

    it('returns remaining requests if successful', () => {
      db.get().teams.push({ key: 'team-1', requests: 30 });

      engine.start();
      const result = engine.attack('team-1', 1, 1);

      expect(result.result.requestsRemaining).to.be(29);
    });
  });

  describe('commands', () => {
    beforeEach(() => {
      engine.init({ width: 5, height: 5 });
      engine.start();
    });

    it('returns invalid cell error if coords are invalid', () => {
      db.get().teams.push({ key: 'team-1', requests: 1 });
      db.get().teams.push({ key: 'team-2', requests: 1 });

      const result1 = engine.attack('team-1', 5, 0);
      const result2 = engine.attack('team-2', 0, 5);

      expect(result1.status).to.be(statuses.invalidCell);
      expect(result1.result.x).to.be(5);
      expect(result1.result.y).to.be(0);

      expect(result2.status).to.be(statuses.invalidCell);
      expect(result2.result.x).to.be(0);
      expect(result2.result.y).to.be(5);
    });

    it('updates correct cell state for an attack command', () => {
      const state = db.get();

      state.teams.push({ key: 'team-1', name: 'Team 1', requests: 30 });
      state.teams.push({ key: 'team-2', name: 'Team 2', requests: 30 });

      const cell1 = grid.getCell(state.grid, 4, 1);
      const cell2 = grid.getCell(state.grid, 2, 3);

      engine.attack('team-1', 4, 1);
      expect(cell1.history.attacks['Team 1']).to.be(1);
      expect(cell1.health).to.be(59);

      engine.attack('team-1', 4, 1);
      expect(cell1.history.attacks['Team 1']).to.be(2);
      expect(cell1.health).to.be(58);

      engine.attack('team-2', 2, 3);
      expect(cell2.history.attacks['Team 2']).to.be(1);
      expect(cell2.health).to.be(59);

      engine.attack('team-2', 4, 1);
      expect(cell1.history.attacks['Team 1']).to.be(2);
      expect(cell1.history.attacks['Team 2']).to.be(1);
      expect(cell1.health).to.be(57);
    });

    it('updates correct cell state for a defend command', () => {
      const state = db.get();

      state.teams.push({ key: 'team-1', name: 'Team 1', requests: 30 });
      state.teams.push({ key: 'team-2', name: 'Team 2', requests: 30 });

      const cell1 = grid.getCell(state.grid, 1, 1);
      const cell2 = grid.getCell(state.grid, 1, 2);
      const cell3 = grid.getCell(state.grid, 1, 3);

      engine.defend('team-1', 1, 1);
      expect(cell1.history.defends['Team 1']).to.be(1);
      expect(cell1.health).to.be(60);

      engine.attack('team-2', 1, 2);
      engine.defend('team-1', 1, 2);
      expect(cell2.history.attacks['Team 2']).to.be(1);
      expect(cell2.history.defends['Team 1']).to.be(1);
      expect(cell2.health).to.be(60);

      engine.attack('team-2', 1, 3);
      engine.defend('team-1', 1, 3);
      engine.attack('team-2', 1, 3);
      expect(cell3.history.attacks['Team 2']).to.be(2);
      expect(cell3.history.defends['Team 1']).to.be(1);
      expect(cell3.health).to.be(59);
    });

    it('updates correct cell state for change of owner', () => {
      const state = db.get();

      const cell = grid.getCell(state.grid, 1, 1);

      state.teams.push({ key: 'team-1', name: 'Team 1', requests: 60 });

      for (let i = 0; i < 59; i++) {
        engine.attack('team-1', 1, 1);
      }

      expect(cell.health).to.be(1);

      engine.attack('team-1', 1, 1);

      expect(cell.health).to.be(config.game.health.player);
      expect(cell.owner.name).to.be('Team 1');
      expect(Object.keys(cell.history.attacks).length).to.be(0);
      expect(Object.keys(cell.history.defends).length).to.be(0);
      expect(cell.lastAttack).to.be(undefined);
    });

    it('updates lastAttack data on cell for each attack command', () => {
      const state = db.get();

      const cell = grid.getCell(state.grid, 1, 1);

      state.teams.push({ key: 'team-1', name: 'Team 1', colour: 'colour-one', requests: 30 });
      state.teams.push({ key: 'team-2', name: 'Team 2', colour: 'colour-two', requests: 30 });

      engine.attack('team-1', 1, 1);

      expect(cell.health).to.be(59);
      expect(cell.lastAttack.team.name).to.be('Team 1');
      expect(cell.lastAttack.team.colour).to.be('colour-one');
      expect(cell.lastAttack.time).to.be.within((new Date).getTime() - 5000, (new Date).getTime());

      engine.attack('team-2', 1, 1);

      expect(cell.health).to.be(58);
      expect(cell.lastAttack.team.name).to.be('Team 2');
      expect(cell.lastAttack.team.colour).to.be('colour-two');
      expect(cell.lastAttack.time).to.be.within((new Date).getTime() - 5000, (new Date).getTime());
    });

    it('adds message to event log when cell is conquered', () => {
      const state = db.get();

      const team1 = { key: 'team-1', name: 'Team 1', colour: 'colour-one', requests: 60 };
      const team2 = { key: 'team-2', name: 'Team 2', colour: 'colour-two', requests: 60 };
      const team3 = { key: 'team-3', name: 'Team 3', colour: 'colour-three', requests: 60 };

      state.teams.push(team1, team2, team3);

      // team-1 attacks cell 0,0 once
      engine.attack('team-1', 0, 0);

      // team-2 attacks cell 0,1 enough times to own it
      for (let i = 0; i < config.game.health.cpu; i++) {
        engine.attack('team-2', 0, 1);
      }

      // team-3 attacks 0,2 3 times and defends once
      engine.attack('team-3', 0, 2);
      engine.attack('team-3', 0, 2);
      engine.attack('team-3', 0, 2);
      engine.defend('team-3', 0, 2);

      const result = engine.query();

      // cell 0,0 has one attack from team-1
      const cell1 = result.result.grid[0][0];

      expect(cell1.health).to.be(config.game.health.cpu - 1);
      expect(cell1.owner.name).to.be('cpu');
      expect(cell1.owner.colour).not.be(undefined);
      expect(Object.keys(cell1.history.attacks).length).to.be(1);
      expect(Object.keys(cell1.history.defends).length).to.be(0);
      expect(cell1.history.attacks[team1.name]).to.be(1);

      // cell 0,1 gets conquered by team-2
      const cell2 = result.result.grid[1][0];

      expect(cell2.health).to.be(config.game.health.player);
      expect(cell2.owner.name).to.be('Team 2');
      expect(cell2.owner.colour).to.be(team2.colour);
      expect(Object.keys(cell2.history.attacks).length).to.be(0);
      expect(Object.keys(cell2.history.defends).length).to.be(0);

      // cell 0,2 has three attacks and one defend from team-3
      const cell3 = result.result.grid[2][0];

      expect(cell3.health).to.be(config.game.health.cpu - 2);
      expect(cell3.owner.name).to.be('cpu');
      expect(cell3.owner.colour).not.be(undefined);
      expect(Object.keys(cell3.history.attacks).length).to.be(1);
      expect(Object.keys(cell3.history.defends).length).to.be(1);
      expect(cell3.history.attacks[team3.name]).to.be(3);
      expect(cell3.history.defends[team3.name]).to.be(1);
    });
  });

  describe('roles', () => {
    beforeEach(() => {
      engine.init({ width: 10, height: 10 });
      engine.start();
    });

    it('fails if team plays a role they do not own', () => {
      const state = db.get();

      const team1 = { key: 'team-1', role: 'minelayer', requests: 1 };
      const team2 = { key: 'team-2', role: 'cloaker', requests: 1 };
      const team3 = { key: 'team-3', role: 'spy', requests: 1 };

      state.teams.push(team1, team2, team3);

      const result1 = engine.mine(team3.key, 0, 0);
      expect(result1.status).to.be(statuses.roleNotAssigned);

      const result2 = engine.cloak(team1.key, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      expect(result2.status).to.be(statuses.roleNotAssigned);

      const result3 = engine.spy(team2.key, team1.name);
      expect(result3.status).to.be(statuses.roleNotAssigned);
    });

    it('only allows a role to be played once', () => {
      const state = db.get();

      const team1 = { key: 'team-1', role: 'minelayer', requests: 2 };
      const team2 = { key: 'team-2', role: 'cloaker', requests: 2 };
      const team3 = { key: 'team-3', role: 'spy', requests: 2 };

      state.teams.push(team1, team2, team3);

      const result1 = engine.mine(team1.key, 0, 0);
      expect(result1.status).to.be(statuses.ok);
      expect(result1.result.requestsRemaining).to.be(1);

      const error1 = engine.mine(team1.key, 0, 0);
      expect(error1.status).to.be(statuses.roleAlreadyUsed);

      const result2 = engine.cloak(team2.key, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      expect(result2.status).to.be(statuses.ok);
      expect(result2.result.requestsRemaining).to.be(1);

      const error2 = engine.cloak(team2.key, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
      expect(error2.status).to.be(statuses.roleAlreadyUsed);

      const result3 = engine.spy(team3.key, team1.name, 0, 0);
      expect(result3.status).to.be(statuses.ok);
      expect(result3.result.requestsRemaining).to.be(1);

      const error3 = engine.spy(team3.key, team1.name);
      expect(error3.status).to.be(statuses.roleAlreadyUsed);
    });

    it('rejects mine lays at invalid cells', () => {
      const state = db.get();

      state.teams.push({ key: 'team-1', role: 'minelayer', requests: 1 });

      const result = engine.mine('team-1', 42, 42);
      expect(result.status).to.be(statuses.invalidCell);
      expect(result.result.x).to.be(42);
      expect(result.result.y).to.be(42);
    });

    it('stores successful mine lay in state', () => {
      const state = db.get();

      state.teams.push({ key: 'team-1', name: 'Team 1', role: 'minelayer', requests: 1 });

      const result = engine.mine('team-1', 4, 5);

      expect(result.status).to.be(statuses.ok);
      expect(state.roleData.mines['4,5'].owner).to.be('Team 1');
      expect(state.roleData.mines['4,5'].triggered).to.be(false);
    });

    it('wipes player requests when mine is triggered and disables mine', () => {
      const state = db.get();

      const team1 = { key: 'team-1', name: 'Team 1', role: 'minelayer', requests: 30 };
      const team2 = { key: 'team-2', name: 'Team 2', role: 'cloaker', requests: 30 };
      const team3 = { key: 'team-3', name: 'Team 3', role: 'spy', requests: 30 };

      state.teams.push(team1, team2, team3);

      const result1 = engine.mine('team-1', 2, 2);
      expect(result1.status).to.be(statuses.ok);
      expect(result1.result.requestsRemaining).to.be(29);
      expect(state.grid.cells[2][2].health).to.be(60);

      expect(state.roleData.mines['2,2'].triggered).to.be(false);
      expect(state.roleData.mines['2,2'].owner).to.be('Team 1');
      expect(state.roleData.mines['2,2'].triggeredBy).to.be(undefined);
      expect(team1.mineSetAt).to.be('2,2');

      const result2 = engine.defend('team-2', 2, 2);
      expect(result2.status).to.be(statuses.okMineTriggered);
      expect(result2.result.requestsRemaining).to.be(0);
      expect(result2.result.owner).to.be('Team 1');
      expect(state.grid.cells[2][2].health).to.be(60);
      expect(team2.requests).to.be(0);

      expect(state.roleData.mines['2,2'].triggered).to.be(true);
      expect(state.roleData.mines['2,2'].owner).to.be('Team 1');
      expect(state.roleData.mines['2,2'].triggeredBy).to.be('Team 2');

      expect(team1.mineTriggeredBy).to.be('Team 2');

      const result3 = engine.attack('team-3', 2, 2);
      expect(result3.status).to.be(statuses.ok);
      expect(result3.result.requestsRemaining).to.be(29);
    });

    it('laying mine on top of another mine triggers both', () => {
      const state = db.get();

      const team1 = { key: 'team-1', name: 'Team 1', role: 'minelayer', requests: 30 };
      const team2 = { key: 'team-2', name: 'Team 2', role: 'minelayer', requests: 30 };

      state.teams.push(team1, team2);

      const result1 = engine.mine('team-1', 5, 5);
      expect(result1.status).to.be(statuses.ok);
      expect(result1.result.requestsRemaining).to.be(29);
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(team1.requests).to.be(29);

      const result2 = engine.mine('team-2', 5, 5);
      expect(result2.status).to.be(statuses.okMineTriggered);
      expect(result2.result.requestsRemaining).to.be(0);
      expect(result2.result.owner).to.be('Team 1');
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(team2.requests).to.be(0);

      expect(state.roleData.mines['5,5'].triggered).to.be(true);
      expect(state.roleData.mines['5,5'].owner).to.be('Team 1');
      expect(state.roleData.mines['5,5'].triggeredBy).to.be('Team 2');

      expect(team1.mineTriggeredBy).to.be('Team 2');

      team2.requests = 30;

      const result3 = engine.mine('team-2', 5, 5);
      expect(result3.status).to.be(statuses.roleAlreadyUsed);
      expect(team2.requests).to.be(30);
    });

    it('applying cloak to more than 3 cells fails', () => {
      const state = db.get();

      const team = { key: 'team-1', name: 'Team 1', role: 'cloaker', requests: 30 };

      state.teams.push(team);

      const cells = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 }
      ];

      const result = engine.cloak('team-1', cells);
      expect(result.status).to.be(statuses.roleTooManyCells);
      expect(result.result.maxCells).to.be(3);
      expect(team.requests).to.be(30);
    });

    it('applying cloak to invalid cells fails', () => {
      const state = db.get();

      const team1 = { key: 'team-1', name: 'Team 1', role: 'cloaker', requests: 30 };
      const team2 = { key: 'team-2', name: 'Team 2', role: 'cloaker', requests: 30 };

      state.teams.push(team1, team2);

      const cells1 = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 42 }
      ];

      const result1 = engine.cloak('team-1', cells1);
      expect(result1.status).to.be(statuses.invalidCell);
      expect(result1.result.x).to.be(2);
      expect(result1.result.y).to.be(42);
      expect(team1.requests).to.be(30);

      const cells2 = [
        { x: 12, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 42 }
      ];

      const result2 = engine.cloak('team-2', cells2);
      expect(result2.status).to.be(statuses.invalidCell);
      expect(result2.result.x).to.be(12);
      expect(result2.result.y).to.be(0);
      expect(team2.requests).to.be(30);
    });

    it('applying cloak to cells stores correct role state', () => {
      const state = db.get();

      const team = { key: 'team-1', name: 'Team 1', role: 'cloaker', roleUsed: false, requests: 30 };

      state.teams.push(team);

      const cells = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 }
      ];

      const result = engine.cloak('team-1', cells);
      expect(result.status).to.be(statuses.ok);
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

    it('applying cloak to cells causes their health to be reported as 100% in queries for 5 mins', () => {
      const state = db.get();

      const team = { key: 'team-1', name: 'Team 1', role: 'cloaker', requests: 30 };

      state.teams.push(team);

      state.grid.cells[3][2].health = 10;
      state.grid.cells[3][2].history.attacks['Some Team'] = 5;
      state.grid.cells[5][4].health = 1;
      state.grid.cells[5][4].history.defends['Team 1'] = 10;
      state.grid.cells[5][4].history.defends['Team 2'] = 5;

      const result = engine.cloak('team-1', [ { x: 2, y: 3 }, { x: 4, y: 5 } ]);
      expect(result.status).to.be(statuses.ok);
      expect(team.requests).to.be(29);

      const queryState1 = engine.query();

      expect(queryState1.result.grid[3][2].health).to.be(120);
      expect(Object.keys(queryState1.result.grid[3][2].history.attacks).length).to.be(0);
      expect(Object.keys(queryState1.result.grid[3][2].history.defends).length).to.be(0);

      expect(queryState1.result.grid[5][4].health).to.be(120);
      expect(Object.keys(queryState1.result.grid[5][4].history.attacks).length).to.be(0);
      expect(Object.keys(queryState1.result.grid[5][4].history.defends).length).to.be(0);

      roles.test.setCurrentTime(new Date().getTime() + (2.5 * 60 * 1000));

      const queryState2 = engine.query();

      expect(queryState2.result.grid[3][2].health).to.be(120);
      expect(queryState2.result.grid[5][4].health).to.be(120);

      roles.test.setCurrentTime(new Date().getTime() + (6 * 60 * 1000));

      const queryState3 = engine.query();

      expect(queryState3.result.grid[3][2].health).to.be(10);
      expect(queryState3.result.grid[5][4].health).to.be(1);
    });

    it('applying spy to unknown team or invalid square fails', () => {
      const state = db.get();

      const team1 = { key: 'team-1', name: 'Team 1', role: 'spy', requests: 30 };
      const team2 = { key: 'team-2', name: 'Team 2', role: 'minelayer', requests: 30 };

      state.teams.push(team1, team2);

      const result1 = engine.spy('team-1', 'Unknown Team', 4, 4);
      expect(result1.status).to.be(statuses.roleTeamNotFound);
      expect(result1.result.team).to.be('Unknown Team');
      expect(team1.requests).to.be(30);

      const result2 = engine.spy('team-1', 'Team 2', 42, 4);
      expect(result2.status).to.be(statuses.invalidCell);
      expect(result2.result.x).to.be(42);
      expect(result2.result.y).to.be(4);
      expect(team1.requests).to.be(30);
    });

    it('applying spy to valid team and square stores correct role state', () => {
      const state = db.get();

      const team1 = { key: 'team-1', name: 'Team 1', role: 'spy', requests: 30 };
      const team2 = { key: 'team-2', name: 'Team 2', role: 'cloaker', requests: 30 };

      state.teams.push(team1, team2);

      const result = engine.spy('team-1', 'Team 2', 1, 3);
      expect(result.status).to.be(statuses.ok);
      expect(result.result.requestsRemaining).to.be(29);
      expect(team1.requests).to.be(29);

      expect(state.roleData.redirects['Team 2'].remaining).to.be(15);
      expect(state.roleData.redirects['Team 2'].owner).to.be('Team 1');
      expect(state.roleData.redirects['Team 2'].x).to.be(1);
      expect(state.roleData.redirects['Team 2'].y).to.be(3);

      expect(team1.roleUsed).to.be(true);
      expect(team1.redirectedTeam).to.be('Team 2');
      expect(team1.redirectedTo).to.be('1,3');
    });

    it('attack commands from a redirected team go to the redirected square', () => {
      const state = db.get();

      const team1 = { key: 'team-1', name: 'Team 1', role: 'spy', requests: 30 };
      const team2 = { key: 'team-2', name: 'Team 2', role: 'cloaker', requests: 30 };

      state.teams.push(team1, team2);

      const result1 = engine.spy('team-1', 'Team 2', 1, 1);
      expect(result1.status).to.be(statuses.ok);
      expect(result1.result.requestsRemaining).to.be(29);
      expect(team1.requests).to.be(29);

      for (let i = 0; i < 14; i++) {
        expect(engine.attack('team-2', 5, 5).status).to.be(statuses.ok);
      }

      expect(team2.requests).to.be(16);
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(state.grid.cells[1][1].health).to.be(46);
      expect(state.roleData.redirects['Team 2'].remaining).to.be(1);

      expect(engine.attack('team-2', 5, 5).status).to.be(statuses.ok);

      expect(team2.requests).to.be(15);
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(state.grid.cells[1][1].health).to.be(45);
      expect(state.roleData.redirects['Team 2'].remaining).to.be(0);

      expect(engine.attack('team-2', 5, 5).status).to.be(statuses.ok);

      expect(team2.requests).to.be(14);
      expect(state.grid.cells[5][5].health).to.be(59);
      expect(state.grid.cells[1][1].health).to.be(45);
      expect(state.roleData.redirects['Team 2'].remaining).to.be(0);
    });

    it('defend commands from a redirected team go to the redirected square', () => {
      const state = db.get();

      const team1 = { key: 'team-1', name: 'Team 1', role: 'spy', requests: 30 };
      const team2 = { key: 'team-2', name: 'Team 2', role: 'cloaker', requests: 30 };

      state.teams.push(team1, team2);

      const result1 = engine.spy('team-1', 'Team 2', 1, 1);
      expect(result1.status).to.be(statuses.ok);
      expect(result1.result.requestsRemaining).to.be(29);
      expect(team1.requests).to.be(29);

      for (let i = 0; i < 7; i++) {
        expect(engine.attack('team-2', 5, 5).status).to.be(statuses.ok);
      }

      expect(team2.requests).to.be(23);
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(state.grid.cells[1][1].health).to.be(53);
      expect(state.roleData.redirects['Team 2'].remaining).to.be(8);

      for (let j = 0; j < 8; j++) {
        expect(engine.defend('team-2', 5, 5).status).to.be(statuses.ok);
      }

      expect(team2.requests).to.be(15);
      expect(state.grid.cells[5][5].health).to.be(60);
      expect(state.grid.cells[1][1].health).to.be(60);
      expect(state.roleData.redirects['Team 2'].remaining).to.be(0);
    });
  });
});