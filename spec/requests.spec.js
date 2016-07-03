/* eslint-env mocha */
'use strict';

const expect = require('expect.js');

const db = require('../lib/db');
const requests = require('../server/game/requests');

describe('requests', () => {
  beforeEach(() => {
    const state = db.init();
    state.teams.push({ key: 'team-1', requests: 30 });
    state.teams.push({ key: 'team-2', requests: 30 });
    state.teams.push({ key: 'team-3', requests: 30 });
  });

  it('refreshes all team requests after refresh period @slow', done => {
    const state = db.get();

    setTimeout(() => {
      expect(state.teams[0].requests).to.be(30);
      expect(state.teams[1].requests).to.be(30);
      expect(state.teams[2].requests).to.be(30);
      return done();
    }, 2000);

    requests.startRefreshTimer(1);

    state.teams[0].requests = 0;
    state.teams[1].requests = 15;
    state.teams[2].requests = 30;
  });

  it('calculates the correct number of seconds until next refresh', () => {
    const date = new Date;

    expect(requests.getSecondsUntilNextRefresh({
      refreshRateSecs: 60,
      currentTime: new Date(date.getTime() + (35 * 1000)),
      lastRefresh: date
    })).to.be(25);

    expect(requests.getSecondsUntilNextRefresh({
      refreshRateSecs: 60,
      currentTime: new Date(date.getTime() + (60 * 1000)),
      lastRefresh: date
    })).to.be(0);

    expect(requests.getSecondsUntilNextRefresh({
      refreshRateSecs: 60,
      currentTime: new Date(date.getTime() + 0),
      lastRefresh: date
    })).to.be(60);
  });
});
