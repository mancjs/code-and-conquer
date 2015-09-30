var querystring = require('querystring');
var http = require('http');
var log = require('../lib/log');

var routes = require('./routes');
var staticFileHandler = require('./file-handler');

var startServer = function(port) {
  var handler = function(req, res) {
    return buildRequestObject(req, function(requestData) {
      var handler = routes[requestData.key] || staticFileHandler;

      return handler(requestData, function(response) {
        return serve(res, response);
      });
    });
  };

  var server = http.createServer(handler);
  server.listen(port);

  log('api', 'listening on :' + port);
};

var buildRequestObject = function(req, callback) {
  var parts = req.url.split('?');

  var requestData = {
    url: parts[0],
    key: req.method + ' ' + parts[0],
    query: parts[1] && querystring.parse(parts[1])
  };

  if (req.method !== 'POST') {
    return callback(requestData);
  }

  var jsonString = '';

  req.on('data', function(data) {
    jsonString += data;

    if (jsonString.length > 1e6) {
      jsonString = '{}';
      req.connection.destroy();
    }
  });

  req.on('end', function() {
    try {
      requestData.body = JSON.parse(jsonString);
    } catch (err) {}

    return callback(requestData);
  });
};

var serve = function(res, response) {
  if (response.err) {
    res.statusCode = response.err;
    return res.end();
  }

  if (response.redirect) {
    res.writeHead(302, { location: response.redirect });
    return res.end();
  }

  res.setHeader('Content-Length', response.data.length);
  res.setHeader('Content-Type', response.mime);
  res.statusCode = 200;
  res.end(response.data);
};

module.exports = {
  startServer: startServer
};