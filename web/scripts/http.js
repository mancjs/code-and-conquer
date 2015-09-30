var http = (function() {
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
    post: post
  };
})();