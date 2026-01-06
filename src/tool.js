import * as THREE from "three";

export class Tool extends THREE.Group {
  animate = false;
  animationAmplitutde = 0.5;
  animationDuration = 400;
  animationStart = 0;
  animationSpeed = 0.025;

  animation = undefined;
  toolMesh = undefined;

  get animationTime() {
    return performance.now() - this.animationStart;
  }

  startAnimation() {
    if (this.animate) return;

    this.animate = true;
    this.animationStart = performance.now();

    clearTimeout(this.animation);

    this.animation = setTimeout(() => {
      this.animate = false;
      this.toolMesh.rotation.z = 0;
    }, this.animationDuration);
  }

  update() {
    if (this.animate && this.toolMesh) {
      this.toolMesh.rotation.z =
        this.animationAmplitutde *
        Math.sin(this.animationTime * this.animationSpeed);

      // Math.sin(time) oscillates smoothly between -1 and +1 over time,
      // multiplying it gives a natural back-and-forth (swinging) motion
      // instead of continuous rotation.
    }
  }

  /**
   * @param {THREE.Mesh} mesh
   */
  setMesh(mesh) {
    this.clear();

    this.toolMesh = mesh;
    this.add(this.toolMesh);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    this.position.set(0.2, -0.2, -0.18);
    this.scale.set(0.01, 0.01, 0.01);
    this.rotation.z = Math.PI / 2;
    this.rotation.y = Math.PI + 1.4;
  }
}
