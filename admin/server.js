var net = require('net');
var log = require('../lib/log');
var commands = require('./commands');

var startServer = function(port) {
  var sendHelp = function(socket) {
    socket.write('commands: ' + Object.keys(commands).join(', ') + '\n');
    sendPrompt(socket);
  };

  var sendPrompt = function(socket) {
    socket.write('> ');
  };

  var sendWelcome = function(socket) {
    socket.write('\n');
    socket.write('Code & Conquer Admin Server\n');
    socket.write('Hello ' + socket.remoteAddress + '\n\n');
    sendPrompt(socket);
  };

  var parseCommand = function(data) {
    var parts = data.trim().split(' ');

    return {
      name: parts[0],
      args: parts.slice(1).join(' ')
    };
  };

  var server = net.createServer(function(socket) {
    log('admin', socket.remoteAddress + ' connected');

    sendWelcome(socket);

    socket.on('data', function(data) {
      var cmd = parseCommand(data.toString());

      if (cmd.name === 'exit') {
        return socket.end('adiós\n\n');
      }

      if (!commands[cmd.name]) {
        return sendHelp(socket);
      }

      var result = commands[cmd.name](cmd.args);

      if (result) {
        socket.write(result + '\n');
      }

      sendPrompt(socket);
    });
  });

  server.listen(port, 'localhost');
  log('admin', 'listening on ' + port);
};

module.exports = {
  startServer: startServer
};
