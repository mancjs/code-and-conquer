'use strict';

const net = require('net');

const commands = require('./commands');
const config = require('../../config');
const log = require('../../lib/log');
const statuses = require('./statuses');

const startServer = () => {
  const parseRequest = data => {
    const parts = data.trim().split(' ');

    return {
      name: parts[0],
      team: parts[1],
      args: parts.slice(2)
    };
  };

  const sendStatus = (socket, result) => {
    if (socket.connected) {
      socket.write(`${JSON.stringify(result)}\n`);
    }
  };

  const runCommand = (socket, request) => {
    const req = parseRequest(request);

    if (!commands[req.name]) {
      return sendStatus(socket, { status: statuses.missingCommand });
    }

    log('game', `command: ${request}`);

    const result = commands[req.name](req.team, req.args);

    if (result.status === statuses.protocolRateLimit) {
      log('game', `${socket.remoteAddress} killed after hitting rate limit`);
      socket.destroy();
      return false;
    }

    sendStatus(socket, result);
    return true;
  };

  const runCommands = (socket, buffer) => {
    const requests = buffer.split('\n');

    for (let i = 0; i < requests.length - 1; i++) {
      const successful = runCommand(socket, requests[i]);

      if (!successful) {
        break;
      }
    }

    return requests[requests.length - 1];
  };

  const server = net.createServer(socket => {
    let buffer = '';

    log('game', `${socket.remoteAddress} connected`);

    socket.connected = true;

    socket.on('data', chunk => {
      buffer += chunk.toString();

      if (buffer.length > config.server.game.maxBuffer) {
        log('game', `${socket.remoteAddress} killed after sending too much data`);
        return socket.destroy();
      }

      buffer = runCommands(socket, buffer);
    });

    socket.on('end', () => {
      socket.connected = false;
    });

    socket.on('close', () => {
      socket.connected = false;
    });
  });

  const { bind, port } = config.server.game;

  server.listen(port, bind);
  log('game', `listening on ${bind}:${port}`);
};

module.exports = {
  startServer
};
