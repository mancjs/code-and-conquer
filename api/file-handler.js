var fs = require('graceful-fs');
var path = require('path');
var types = require('./types');

var supportedTypes = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png'
};

var validExtension = function(url) {
  return Object.keys(supportedTypes).indexOf(path.extname(url)) !== -1;
};

var getMimeType = function(url) {
  return supportedTypes[path.extname(url)];
};

var staticFileHandler = function(request, response) {
  if (!validExtension(request.url)) {
    return response(types.error(404));
  }

  var filePath = path.join(process.cwd(), '/web', request.url);

  return fs.stat(filePath, function(err, stats) {
    if (err || !stats.isFile()) {
      return response(types.error(404));
    }

    return fs.readFile(filePath, function(err, data) {
      if (err) {
        return response(types.error(500));
      }

      var mime = getMimeType(filePath);
      return response(types.file(data, mime));
    });
  });
};

module.exports = staticFileHandler;