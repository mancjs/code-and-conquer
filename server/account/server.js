'use strict';

const http = require('http');
const querystring = require('querystring');

const config = require('../../config');
const ddos = require('./ddos');
const log = require('../../lib/log');
const routes = require('./routes');
const staticFileHandler = require('./file-handler');

const startServer = () => {
  const handler = (req, res) => {
    return buildRequestObject(req, requestData => {
      const routeHandler = routes[requestData.key] || staticFileHandler;

      return routeHandler(requestData, responseData => {
        return serve(res, responseData);
      });
    });
  };

  const server = http.createServer(handler);
  const { bind, port } = config.server.account;

  server.on('connection', ddos.handler);
  server.listen(port, bind);

  log('account', `listening on ${bind}:${port}`);
};

const buildRequestObject = (req, callback) => {
  const parts = req.url.split('?');

  const requestData = {
    url: parts[0],
    key: req.method + ' ' + parts[0],
    query: querystring.parse(parts[1]),
    body: {}
  };

  if (!requestData.query) {
    requestData.query = {};
  }

  if (req.method !== 'POST') {
    return callback(requestData);
  }

  const jsonString = '';

  req.on('data', data => {
    jsonString += data;

    if (jsonString.length > 1e6) {
      jsonString = '{}';
      req.connection.destroy();
    }
  });

  req.on('end', () => {
    try {
      requestData.body = JSON.parse(jsonString);
    } catch (err) {
      requestData.body = {};
    }

    return callback(requestData);
  });
};

const serve = (res, response) => {
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
  startServer
};
