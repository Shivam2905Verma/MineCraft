import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export class Player {
  maxSpeed = 10;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  /**
   * @param {THREE.Scene} scene
   */
  controls = new PointerLockControls(this.camera, document.body);
  constructor(scene) {
    this.position.set(25, 6, 40);
    scene.add(this.camera);

    // * Because the browser calls it like: document.onkeydown(event); So the caller is document, not your class so the this becomes document not my class due to which when ever i call "this" in the on keydown function then == document but this.control is in Game class not in document
    document.addEventListener("keydown", this.onKeydown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));
  }

  // * this function is called for every frame initially the input vector is 0,0,0 i press the w button the value of vocity get changes our player get moved it is neccessory to call this function in the animate() function which is called for every frame
  applyInput(dt) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      /*
       *dt is the time gap between two frames.
       *When one frame is drawn and the next frame is drawn, the time passed between them is dt.
       *At 75 FPS, dt ≈ 1 / 75 ≈ 0.013 seconds.
       *We multiply velocity by dt so that movement speed stays the same regardless of FPS.
       */
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);

      document.getElementById("player-position").innerHTML = this.toString();
    }
  }

  /**
   * @param {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }

  onKeydown(event) {
    if (!this.controls.lock()) {
      this.controls.lock();
    }

    switch (event.code) {
      case "KeyW":
        this.input.z = this.maxSpeed;
        break;
      case "KeyA":
        this.input.x = -this.maxSpeed;
        break;
      case "KeyS":
        this.input.z = -this.maxSpeed;
        break;
      case "KeyD":
        this.input.x = this.maxSpeed;
        break;
      case "KeyR":
        this.position.set(25, 6, 40);
        this.velocity.set(0, 0, 0);
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case "KeyW":
        this.input.z = 0;
        break;
      case "KeyA":
        this.input.x = 0;
        break;
      case "KeyS":
        this.input.z = 0;
        break;
      case "KeyD":
        this.input.x = 0;
        break;
    }
  }

  toString() {
    let str = "";
    str += `X: ${this.position.x.toFixed(3)}`;
    str += `Y: ${this.position.y.toFixed(3)}`;
    str += `Z: ${this.position.z.toFixed(3)}`;

    return str;
  }
}
