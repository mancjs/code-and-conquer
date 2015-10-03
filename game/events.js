var events = [];

var getTimestamp = function() {
  var time = new Date;

  return [time.getHours(), time.getMinutes(), time.getSeconds()].map(function(part) {
    return part < 10 ? '0' + part : part;
  }).join(':');
};

var squareConquered = function(args) {
  var message = [
    args.newOwner,
    'conquered cell',
    args.coords.x + ',' + args.coords.y,
    'from',
    args.previousOwner
  ].join(' ');

  events.push(message);
};

var getAll = function() {
  return events;
};

var clear = function() {
  events = [];
};

module.exports = {
  squareConquered: squareConquered,
  getAll: getAll,
  clear: clear
};