import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { World } from "./world";
import { lilGUI } from "./ui";
import { Player } from "./player";

const stats = new Stats();
document.body.appendChild(stats.dom);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(-32, 16, -32);

function lights() {
  const sun = new THREE.DirectionalLight();
  sun.position.set(50, 50, 50);

  // * This means castShadow = true This light should create a shadow map.
  sun.castShadow = true;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 100;
  sun.shadow.bias = 0.0005;
  sun.shadow.mapSize = new THREE.Vector2(512, 512);
  scene.add(sun);

  const shadowHlper = new THREE.CameraHelper(sun.shadow.camera);
  // scene.add(shadowHlper);

  const ambientLight = new THREE.AmbientLight();
  ambientLight.intensity = 0.1;
  scene.add(ambientLight);
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor("skyblue");

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
const controls = new OrbitControls(camera, renderer.domElement);

const world = new World();
world.generate();
scene.add(world);

const player = new Player(scene);

world.position.set(-10, -10, -10);

let previousTime = performance.now();
function animate() {
  let currentTime = performance.now();
  let dt = (currentTime - previousTime) / 1000;

  requestAnimationFrame(animate);
  player.applyInput(dt)
  controls.update();
  renderer.render(scene, player.camera);
  stats.update();

  previousTime = currentTime;
}

lights();
lilGUI(world , player);
animate();

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Update camera
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
