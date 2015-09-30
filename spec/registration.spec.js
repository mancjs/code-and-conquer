var db = require('../db/db');
var expect = require('expect.js');
var colours = require('../lib/colours');
var registration = require('../registration/registration');

var createString = function(length) {
  return new Array(length + 1).join('.');
};

beforeEach(function() {
  db.clear();
});

describe('registration', function() {
  it('rejects when registration is closed', function() {
    registration.close();

    var response = registration.createTeam('Team Name', 'user@host.com', 'minelayers');

    expect(response.err).to.match(/closed/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when name is missing', function() {
    registration.open();

    var response = registration.createTeam(null, 'user@host.com', 'spies');

    expect(response.err).to.match(/team name/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when name is more than 25 chars', function() {
    registration.open();

    var response = registration.createTeam(createString(26), 'user@host.com', 'cloakers');

    expect(response.err).to.match(/team name/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when email is missing', function() {
    registration.open();

    var response = registration.createTeam('Team Name', null, 'minelayers');

    expect(response.err).to.match(/email address/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when email is more than 50 chars', function() {
    registration.open();

    var response = registration.createTeam('Team Name', createString(51), 'cloakers');

    expect(response.err).to.match(/email address/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when role is missing', function() {
    registration.open();

    var response = registration.createTeam('Existing Team Name', 'user@host.com', null);

    expect(response.err).to.match(/Valid roles/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when role is invalid', function() {
    registration.open();

    var response = registration.createTeam('Existing Team Name', 'user@host.com', 'invalid');

    expect(response.err).to.match(/Valid roles/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when email is already in use', function() {
    registration.open();

    db.get().teams.push({ email: 'existing@host.com' });
    var response = registration.createTeam('Team Name', 'existing@host.com', 'minelayers');

    expect(response.err).to.match(/same name or email/);
    expect(db.get().teams.length).to.be(1);
  });

  it('rejects when name is already in use', function() {
    registration.open();

    db.get().teams.push({ name: 'Existing Team Name' });
    var response = registration.createTeam('Existing Team Name', 'user@host.com', 'cloakers');

    expect(response.err).to.match(/same name or email/);
    expect(db.get().teams.length).to.be(1);
  });

  it('accepts when name, email and role are valid', function() {
    registration.open();

    var response = registration.createTeam('Team Name', 'user@host.com', 'spy');
    var validKeys = ['key', 'gravatar', 'colour', 'role', 'name', 'email', 'requests'];

    expect(response.err).to.be(undefined);
    expect(response.team).to.only.have.keys(validKeys);
    expect(db.get().teams.length).to.be(1);
  });

  it('assigns new colours to successive registrations', function() {
    registration.open();

    var response1 = registration.createTeam('Team Name 1', 'user1@host.com', 'spy');
    var response2 = registration.createTeam('Team Name 2', 'user2@host.com', 'cloaker');

    expect(response1.team.colour).to.not.be(response2.team.colour);
  });

  it('rejects registration when there are no more colours to use', function() {
    registration.open();

    colours.all.forEach(function() {
      db.get().teams.push({ name: 'some-team' });
    });

    var response = registration.createTeam('Team Name', 'user@host.com', 'spy');

    expect(response.err).to.match(/is full/);
    expect(db.get().teams.length).to.be(colours.all.length);
  });

  it('returns correct team when queried', function() {
    registration.open();

    var response = registration.createTeam('Team Name', 'user@host.com', 'minelayer');
    var team = registration.getTeamByKey(response.team.key);

    expect(team).not.to.be(undefined);
    expect(team.key).to.be.ok();
    expect(team.gravatar).to.be.ok();
    expect(team.colour).to.be(colours.all[0]);
    expect(team.role).to.be('minelayer');
    expect(team.name).to.be('Team Name');
    expect(team.email).to.be('user@host.com');
    expect(team.requests).to.be(30);
  });
});