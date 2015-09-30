(function() {
  var margin = 0;

  var init = function() {
    initialiseSliderControls();
    initialiseRegistrationForm();
  };

  var initialiseSliderControls = function() {
    var updateUi = function() {
      document.querySelector('.roles-container').style.marginLeft = margin + '%';
      document.getElementById('dot1').className = (margin === 0) ? 'current': '';
      document.getElementById('dot2').className = (margin === -100) ? 'current': '';
      document.getElementById('dot3').className = (margin === -200) ? 'current': '';
    };

    var moveLeft = function() {
      margin += 100;

      if (margin > 0) {
        margin = 0;
      }

      return updateUi();
    };

    var moveRight = function() {
      margin -= 100;

      if (margin < -200) {
        margin = -200;
      }

      return updateUi();
    };

    var leftArrows = document.querySelectorAll('.left-arrow');
    var rightArrows = document.querySelectorAll('.right-arrow');

    for (var i = 0; i < leftArrows.length; i++) {
      leftArrows[i].addEventListener('click', moveLeft);
      rightArrows[i].addEventListener('click', moveRight);
    }

    updateUi();
  };

  var initialiseRegistrationForm = function() {
    var registerButtonClicked = function() {
      var name = this.parentNode.querySelector('input[name="team"]').value;
      var email = this.parentNode.querySelector('input[name="email"]').value;
      var role = this.parentNode.querySelector('input[name="role"]').value;
      var errorContainer = this.parentNode.querySelector('.error');

      return register(name, email, role, function(err, response) {
        if (err) {
          errorContainer.style.display = 'block';
          errorContainer.innerText = err;
          return;
        }

        window.location = response.url;
      });
    };

    var buttons = document.querySelectorAll('input[type="submit"]');

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', registerButtonClicked.bind(buttons[i]));
    }
  };

  var register = function(name, email, role, callback) {
    var request = {
      name: name,
      email: email,
      role: role
    };

    http.post('/register', request, function(err, response) {
      return callback(err || response.err, response);
    });
  };

  init();
})();