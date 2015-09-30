var all = [
  '#00FF00',
  '#0000FF',
  '#FF0000',
  '#01FFFE',
  '#FFA6FE',
  '#FFDB66',
  '#006401',
  '#010067',
  '#95003A',
  '#007DB5',
  '#FF00F6',
  '#FFEEE8',
  '#774D00',
  '#FF937E',
  '#01D0FF',
  '#7544B1',
  '#FF6E41',
  '#6B6882'
];

var get = function(totalTeams) {
  return all[totalTeams];
};

module.exports = {
  get: get,
  all: all
};