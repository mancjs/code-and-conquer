const net = require('net');
const log = require('../../lib/log');
const commands = require('./commands');
const statuses = require('./statuses');
const config = require('../../config');

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
    socket.write(`${JSON.stringify(result)}\n`);
  };

  const runCommand = (socket, request) => {
    const req = parseRequest(request);

    if (!commands[req.name]) {
      return sendStatus(socket, { status: statuses.missingCommand });
    }

    log('game', `command: ${request}`);

    return sendStatus(socket, commands[req.name](req.team, req.args));
  };

  const runCommands = (socket, buffer) => {
    const requests = buffer.split('\n');

    for (let i = 0; i < requests.length - 1; i++) {
      runCommand(socket, requests[i]);
    }

    return requests[requests.length - 1];
  };

  const server = net.createServer(socket => {
    let buffer = '';

    log('game', `${socket.remoteAddress} connected`);

    socket.on('data', chunk => {
      buffer += chunk.toString();
      buffer = runCommands(socket, buffer);
    });
  });

  const { bind, port } = config.server.game;

  server.listen(port, bind);
  log('game', `listening on ${bind}:${port}`);
};

module.exports = {
  startServer
};
