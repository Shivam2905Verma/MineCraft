import * as THREE from "three";
import { WorldChunk } from "./worldChunk";

export class World extends THREE.Group {
  chunkSize = { width: 64, height: 20 };

  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 1,
      offset: 0.2,
    },
  };

  constructor(seed = 0) {
    super();
    this.seed = seed;
  }

  generate() {
    this.disposeChunk();
    // this.clear();
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const chunk = new WorldChunk(this.chunkSize, this.params);
        chunk.position.set(
          x * this.chunkSize.width,
          0,
          z * this.chunkSize.width
        );
        chunk.userData = { x, z };
        chunk.generate();
        this.add(chunk);
      }
    }
  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instanceID: number} | null}
   */
  getBlock(x, y, z) {
    //* in this we find the chunk (world at -1 , 0 or 1) and the the block coordinates will be given of that particular world and will will return that particular block
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    if (chunk) {
      return chunk.getBlock(coords.block.x, coords.block.y, coords.block.z);
    } else {
      return null;
    }
  }

  /**
   * Returns the coordinates of the block at (x,y,z)
   * - `chunk` is the coordinates of the chunk containing the block
   * - `block` is the coordinates of the block relative to the chunk
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{
   * chunk: { x: number, z: number },
   * block: { x: number, y: number, z: number }
   * }}
   */
  worldToChunkCoords(x, y, z) {
    // * Which chunk does this world position belong to?
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width),
    };

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z,
    };

    return {
      chunk: chunkCoords,
      block: blockCoords,
    };
  }

  /**
   * Returns the WorldChunk object at the specified coordinates
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk | null}
   */
  getChunk(chunkX, chunkZ) {
    return this.children.find((chunk) => {
      return chunk.userData.x === chunkX && chunk.userData.z === chunkZ;
    });
  }

  disposeChunk() {
    this.traverse((chunk) => {
      if (chunk.disposeInstances) {
        chunk.disposeInstances();
      }
    });
    this.clear();
  }
}
