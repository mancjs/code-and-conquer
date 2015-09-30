(function() {
  var $selectedCell;

  var init = function() {
    var state = [
      [0,0,0,0,0,1,0,0,1,0,1,1],
      [0,1,0,1,0,0,1,0,0,0,1,1],
      [0,1,0,1,1,1,1,0,0,1,1,1],
      [0,0,0,0,0,0,0,0,0,1,1,1],
      [0,0,0,0,1,1,1,1,0,0,1,1],
      [0,0,0,0,1,0,0,0,1,0,1,1],
      [0,0,0,0,1,1,1,0,0,0,1,1],
      [0,0,0,0,1,0,0,1,1,0,1,1],
      [0,0,0,0,1,0,0,0,0,0,1,1],
      [0,0,0,0,1,1,1,1,1,0,1,1],
      [0,0,0,0,1,0,0,1,0,0,0,0],
      [0,0,0,0,1,0,0,1,0,0,0,0]
    ];

    var $grid = document.getElementById('user-grid');

    drawGrid($grid, state);
    initialiseGridClickHandler($grid);
  };

  var createElement = function(tag, className) {
    var $element = document.createElement(tag);
    $element.className = className;
    return $element;
  };

  var drawGrid = function($grid, state) {
    state.forEach(function(row) {
      var $row = createElement('div', 'row');

      row.forEach(function(isOwned) {
        var $cell = createElement('div', 'cell');

        $cell.setAttribute('cell-data', 'abcd');

        if (isOwned) {
          var $dot = createElement('div', 'dot');
          $dot.style.background = document.getElementById('team-colour').style.background;
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
      console.log($selectedCell.getAttribute('cell-data'));

      var $cellInfo = document.getElementById('cell-info');
      $cellInfo.style.display = 'block';

      window.requestAnimationFrame(function() {
        $cellInfo.style.height = '100px';
      });
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