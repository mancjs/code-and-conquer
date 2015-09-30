var getTimestamp = function() {
  var time = new Date;

  return [time.getHours(), time.getMinutes(), time.getSeconds()].map(function(part) {
    return part < 10 ? '0' + part : part;
  }).join(':');
};

var log = function(context, message) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(getTimestamp() + ' ' + context + ': ' + message);
  }
};

module.exports = log;