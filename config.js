module.exports = {
  server: {
    admin: { bind: '127.0.0.1', port: 9000 },
    account: { bind: '0.0.0.0', port: 9001 },
    game: { bind: '0.0.0.0', port: 9002, maxBuffer: 1024, minQueryGap: 1000 }
  },
  game: {
    bonus: { x2: 0.1, x3: 0.05 },
    health: { cpu: 60, player: 120 },
    requests: { refresh: 60, amount: 30 },
    roles: {
      cloak: { minutes: 5 },
      spy: { redirects: 15 }
    }
  }
};