import * as THREE from "three";
import { WorldChunk } from "./worldChunk";

export class World extends THREE.Group {
  chunkSize = { width: 32, height: 20 };

  asyncLoading = true;
  drawDistance = 2;

  params = {
    seed: 0,
    terrain: {
      scale: 40,
      magnitude: 0.40,
      offset: 0.2,
    },
  };

  constructor(seed = 0) {
    super();
    this.seed = seed;
  }

  generate() {
    this.disposeChunk();
    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
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
   * @param {Player} player
   */
  update(player) {
    const visibleChunks = this.getVisibleChunks(player);
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    this.removeUnusedChunks(visibleChunks);

    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  /**
   * @param {Player} player
   * @returns {{x : number , z: number}[]}
   */
  getVisibleChunks(player) {
    const visibleChunks = [];

    const choords = this.worldToChunkCoords(
      player.position.x,
      player.position.y,
      player.position.z
    );

    const chunkX = choords.chunk.x;
    const chunkZ = choords.chunk.z;

    for (
      let x = chunkX - this.drawDistance;
      x <= chunkX + this.drawDistance;
      x++
    ) {
      for (
        let z = chunkZ - this.drawDistance;
        z <= chunkZ + this.drawDistance;
        z++
      ) {
        visibleChunks.push({ x, z });
      }
    }

    return visibleChunks;
  }

  /**
   * Returns an array containing the coordinates of the chunks that
   * are not yet loaded and need to be added to the scene
   * @param {{ x: number, z: number}[]} visibleChunks
   * @returns {{ x: number, z: number}[]}
   */
  getChunksToAdd(visibleChunks) {
    // Filter down the visible chunks to those not already in the world
    return visibleChunks.filter((chunk) => {
      const chunkExists = this.children
        .map((obj) => obj.userData)
        .find(({ x, z }) => chunk.x === x && chunk.z === z);

      return !chunkExists;
    });
  }

  /**
   * Removes current loaded chunks that are no longer visible to the player
   * @param {{ x: number, z: number}[]} visibleChunks
   */
  removeUnusedChunks(visibleChunks) {
    // Filter down the visible chunks to those not already in the world
    const chunkToRemove = this.children.filter((chunk) => {
      const { x, z } = chunk.userData;
      const chunkExists = visibleChunks.find(
        (visibleChunk) => visibleChunk.x === x && visibleChunk.z === z
      );

      return !chunkExists;
    });

    for (const chunk of chunkToRemove) {
      chunk.disposeInstances();
      this.remove(chunk);
      console.log(
        `Removing chunk x ${chunk.userData.x} , z ${chunk.userData.z}`
      );
    }
  }

  /**
   * Generates the chunk at the (x, z) coordinates
   * @param {number} x
   * @param {number} z
   */
  generateChunk(x, z) {
    const chunk = new WorldChunk(this.chunkSize, this.params);
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
    chunk.userData = { x, z };
    if (this.asyncLoading) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }
    this.add(chunk);
    console.log(`Adding chunk at X: ${x} Z: ${z}`);
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
    if (chunk && chunk.laod) {
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
