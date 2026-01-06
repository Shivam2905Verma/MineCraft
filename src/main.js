import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { World } from "./world";
import { lilGUI } from "./ui";
import { Player } from "./player";
import { Physics } from "./physics";
import { blocks } from "./blocks";
import { ModelLoader } from "./modelLoader";

const stats = new Stats();
document.body.appendChild(stats.dom);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x80a0e0, 50, 100);
const OrbitCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

OrbitCamera.position.set(-20, 20, -20);
OrbitCamera.layers.enable(1);
const sun = new THREE.DirectionalLight();

function lights() {
  sun.position.set(50, 50, 50);

  // * This means castShadow = true This light should create a shadow map.
  sun.castShadow = true;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.bottom = -100;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 200;
  sun.shadow.bias = 0.00001;
  sun.shadow.mapSize = new THREE.Vector2(2048, 2048);
  scene.add(sun);
  scene.add(sun.target);

  const shadowHlper = new THREE.CameraHelper(sun.shadow.camera);
  // scene.add(shadowHlper);

  const ambientLight = new THREE.AmbientLight();
  ambientLight.intensity = 0.1;
  scene.add(ambientLight);
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);

/*
 * Shadow map = records first object from light; any object behind it is in shadow.

 * First, we enable shadow mapping in the renderer.
 * Then the light creates an invisible camera from its own point of view, and we define that camera’s left, right, top, bottom, near, and far values.
 * The light renders an invisible depth image of the scene (no colors or textures, only depth information).
 * During the final render, every pixel is compared with this depth image.
 * If a point is farther than what the light “saw” first, it is in shadow; otherwise, it is lit.
 */
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(OrbitCamera, renderer.domElement);
controls.target.set(16, 16, 16);

const world = new World();
world.generate();
scene.add(world);

const modelLoader = new ModelLoader();
modelLoader.loadModels((models) => {
  player.tool.setMesh(models.pickaxe);
});

const player = new Player(scene);
const physics = new Physics(scene);

function onMouseDown(event) {
  if (player.controls.isLocked && player.selectedCoords) {
    if (player.activeBlockId === blocks.empty.id) {
      world.removeBlock(
        player.selectedCoords.x,
        player.selectedCoords.y,
        player.selectedCoords.z
      );
      player.tool.startAnimation();
    } else {
      world.addBlock(
        player.selectedCoords.x,
        player.selectedCoords.y,
        player.selectedCoords.z,
        player.activeBlockId
      );
    }
  }
}

document.addEventListener("mousedown", onMouseDown);

let previousTime = performance.now();
function animate() {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000;

  requestAnimationFrame(animate);

  if (player.controls.isLocked) {
    player.update(world);
    physics.update(dt, player, world);
    world.update(player);
    sun.position.copy(player.position);
    sun.position.sub(new THREE.Vector3(-50, -50, -50));
    sun.target.position.copy(player.position);
  }

  renderer.render(
    scene,
    player.controls.isLocked ? player.camera : OrbitCamera
  );
  controls.update();
  stats.update();

  previousTime = currentTime;
}

lights();
lilGUI(scene, world, player);
animate();

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Update Orbitcamera
  OrbitCamera.aspect = width / height;
  OrbitCamera.updateProjectionMatrix();
  // Update Orbitcamera
  player.camera.aspect = width / height;
  player.camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
