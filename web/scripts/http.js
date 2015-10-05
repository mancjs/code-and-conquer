var http = (function() {
  var get = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);

    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          return callback(null, JSON.parse(xhr.responseText));
        } catch (err) {
          return callback(err);
        }
      } else {
        return callback('Request failed with ' + xhr.status);
      }
    };

    xhr.onerror = function() {
      return callback('Request failed with ' + xhr.status);
    };

    xhr.send();
  };

  var post = function(url, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          return callback(null, JSON.parse(xhr.responseText));
        } catch (err) {
          return callback(err);
        }
      } else {
        return callback('Request failed with ' + xhr.status);
      }
    };

    xhr.send(JSON.stringify(data));
  };

  return {
    get: get,
    post: post
  };
})();