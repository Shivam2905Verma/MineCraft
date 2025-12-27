import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export class Player {
  radius = 0.5;
  height = 1.75;
  jumpSpeed = 10;
  onGround = false;

  maxSpeed = 10;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  cameraHelper = new THREE.CameraHelper(this.camera);

  /**
   * @param {THREE.Scene} scene
   */
  controls = new PointerLockControls(this.camera, document.body);
  constructor(scene) {
    this.position.set(26, 30, 25);
    scene.add(this.camera);
    // scene.add(this.cameraHelper);

    // * Because the browser calls it like: document.onkeydown(event); So the caller is document, not your class so the this becomes document not my class due to which when ever i call "this" in the on keydown function then == document but this.control is in Game class not in document
    document.addEventListener("keydown", this.onKeydown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));

    this.boundHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );

    scene.add(this.boundHelper);
  }

  /**
   * Returns the velocity of the player in world coordinates
   * @returns {THREE.Vector3}
   */
  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(
      new THREE.Euler(0, this.camera.rotation.y, 0)
    );
    return this.#worldVelocity;
  }

  /**
   * Applies a change in velocity 'dv' that is specified in the world frame
   * @param {THREE.Vector3} dv
   */
  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  // * this function is called for every frame initially the input vector is 0,0,0 i press the w button the value of vocity get changes our player get moved it is neccessory to call this function in the animate() function which is called for every frame
  applyInput(dt) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      /*
       * dt is the time gap between two frames.
       * When one frame is drawn and the next frame is drawn, the time passed between them is dt.
       * At 75 FPS, dt ≈ 1 / 75 ≈ 0.013 seconds.
       * We multiply velocity by dt so that movement speed stays the same regardless of FPS.
       */
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt;

      document.getElementById("player-position").innerHTML = this.toString();
    }
  }

  updateBoundHelper() {
    this.boundHelper.position.copy(this.position);
    this.boundHelper.position.y -= this.height / 2;
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
      case "Space":
        if(this.onGround){
          this.velocity.y += this.jumpSpeed
        }
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
