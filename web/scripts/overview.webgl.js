var ATTACK_DISPLAY_TIMEOUT = 20000;

var colours = [
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
  '#CC9DC9'
];

var width = window.innerWidth;
var height = window.innerHeight;

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
scene.add(camera);

var light = new THREE.PointLight(0xffffff, 1.5);
light.position.set(1, 1, -1).normalize();
scene.add(light);

var ambLight = new THREE.AmbientLight(0x777777);
scene.add(ambLight);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
document.querySelector('.overview-container').appendChild(renderer.domElement);

var size = 3;
var gap = 2;
var spacing = size + gap;

var xLength = 10;
var zLength = 10;

var baseMaterial = new THREE.MeshLambertMaterial({
  color: 0x333333
});

var coloursMaterials = colours.map(function(colour) {
  return new THREE.MeshLambertMaterial({
    color: parseInt(colour.substring(1), 16)
  });
});

var materials = [];

for (var i = 0; i < 6; i++) {
  materials.push(baseMaterial);
}

coloursMaterials.forEach(function(coloursMaterial) {
  for (var i = 0; i < 6; i++) {
    materials.push(coloursMaterial);
  }
});

var colourMatOffset = 1;

var multiMaterial = new THREE.MeshFaceMaterial(materials);

var mesh = null;

var getHeight = function(bonus) {
  var heights = [1, 5, 10];

  return heights[bonus - 1];
};

var attacks = [];

var newAttack = function(x, z, cell) {
  // this was +1 before, check with CD
  var attackColourIndex = colours.indexOf(cell.lastAttack.team.colour);
  var attackMaterial = coloursMaterials[attackColourIndex];

  var attackSphere = new THREE.SphereGeometry(size * 0.4, 16, 16);
  var attackMesh = new THREE.Mesh(attackSphere, attackMaterial);

  scene.add(attackMesh);

  var plane = new THREE.CircleGeometry(1.2, 32);

  var height = getHeight(cell.bonus);

  var colourIndex = colours.indexOf(cell.owner.colour);
  var planeMaterial = coloursMaterials[colourIndex];

  var planeMesh = new THREE.Mesh(plane, planeMaterial);
  planeMesh.position.set(x * spacing, height + 0.1, z * spacing);
  planeMesh.rotation.x = Math.PI / -2;
  scene.add(planeMesh);

  return {
    remove: function() {
      scene.remove(attackMesh);
      scene.remove(planeMesh);
      attackMesh = null;
      planeMesh = null;
    },
    animate: function() {
      var scale = Math.sin(getTime() * 0.01);

      attackMesh.position.set(x * spacing, scale * 2.0 + height + 4.0, z * spacing);
      planeMesh.scale.set(scale, scale, scale);
    }
  };
};

var clearAttacks = function() {
  attacks.forEach(function(attack) {
    attack.remove();
  });

  attacks = [];
};

var buildGrid = window.buildGrid = function(grid) {
  // console.time('buildGrid');

  xLength = grid.length;
  zLength = grid[0].length;

  clearAttacks();

  var generateBar = function(x, z, cell) {
    var height = getHeight(cell.bonus);

    var box = new THREE.BoxGeometry(size, height, size);

    var mat = new THREE.Matrix4();
    mat.makeTranslation(x * spacing, height * 0.5, z * spacing);

    var colourIndex = 0;

    if (cell.owner) {
      colourIndex = colours.indexOf(cell.owner.colour) + 1;
    }

    matIndexOffset = colourIndex * 6;

    geom.merge(box, mat, matIndexOffset);

    // console.log('generateBar', x, z, cell);
  };

  var geom = new THREE.Geometry();

  for (var x = 0; x < xLength; x++) {
    for (var z = 0; z < zLength; z++) {
      var cell = grid[z][x];

      generateBar(x, z, cell);

      if (
        cell.owner &&
        cell.lastAttack &&
        cell.owner.name !== 'cpu' &&
        (new Date().getTime() - cell.lastAttack.time < ATTACK_DISPLAY_TIMEOUT)
      ) {
        var attack = newAttack(x, z, cell);
        attacks.push(attack);
      }
    }
  }

  if (mesh) scene.remove(mesh);

  mesh = new THREE.Mesh(geom, multiMaterial);
  scene.add(mesh);

  // console.timeEnd('buildGrid');
};

var theta = 0;
var startTime = new Date().getTime();

var getTime = function() {
  return new Date().getTime() - startTime;
};

var render = function() {
  renderer.render(scene, camera);

  attacks.forEach(function(attack) {
    attack.animate();
  });

  if (light) {
    light.position.x = 50 * Math.sin(-theta * 2 * Math.PI / 360);
    light.position.y = 50;
    light.position.z = 50 * Math.cos(-theta * 2 * Math.PI / 360);
  }

  camera.position.y = 50;

  var xHalf = (xLength * spacing - gap) * 0.5;
  var zHalf = (zLength * spacing - gap) * 0.5;

  // console.log(xLength * spacing, xHalf, zHalf);

  camera.position.x = xHalf + xHalf * Math.sin(theta * Math.PI / 360) * 2;
  camera.position.z = zHalf + zHalf * Math.cos(theta * Math.PI / 360) * 2;

  camera.lookAt(new THREE.Vector3(xHalf, 0, zHalf));

  theta++;
  requestAnimationFrame(render);
};

setTimeout(render, 1000);
