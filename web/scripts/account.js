(function() {
  var $selectedCell;
  var $grid;

  var init = function() {
    $grid = document.getElementById('user-grid');
    initialiseGridClickHandler($grid);
    setTimeout(fetchAccountData, 1000);
  };

  var fetchAccountData = function() {
    http.get('/api/account-data?key=' + window.userKey, function(err, accountData) {
      if (err) {
        return;
      }

      drawGrid($grid, accountData.grid);
    });
  };

  var createElement = function(tag, className) {
    var $element = document.createElement(tag);
    $element.className = className;
    return $element;
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