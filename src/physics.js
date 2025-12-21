import * as THREE from "three";
import { Player } from "./player";
import { World } from "./world";
import { blocks } from "./blocks";

const collisionMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.2,
});

const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001);

export class Physics {
  constructor(scene) {
    this.helpers = new THREE.Group();
    scene.add(this.helpers);
  }

  /**
   * @param {number} dt
   * @param {Player} player
   * @param {World} world
   */
  update(dt, player, world) {
    this.helpers.clear(); 
    this.detectCollisions(player, world);
  }

  /**
   * @param {Player} player
   * @param {World} world
   */
  detectCollisions(player, world) {
    const candidate = this.broadPhase(player, world);
    const collisions = this.narrowPhase(candidate, player);

    if (collisions.length > 0) {
      this.resolveCollision(collisions);
    }
  }

 broadPhase(player, world) {
  const candidate = [];

  const extents = {
    x: {
      min: Math.floor(player.position.x - player.radius),
      max: Math.ceil(player.position.x + player.radius),
    },
    y: {
      min: Math.floor(player.position.y - player.height),
      max: Math.ceil(player.position.y),
    },
    z: {
      min: Math.floor(player.position.z - player.radius),
      max: Math.ceil(player.position.z + player.radius),
    },
  };

  for (let x = extents.x.min; x <= extents.x.max; x++) {
    for (let y = extents.y.min; y <= extents.y.max; y++) {
      for (let z = extents.z.min; z <= extents.z.max; z++) {

        const block = world.getBlock(x, y, z);
        
        if (block && block.id !== blocks.empty.id) {
            const worldPos = {x,y,z};
          candidate.push({ x, y, z, block });
          this.addCollisionHelper(worldPos);
        }
      }
    }
  }

  return candidate;
}


  narrowPhase(candidate, player) {
    return candidate;
  }

  resolveCollision(collisions) {}

  /**
   * Visualizes the block the player is colliding with
   * @param {THREE.Object3D} block
   */
  addCollisionHelper(block) {
    const blockMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    blockMesh.position.copy(block);
    this.helpers.add(blockMesh);
  }
}
