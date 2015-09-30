var fs = require('graceful-fs');
var log = require('../lib/log');

var game = {
  registrationOpen: false,
  date: new Date,
  teams: [],
  grid: []
};

var config = {
  database: process.cwd() + '/data/game.json',
  snapshotPath: process.cwd() + '/data/snapshots',
  saveInterval: 10000,
  lastSnapshot: 0
};

var get = function() {
  return game;
};

var load = function() {
  if (fs.existsSync(config.database)) {
    game = JSON.parse(fs.readFileSync(config.database, 'utf8'));
    log('db', 'loaded game from ' + new Date(game.date));
  }

  setTimeout(save, config.saveInterval);
};

var clear = function() {
  game = {
    registrationOpen: false,
    date: new Date,
    teams: [],
    grid: []
  };

  return get();
};

var save = function() {
  try {
    var json = JSON.stringify(game);

    return fs.writeFile(config.database, json, function(err) {
      if (err) {
        return log('db', 'error saving file: ' + err);
      }

      return takeSnapshot(function() {
        setTimeout(save, config.saveInterval);
      });
    });
  } catch (err) {
    log('db', 'error stringifying data: ' + err);
  }
};

var takeSnapshot = function(callback) {
  var getSnapshotName = function() {
    var time = new Date;

    var timestamp = [time.getHours(), time.getMinutes(), time.getSeconds()].map(function(part) {
      return part < 10 ? '0' + part : part;
    }).join('');

    return 'game-' + timestamp + '.json';
  };

  if (new Date() - config.lastSnapshot < (1000 * 60)) {
    return callback();
  }

  config.lastSnapshot = new Date;
  return copy(config.database, config.snapshotPath + '/' + getSnapshotName(), callback);
};

var copy = function(input, output, callback) {
  var writeStream = fs.createWriteStream(output);
  var complete = false;

  writeStream.on('close', function() {
    if (complete) {
      return;
    }

    complete = true;
    return callback();
  });

  fs.createReadStream(input).pipe(writeStream);
};

module.exports = {
  get: get,
  load: load,
  clear: clear
};