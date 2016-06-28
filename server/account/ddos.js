const log = require('../../lib/log');

let clients = {};
let enabled = false;
let unbanInterval;

const enable = on => {
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

const isEnabled = () => {
  return enabled;
};

const handler = socket => {
  if (!enabled) {
    return;
  }

  const address = socket.remoteAddress;

  if (!clients[address]) {
    clients[address] = {
      requests: 1,
      banned: false,
      added: new Date().getTime()
    };
    return;
  }

  if (clients[address].banned) {
    return socket.destroy();
  }

  clients[address].requests += 1;

  if (clients[address].requests >= 1000) {
    clients[address].banned = true;
    log('ddos', `ban added ${address}`);
  }
};

const clearBans = () => {
  Object.keys(clients).forEach(address => {
    const duration = new Date().getTime() - clients[address].added;

    if (duration >= 1 * 60 * 1000) {
      if (clients[address].banned) {
        log('ddos', `ban cleared ${address}`);
      }

      delete clients[address];
    }
  });
};

const getData = () => {
  return clients;
};

const clear = () => {
  clients = {};
  log('ddos', 'all cleared');
};

module.exports = {
  handler,
  enable,
  isEnabled,
  getData,
  clear
};
