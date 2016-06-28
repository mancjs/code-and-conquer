module.exports = {
  server: {
    admin: { bind: '127.0.0.1', port: 9000 },
    account: { bind: '0.0.0.0', port: 9001 },
    game: { bind: '0.0.0.0', port: 9002 }
  },
  game: {
    roles: {}
  }
};