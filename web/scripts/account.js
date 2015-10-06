(function() {
  var $selectedCell;
  var $playerList;
  var $ownedSquares;
  var $freeSquares;
  var $grid;

  var teams;
  var ownedSquares = 0;
  var freeSquares = 0;

  var init = function() {
    $playerList = document.getElementById('player-list');
    $grid = document.getElementById('user-grid');
    $ownedSquares = document.getElementById('owned-squares');
    $freeSquares = document.getElementById('free-squares');

    initialiseGridClickHandler($grid);
    setTimeout(fetchAccountData, 1000);
  };

  var fetchAccountData = function() {
    http.get('/api/account-data?key=' + window.myKey, function(err, accountData) {
      if (err) {
        return;
      }

      buildTeamsList(accountData.teams, accountData.grid);
      drawGrid($grid, accountData.grid);
      drawPlayers();

      $ownedSquares.innerText = ownedSquares;
      $freeSquares.innerText = freeSquares;
    });
  };

  var createElement = function(tag, className) {
    var $element = document.createElement(tag);
    $element.className = className;
    return $element;
  };

  var buildTeamsList = function(teamData, grid) {
    teams = {};
    ownedSquares = 0;
    freeSquares = 0;

    teamData.forEach(function(team) {
      teams[team.name] = {
        gravatar: team.gravatar,
        colour: team.colour,
        name: team.name,
        score: 0
      };
    });

    grid.forEach(function(row) {
      row.forEach(function(cell) {
        if (cell.owner.name === window.myName) {
          ownedSquares += 1;
        }

        if (cell.owner.name === 'cpu') {
          freeSquares += 1;
        }

        if (teams[cell.owner.name]) {
          teams[cell.owner.name].score += (1 * cell.bonus);
        }
      });
    });
  };

  var drawGrid = function($grid, state) {
    state.forEach(function(row, y) {
      var $row = createElement('div', 'row');

      row.forEach(function(cell, x) {
        var cellData = {
          coords: x + ',' + y,
          owner: {
            name: cell.owner.name,
            colour: cell.owner.colour
          }
        };

        var $cell = createElement('div', 'cell');

        $cell.setAttribute('cell-data', JSON.stringify(cellData));

        if (cell.owner.name !== 'cpu') {
          var $dot = createElement('div', 'dot');
          $dot.style.background = cell.owner.colour;
          $cell.appendChild($dot);
        }

        $row.appendChild($cell);
      });

      var $rowContainer = createElement('div', 'row-container');
      $rowContainer.appendChild($row);
      $grid.appendChild($rowContainer);
    });
  };

  var drawPlayers = function() {
    var allTeams = [];

    Object.keys(teams).forEach(function(teamName) {
      allTeams.push(teams[teamName]);
    });

    allTeams.sort(function(left, right) {
      return right.score - left.score;
    });

    allTeams.forEach(function(player) {
      var $player = createElement('div', 'player');

      var $avatar = createElement('img');
      $avatar.src = player.gravatar;

      var $score = createElement('div', 'score');
      $score.innerText = player.score;

      $player.appendChild($avatar);
      $player.appendChild($score);

      $playerList.appendChild($player);
    });
  };

  var initialiseGridClickHandler = function($grid) {
    var showCellInfo = function($cell) {
      if ($selectedCell) {
        $selectedCell.className = 'cell';
      }

      $selectedCell = $cell;
      $selectedCell.className = 'cell selected';

      var cellData = JSON.parse($selectedCell.getAttribute('cell-data'));

      var $cellInfo = document.getElementById('cell-info');
      var $cellCoords = document.getElementById('cell-coords');
      var $cellOwner = document.getElementById('cell-owner');
      var $cellOwnerDot = document.getElementById('cell-owner-dot');

      $cellCoords.innerText = cellData.coords;
      $cellOwner.innerText = cellData.owner.name;
      $cellOwnerDot.style.background = (cellData.owner.name === 'cpu') ? '#f9eed1' : cellData.owner.colour;

      $cellInfo.style.display = 'block';
      $cellInfo.style.width = $cell.parentNode.clientWidth + 'px';
    };

    $grid.addEventListener('click', function(event) {
      if (event.srcElement.className === 'cell') {
        return showCellInfo(event.srcElement);
      }

      if (event.srcElement.className === 'dot') {
        return showCellInfo(event.srcElement.parentNode);
      }
    });
  };

  init();
})();