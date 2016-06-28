'use strict';

const net = require('net');
const commands = require('./commands');
const config = require('../../config');
const log = require('../../lib/log');

const startServer = () => {
  const sendHelp = socket => {
    socket.write(`commands: ${Object.keys(commands).join(', ')}\n`);
    sendPrompt(socket);
  };

  const sendPrompt = socket => {
    socket.write('> ');
  };

  const sendWelcome = socket => {
    socket.write('\n');
    socket.write('Code & Conquer Admin Server\n');
    socket.write(`Hello ${socket.remoteAddress}\n\n`);
    sendPrompt(socket);
  };

  const parseCommand = data => {
    const parts = data.trim().split(' ');

    return {
      name: parts[0],
      args: parts.slice(1).join(' ')
    };
  };

  const server = net.createServer(socket => {
    log('admin', `${socket.remoteAddress} connected`);

    sendWelcome(socket);

    socket.on('data', data => {
      const cmd = parseCommand(data.toString());

      if (cmd.name === 'exit') {
        return socket.end('adiós\n\n');
      }

      if (!commands[cmd.name]) {
        return sendHelp(socket);
      }

      const result = commands[cmd.name](cmd.args);

      if (result) {
        socket.write(`${result}\n`);
      }

      sendPrompt(socket);
    });
  });

  const { bind, port } = config.server.admin;

  server.listen(port, bind);
  log('admin', `listening on ${bind}:${port}`);
};

module.exports = {
  startServer
};
