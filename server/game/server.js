const net = require('net');
const log = require('../../lib/log');
const commands = require('./commands');
const statuses = require('./statuses');

const startServer = port => {
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
    log('game', `command: ${request}`);

    const req = parseRequest(request);

    if (!commands[req.name]) {
      return sendStatus(socket, { status: statuses.missingCommand });
    }

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

  server.listen(port, '0.0.0.0');
  log('game', `listening on ${port}`);
};

module.exports = {
  startServer
};
