import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { RNG } from "./rng";
import { blocks, resources } from "./blocks";

const geometry = new THREE.BoxGeometry(1, 1, 1);

export class World extends THREE.Group {
  /*
   *  ✅ Correct mental model:
   *
   *  Group is an invisible container (folder), not geometry
   *  No size
   *  No shape
   *  No faces
   *  No rendering
   *  Just a transform parent.
   *
   * Moving folder moves all files
   */

  /**
   * @type {{
   *   id: number,
   *   instanceId: number
   * }[]}
   */
  data = [];
  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 1,
      offset: 0.2,
    },
  };

  constructor(size = { width: 64, height: 20 }) {
    super();
    this.size = size;
  }

  generate() {
    const rng = new RNG(this.params.seed);
    this.InitializeTerrain();
    this.generateRecourses(rng);
    this.generateTerrain(rng);
    this.generateMeshes();
  }
 
  // * here we are creating the whole boxes ids with there postions x,y,z so that we can target them with there positions thats why we have created a 3d-Array
  InitializeTerrain() {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
      const slice = [];
      for (let y = 0; y < this.size.height; y++) {
        const row = [];
        for (let z = 0; z < this.size.width; z++) {
          row.push({
            id: blocks.empty.id,
            instanceId: null,
          });
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  generateRecourses(rng) {
    const simplex = new SimplexNoise(rng);
    /*
     *Dividing x, y, and z by a scale value controls how fast the noise
     *values change between neighboring blocks. With a larger scale, nearby
     *blocks sample very close positions in noise space, so the noise values
     *change smoothly as decimal values between -1 and +1, creating continuous
     *and natural-looking structures. Without scaling (or with a very small
     *scale), neighboring blocks sample far-apart noise positions, causing
     *rapid positive and negative changes in noise values, which results in
     *messy, fragmented, and noisy shapes. Scale controls the smoothness and
     *size of noise features, not randomness.
     */

    resources.forEach((res) => {
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            let value = simplex.noise3d(
              x / res.scale.x,
              y / res.scale.y,
              z / res.scale.z
            );
            if (value > res.scarcity) {
              this.setBlockId(x, y, z, res.id);
            }
          }
        }
      }
    });
  }

  generateTerrain(rng) {
    /*
     *Simplex Noise is a deterministic, position-based function.
     *noise2D(x, z) is used for terrain surfaces: it tells how high the ground
     *should be at a given (x, z) position. Nearby positions return similar
     *values, which creates smooth valleys and mountains.
     *
     *noise3D(x, y, z) is used for volumetric features like caves. It returns
     *a density value at a point in 3D space. By applying a threshold to this
     *value, we decide whether a block exists or the space is empty.
     *
     *Noise itself does not create terrain or caves — it only maps position
     *to a smooth value. The terrain logic is built on top of these values.
     */
    const simplex = new SimplexNoise(rng);

    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        // Compute the noise value at this x-z location
        const value = simplex.noise(
          x / this.params.terrain.scale,
          z / this.params.terrain.scale
        );

        // Scale the noise based on the magnitude/offset
        const scaledNoise =
          this.params.terrain.offset + this.params.terrain.magnitude * value;
        // Computing the height of the terrain at this x-z location
        let height = Math.floor(this.size.height * scaledNoise);
        // Clamping height between 0 and max height
        height = Math.max(0, Math.min(height, this.size.height - 1));

        // How many blocks go upwards at the position of x and z
        for (let y = 0; y < this.size.height; y++) {
          if (y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
            this.setBlockId(x, y, z, blocks.dirt.id);
          } else if (y === height) {
            this.setBlockId(x, y, z, blocks.grass.id);
          } else if (y > height) {
            this.setBlockId(x, y, z, blocks.empty.id);
          }
        }
      }
    }
  }

  generateMeshes() {
    this.clear();

    const maxNumberOfBlocks =
      this.size.width * this.size.width * this.size.height;

    /*
     * Now if we create every time a single box like in loop we create a box set it position and then GPU draw it
     * it will we the communication between CPU and GPU over  this.size.width * this.size.width * this.size.height; this times
     * which gives very bad FPS as there is many drawings
     * now using InstanceMesh it create same geomerty and material of boxes in a one go only the positions , scale and rotations are different
     * and as GPU can't understand the raw positions , scale and rotations we have to pass it in a matrix form.
     * instance is a Array and one by one at index we add matrix in the instance
     */

    const meshes = {};

    // Exclude the empty block by its `id` property (previous code compared the
    // whole object to a number which unintentionally included the empty block)
    Object.values(blocks)
      .filter((blockType) => blockType.id !== blocks.empty.id)
      .forEach((blockType) => {
        const mesh = new THREE.InstancedMesh(
          geometry,
          blockType.material,
          maxNumberOfBlocks
        );
        mesh.name = blockType.name;
        mesh.count = 0;
        // * This object will block light and cast shadows onto other objects.
        mesh.castShadow = true;
        // * This object can receive shadows from other objects
        mesh.receiveShadow = true;
        meshes[blockType.id] = mesh;
      });

    const matrix = new THREE.Matrix4();

    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockID = this.getBlock(x, y, z).id;

          if (blockID === blocks.empty.id) continue;

          const mesh = meshes[blockID];
          const instanceID = mesh.count;

          if (!this.isBlockObscured(x, y, z)) {
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceID, matrix);
            this.setBlockInstanceId(x, y, z, instanceID);
            mesh.count++;
          }
        }
      }
    }
    this.add(...Object.values(meshes));
  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instanceID: number}}
   */
  getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  /**
   * Sets the block id for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} id
   */
  setBlockId(x, y, z, id) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].id = id;
    }
  }

  /**
   * Sets the block instance id for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} instanceId
   */
  setBlockInstanceId(x, y, z, instanceId) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].instanceId = instanceId;
    }
  }

  /**
   * Checks if the (x, y, z) coordinates are within bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  inBounds(x, y, z) {
    if (
      x >= 0 &&
      x < this.size.width &&
      y >= 0 &&
      y < this.size.height &&
      z >= 0 &&
      z < this.size.width
    ) {
      return true;
    } else {
      return false;
    }
  }

  isBlockObscured(x, y, z) {
    const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
    const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
    const left = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
    const right = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
    const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
    const backward = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;
    if (
      up == blocks.empty.id ||
      down == blocks.empty.id ||
      left == blocks.empty.id ||
      right == blocks.empty.id ||
      forward == blocks.empty.id ||
      backward == blocks.empty.id
    ) {
      //This box is visible
      return false;
    } else {
      //This box is visible
      return true;
    }
  }
}
