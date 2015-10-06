var all = [
  '#556C2F',
  '#CD54D7',
  '#CE4D30',
  '#678EC1',
  '#6ECF4A',
  '#C88E81',
  '#66D097',
  '#603E66',
  '#CB913A',
  '#496966',
  '#CB4565',
  '#91CCCF',
  '#796ACB',
  '#703D29',
  '#C9CF45',
  '#C04996',
  '#BDC889',
  '#CC9DC9'];

var get = function(totalTeams) {
  return all[totalTeams];
};

module.exports = {
  get: get,
  all: all
};