import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { RNG } from "./rng";
import { blocks, resources } from "./blocks";

const geometry = new THREE.BoxGeometry(1, 1, 1);

export class WorldChunk extends THREE.Group {
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

  constructor(size, params, dataStore) {
    super();
    this.laod = false;
    this.size = size;
    this.params = params;
    this.dataStore = dataStore;
  }

  generate() {
    const rng = new RNG(this.params.seed);
    this.InitializeTerrain();
    this.generateRecourses(rng);
    this.generateTerrain(rng);
    this.generateTrees(rng);
    this.generateClouds(rng);
    this.laodPlayerChanges();
    this.generateMeshes();

    this.laod = true;
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
              (this.position.x + x) / res.scale.x,
              (this.position.y + y) / res.scale.y,
              (this.position.z + z) / res.scale.z
            );
            if (value > res.scarcity) {
              this.setBlockId(x, y, z, res.id);
            }
          }
        }
      }
    });
  }

  /**
   * @param {RNG} rng
   */
  generateTrees(rng) {
    const generateTreeTrunk = (x, z, rng) => {
      const minHeight = this.params.trees.trunk.minHeight;
      const maxHeight = this.params.trees.trunk.maxHeight;

      const height = Math.round(
        minHeight + (maxHeight - minHeight) * rng.random()
      );

      for (let y = 0; y < this.size.height; y++) {
        const block = this.getBlock(x, y, z);
        if (block && block.id == blocks.grass.id) {
          for (let treeY = y + 1; treeY <= y + height; treeY++) {
            this.setBlockId(x, treeY, z, blocks.tree.id);
          }
          generateTreeCanapy(x, y + height, z, rng);
          break;
        }
      }
    };
    const generateTreeCanapy = (centerx, centery, centerz, rng) => {
      const minR = this.params.trees.canopy.minRadius;
      const maxR = this.params.trees.canopy.maxRadius;
      const r = Math.round(minR + (maxR - minR) * rng.random());

      for (let x = -r; x <= r; x++) {
        for (let y = -r; y <= r; y++) {
          for (let z = -r; z <= r; z++) {
            const n = rng.random();
            if (x * x + y * y + z * z > r * r) continue;
            const block = this.getBlock(centerx + x, centery + y, centerz + z);
            if (block && block.id !== blocks.empty.id) continue;
            if (n < this.params.trees.canopy.density) {
              this.setBlockId(
                centerx + x,
                centery + y,
                centerz + z,
                blocks.leaves.id
              );
            }
          }
        }
      }
    };

    let offset = this.params.trees.canopy.maxRadius;
    for (let x = offset; x < this.size.width - offset; x++) {
      for (let z = offset; z < this.size.width - offset; z++) {
        if (rng.random() < this.params.trees.frequency) {
          generateTreeTrunk(x, z, rng);
        }
      }
    }
  }
  /**
   * @param {RNG} rng
   */
  generateClouds(rng) {
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        const value =
          (simplex.noise(
            (this.position.x + x) / this.params.clouds.scale,
            (this.position.z + z) / this.params.clouds.scale
          ) +
            1) *
          0.5;

        if (value < this.params.clouds.density) {
          this.setBlockId(x, this.size.height - 1, z, blocks.cloud.id);
        }
      }
    }
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
          (this.position.x + x) / this.params.terrain.scale,
          (this.position.z + z) / this.params.terrain.scale
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
          if (y <= this.params.terrain.waterOffset && y <= height) {
            this.setBlockId(x, y, z, blocks.sand.id);
          }else if (y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
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

  laodPlayerChanges() {
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          if (
            this.dataStore.contains(this.position.x, this.position.z, x, y, z)
          ) {
            const blockId = this.dataStore.get(
              this.position.x,
              this.position.z,
              x,
              y,
              z
            );
            this.setBlockId(x, y, z, blockId);
          }
        }
      }
    }
  }

  generateWater() {
    const material = new THREE.MeshLambertMaterial({
      color: 0x9090e0,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(), material);
    waterMesh.rotateX(-Math.PI / 2.0);
    waterMesh.position.set(
      this.size.width / 2,
      this.params.terrain.waterOffset + 0.4,
      this.size.width / 2
    );

    waterMesh.scale.set(this.size.width, this.size.width, 1);
    waterMesh.layers.set(1)
    this.add(waterMesh);
  }

  generateMeshes() {
    this.clear();

    this.generateWater();

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
        mesh.name = blockType.id;
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
          const instanceId = mesh.count;

          if (!this.isBlockObscured(x, y, z)) {
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockInstanceId(x, y, z, instanceId);
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
   * @returns {{id: number, instanceId: number}}
   */
  getBlock(x, y, z) {
    if (this.inBounds(x, y, z)) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  /**
   * Removes the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} activeBlockId
   */
  addBlock(x, y, z, activeBlockId) {
    if (this.getBlock(x, y, z).id === blocks.empty.id) {
      this.setBlockId(x, y, z, activeBlockId);
      this.addBlockInstance(x, y, z);
      this.dataStore.set(
        this.position.x,
        this.position.z,
        x,
        y,
        z,
        activeBlockId
      );
    }
  }
  /**
   * Removes the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  removeBlock(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (block && block.id !== blocks.empty.id) {
      this.deleteBlockInstance(x, y, z);
      this.setBlockId(x, y, z, blocks.empty.id);
      this.dataStore.set(
        this.position.x,
        this.position.z,
        x,
        y,
        z,
        blocks.empty.id
      );
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  deleteBlockInstance(x, y, z) {
    /*
     * So first we find the block then find the instanceMesh(group it is of grass ,dirt ,stone etc) of the block then we
     * swap the last mesh item with the item we have to remove
     */
    const block = this.getBlock(x, y, z);

    if (block.id === blocks.empty.id || block.instanceId === null) return;

    // Get the mesh and instance id of the block
    const mesh = this.children.find(
      (instanceMesh) => instanceMesh.name === block.id
    );
    const instanceId = block.instanceId;
    console.log(instanceId);

    // Swapping the transformation matrix of the block in the last position
    // with the block that we are going to remove
    const lastMatrix = new THREE.Matrix4();
    mesh.getMatrixAt(mesh.count - 1, lastMatrix);

    // Updating the instance id of the block in the last position to its new instance id
    const v = new THREE.Vector3();
    v.applyMatrix4(lastMatrix);
    this.setBlockInstanceId(v.x, v.y, v.z, instanceId);

    // Swapping the transformation matrices
    mesh.setMatrixAt(instanceId, lastMatrix);

    // This effectively removes the last instance from the scene
    mesh.count--;

    // Notify the instanced mesh we updated the instance matrix
    // Also re-compute the bounding sphere so raycasting works
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();

    // Remove the instance associated with the block and update the data model
    this.setBlockInstanceId(x, y, z, null);
  }

  /**
   * Create a new instance for the block at (x,y,z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  addBlockInstance(x, y, z) {
    const block = this.getBlock(x, y, z);
    console.log(block);

    // Verify the block exists, it isn't an empty block type, and it doesn't already have an instance
    if (block && block.id !== blocks.empty.id && block.instanceId === null) {
      console.log(block.id);
      // Get the mesh and instance id of the block
      const mesh = this.children.find(
        (instanceMesh) => instanceMesh.name === block.id
      );
      const instanceId = mesh.count++;
      this.setBlockInstanceId(x, y, z, instanceId);

      // Compute the transformation matrix for the new instance and update the instanced
      const matrix = new THREE.Matrix4();
      matrix.setPosition(x, y, z);
      mesh.setMatrixAt(instanceId, matrix);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
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

  disposeInstances() {
    this.traverse((obj) => {
      if (obj.dispose) {
        obj.dispose();
      }
    });
    this.clear();
  }
}
