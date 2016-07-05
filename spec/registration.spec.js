/* eslint-env mocha */
'use strict';

const expect = require('expect.js');

const colours = require('../lib/colours');
const db = require('../lib/db');
const registration = require('../server/account/registration');

const createString = length => {
  return new Array(length + 1).join('.');
};

beforeEach(() => {
  db.init();
});

describe('registration', () => {
  it('rejects when registration is closed', () => {
    registration.close();

    const response = registration.createTeam('Team_Name', 'user@host.com', 'minelayer');

    expect(response.err).to.match(/closed/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when name is missing', () => {
    registration.open();

    const response = registration.createTeam(null, 'user@host.com', 'spy');

    expect(response.err).to.match(/team name/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when name is more than 25 chars', () => {
    registration.open();

    const response = registration.createTeam(createString(26), 'user@host.com', 'cloaker');

    expect(response.err).to.match(/team name/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when name is "cpu"', () => {
    registration.open();

    const response = registration.createTeam('cpu', 'user@host.com', 'cloaker');

    expect(response.err).to.match(/valid team name/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when email is missing', () => {
    registration.open();

    const response = registration.createTeam('Team_Name', null, 'minelayer');

    expect(response.err).to.match(/email address/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when email is more than 50 chars', () => {
    registration.open();

    const response = registration.createTeam('Team_Name', createString(51), 'cloaker');

    expect(response.err).to.match(/email address/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when role is missing', () => {
    registration.open();

    const response = registration.createTeam('Existing_Team_Name', 'user@host.com', null);

    expect(response.err).to.match(/Valid roles/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when role is invalid', () => {
    registration.open();

    const response = registration.createTeam('Existing_Team_Name', 'user@host.com', 'invalid');

    expect(response.err).to.match(/Valid roles/);
    expect(db.get().teams.length).to.be(0);
  });

  it('rejects when email is already in use', () => {
    registration.open();

    db.get().teams.push({ email: 'existing@host.com' });
    const response = registration.createTeam('Team_Name', 'existing@host.com', 'minelayer');

    expect(response.err).to.match(/same name or email/);
    expect(db.get().teams.length).to.be(1);
  });

  it('rejects when name is already in use', () => {
    registration.open();

    db.get().teams.push({ name: 'Existing_Team_Name' });
    const response = registration.createTeam('Existing_Team_Name', 'user@host.com', 'cloaker');

    expect(response.err).to.match(/same name or email/);
    expect(db.get().teams.length).to.be(1);
  });

  it('accepts when name, email and role are valid', () => {
    registration.open();

    const response = registration.createTeam('Team_Name', 'user@host.com', 'spy');
    const validKeys = ['key', 'gravatar', 'colour', 'roleUsed', 'role', 'name', 'email', 'requests'];

    expect(response.err).to.be(undefined);
    expect(response.team).to.only.have.keys(validKeys);
    expect(db.get().teams.length).to.be(1);
  });

  it('assigns new colours to successive registrations', () => {
    registration.open();

    const response1 = registration.createTeam('Team_Name_1', 'user1@host.com', 'spy');
    const response2 = registration.createTeam('Team_Name_2', 'user2@host.com', 'cloaker');

    expect(response1.team.colour).to.not.be(response2.team.colour);
  });

  it('rejects registration when there are no more colours to use', () => {
    registration.open();

    colours.all.forEach(() => {
      db.get().teams.push({ name: 'some-team' });
    });

    const response = registration.createTeam('Team_Name', 'user@host.com', 'spy');

    expect(response.err).to.match(/is full/);
    expect(db.get().teams.length).to.be(colours.all.length);
  });

  it('returns correct team when queried', () => {
    registration.open();

    const response = registration.createTeam('Team_Name', 'user@host.com', 'minelayer');
    const team = registration.getTeamByKey(response.team.key);

    expect(team).not.to.be(undefined);
    expect(team.key).to.be.ok();
    expect(team.gravatar).to.be.ok();
    expect(team.colour).to.be(colours.all[0]);
    expect(team.role).to.be('minelayer');
    expect(team.name).to.be('Team_Name');
    expect(team.email).to.be('user@host.com');
    expect(team.requests).to.be(30);
  });
});
