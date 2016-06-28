const getTimestamp = () => {
  const time = new Date;

  return [time.getHours(), time.getMinutes(), time.getSeconds()].map(part => {
    return part < 10 ? `0${part}` : part;
  }).join(':');
};

const log = (context, message) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${getTimestamp()} ${context}: ${message}`);
  }
};

module.exports = log;
