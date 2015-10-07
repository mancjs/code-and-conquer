(function() {
  var timer;
  var gameState;
  var ticks = 0;
  var $titlePrefix;
  var $refreshSeconds;

  var fetchStateUpdate = function(callback) {
    return http.get('/api/overview-data', function(err, state) {
      if (!err) {
        gameState = state;

        if (!gameState.gameStarted) {
          $titlePrefix.innerText = 'Game Not Started';
          $refreshSeconds.innerText = '';
        } else {
          $titlePrefix.innerText = 'Next Requests Refresh:';
          $refreshSeconds.innerText = gameState.refreshSeconds;
        }
      }

      return callback();
    });
  };

  var refresh = function() {
    ticks += 1;

    if (ticks >= 10) {
      return fetchStateUpdate(function() {
        ticks = 0;
        startRefreshTimer();
        window.buildGrid(gameState.grid);
      });
    }

    var seconds = parseInt($refreshSeconds.innerText) - 1;

    if (!isNaN(seconds)) {
      if (seconds <= 0) {
        seconds = 60;
      }

      $refreshSeconds.innerText = (seconds < 10) ? ('0' + seconds) : seconds;
    }

    return startRefreshTimer();
  };

  var startRefreshTimer = function() {
    clearTimeout(timer);
    timer = setTimeout(refresh, 1000);
  };

  var init = function() {
    $titlePrefix = document.getElementById('title-prefix');
    $refreshSeconds = document.getElementById('refresh-seconds');

    fetchStateUpdate(function() {
      window.buildGrid(gameState.grid);
      return startRefreshTimer();
    });
  };

  init();
})();