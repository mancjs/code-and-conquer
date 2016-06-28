'use strict';

const fs = require('graceful-fs');

const log = require('../lib/log');

let game;

const config = {
  database: `${process.cwd()}/data/game.json`,
  snapshotPath: `${process.cwd()}/data/snapshots`,
  saveInterval: 10000,
  lastSnapshot: 0
};

const get = () => {
  return game;
};

const load = () => {
  if (fs.existsSync(config.database)) {
    game = JSON.parse(fs.readFileSync(config.database, 'utf8'));
  }

  setTimeout(save, config.saveInterval);

  return get();
};

const init = () => {
  game = {
    registrationOpen: false,
    gameStarted: false,
    date: new Date,
    roleData: {
      mines: {},
      cloaks: [],
      redirects: {}
    },
    teams: [],
    grid: null
  };

  return get();
};

const save = oneOff => {
  const rescheduleNextSave = !oneOff;

  try {
    const json = JSON.stringify(game);

    return fs.writeFile(config.database, json, err => {
      if (err) {
        return log('db', `error saving file: ${err}`);
      }

      return takeSnapshot(!!oneOff, () => {
        if (rescheduleNextSave) {
          setTimeout(save, config.saveInterval);
        }
      });
    });
  } catch (err) {
    log('db', `error stringifying data: ${err}`);
  }
};

const takeSnapshot = (force, callback) => {
  const getSnapshotName = () => {
    const time = new Date;

    const timestamp = [time.getHours(), time.getMinutes(), time.getSeconds()].map(part => {
      return part < 10 ? `0${part}` : part;
    }).join('');

    return `game-${timestamp}.json`;
  };

  if (!force && new Date() - config.lastSnapshot < (1000 * 60)) {
    return callback();
  }

  config.lastSnapshot = new Date;
  return copy(config.database, `${config.snapshotPath}/${getSnapshotName()}`, callback);
};

const takeFinalSnapshot = () => {
  save(true);
};

const copy = (input, output, callback) => {
  const writeStream = fs.createWriteStream(output);
  let complete = false;

  writeStream.on('close', () => {
    if (complete) {
      return;
    }

    complete = true;
    return callback();
  });

  fs.createReadStream(input).pipe(writeStream);
};

init();

module.exports = {
  get,
  load,
  init,
  takeFinalSnapshot
};
