'use strict';

const fs = require('graceful-fs');
const path = require('path');
const types = require('./types');

const supportedTypes = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png'
};

const validExtension = url => {
  return Object.keys(supportedTypes).indexOf(path.extname(url)) !== -1;
};

const getMimeType = url => {
  return supportedTypes[path.extname(url)];
};

const staticFileHandler = (request, response) => {
  if (!validExtension(request.url)) {
    return response(types.error(404));
  }

  const filePath = path.join(process.cwd(), '/web', request.url);

  return fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return response(types.error(404));
    }

    return fs.readFile(filePath, (err, data) => {
      if (err) {
        return response(types.error(500));
      }

      const mime = getMimeType(filePath);
      return response(types.file(data, mime));
    });
  });
};

module.exports = staticFileHandler;
