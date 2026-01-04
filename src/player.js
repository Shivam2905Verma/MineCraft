import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { blocks } from "./blocks";

const CENTER_SCREEN = new THREE.Vector2();
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
  controls = new PointerLockControls(this.camera, document.body);
  cameraHelper = new THREE.CameraHelper(this.camera);
  raycaster = new THREE.Raycaster(undefined, undefined, 0, 4);
  selectedCoords = null;
  activeBlockId = blocks.grass.id;

  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.position.set(32, 32, 32);
    this.camera.layers.enable(1)
    scene.add(this.camera);
    // scene.add(this.cameraHelper);

    // * Because the browser calls it like: document.onkeydown(event); So the caller is document, not your class so the this becomes document not my class due to which when ever i call "this" in the on keydown function then == document but this.control is in Game class not in document
    document.addEventListener("keydown", this.onKeydown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));

    this.boundHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );

    // scene.add(this.boundHelper);

    const selectionMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0xffffaa,
    });

    const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);
    this.raycaster.layers.set(0);
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
   * @param {World} world
   */
  update(world) {
    this.updateRaycaster(world);
  }

  /*
   * Now insecection.object is the instanceMesh and its position is 0,0,0 in every chunk for every resouces so we
   * used the parent which is the chunk and chunk positon + .getMatrixAt(intersection.instanceId, blockMatrix) (this is the local position of box) addiotion of both give the position of the box in the world
   */
  // *it is a invisible ray which object we will see it will give the info about that object
  /**
   * @param {World} world
   */
  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
    const intersections = this.raycaster.intersectObject(world, true);

    if (intersections.length > 0) {
      const intersection = intersections[0];

      // Get the chunk associated with the selected block
      const chunk = intersection.object.parent;

      // Get the transformation matrix for the selected block
      const blockMatrix = new THREE.Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);

      //* Set the selected coordinates to the origin of the chunk,
      //* then apply the transformation matrix of the block to get
      //* the block coordinates
      this.selectedCoords = chunk.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);

      //* This will select the box where the first ray get hit if on top then make a new selection of block top + 1 if side = side + 1 this .normal() give where the ray get hit if on side (1,0,0) if on top (0,1,0)
      if (this.activeBlockId !== blocks.empty.id) {
        this.selectedCoords.add(intersection.normal);
      }

      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }
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
      case "Digit0":
      case "Digit1":
      case "Digit2":
      case "Digit3":
      case "Digit4":
      case "Digit5":
        this.activeBlockId = Number(event.key);
        console.log("Acivekey = ", event.key);
        break;

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
        if (this.onGround) {
          this.velocity.y += this.jumpSpeed;
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
