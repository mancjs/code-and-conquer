var log = require('../../lib/log');

var clients = {};
var enabled = false;
var unbanInterval;

var enable = function(on) {
  enabled = on;

  if (enabled) {
    unbanInterval = setInterval(clearBans, 5000);
    log('ddos', 'enabled');
  } else {
    clearInterval(unbanInterval);
    clients = {};
    log('ddos', 'disabled');
  }
};

var isEnabled = function() {
  return enabled;
};

var handler = function(socket) {
  if (!enabled) {
    return;
  }

  var address = socket.remoteAddress;

  if (!clients[address]) {
    clients[address] = { requests: 1, banned: false, added: new Date().getTime() };
    return;
  }

  if (clients[address].banned) {
    return socket.destroy();
  }

  clients[address].requests += 1;

  if (clients[address].requests >= 1000) {
    clients[address].banned = true;
    log('ddos', 'ban added ' + address);
  }
};

var clearBans = function() {
  Object.keys(clients).forEach(function(address) {
    var duration = new Date().getTime() - clients[address].added;

    if (duration >= 1 * 60 * 1000) {
      if (clients[address].banned) {
        log('ddos', 'ban cleared ' + address);
      }

      delete clients[address];
    }
  });
};

var getData = function() {
  return clients;
};

var clear = function() {
  clients = {};
  log('ddos', 'all cleared');
};

module.exports = {
  handler: handler,
  enable: enable,
  isEnabled: isEnabled,
  getData: getData,
  clear: clear
};