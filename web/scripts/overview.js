(function() {
  var timer;
  var $refreshSeconds;
  var ticks = 0;

  var countDownSeconds = function() {
    ticks += 1;

    if (ticks >= 5) {
      return http.get('/api/overview-data', function(err, data) {
        if (!err) {
          document.getElementById('refresh-seconds').innerText = data.refreshSeconds;
        }

        ticks = 0;
        return startRefreshCountdownTimer();
      });
    }

    var seconds = parseInt($refreshSeconds.innerText) - 1;

    if (seconds <= 0) {
      seconds = 60;
    }

    $refreshSeconds.innerText = (seconds < 10) ? ('0' + seconds) : seconds;

    return startRefreshCountdownTimer();
  };

  var startRefreshCountdownTimer = function() {
    timer = setTimeout(countDownSeconds, 1000);
  };

  var init = function() {
    $refreshSeconds = document.getElementById('refresh-seconds');
    startRefreshCountdownTimer();
  };

  init();
})();