var events = [];

var getTimestamp = function() {
  var time = new Date;

  return [time.getHours(), time.getMinutes(), time.getSeconds()].map(function(part) {
    return part < 10 ? '0' + part : part;
  }).join(':');
};

var add = function(message) {
  events.push(getTimestamp() + ': ' + message);
};

var getAll = function() {
  return events;
};

module.exports = {
  add: add,
  getAll: getAll
};