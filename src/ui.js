import GUI from "lil-gui";
import { blocks, resources } from "./blocks";
import { World } from "./world";

export function lilGUI(scene, world, player) {
  const gui = new GUI();
  gui.close()
  const sceneFolder = gui.addFolder("Scene");
  sceneFolder.add(scene.fog, "near", 1, 200, 1).name("Fog Near");
  sceneFolder.add(scene.fog, "far", 1, 200, 1).name("Fog Far");

  const playerFolder = gui.addFolder("Player");
  playerFolder.add(player, "maxSpeed", 10, 20).name("speed");
  playerFolder
    .add(player.cameraHelper, "visible")
    .name("Show camera helper of user");

  const terrainFolder = gui.addFolder("Terrain");
  terrainFolder.add(world, "asyncLoading").name("Async Loading");
  terrainFolder.add(world, "drawDistance", 0, 5, 1).name("Draw Distance");
  terrainFolder.add(world.params, "seed", 0, 100).name("seed");
  terrainFolder.add(world.params.terrain, "scale", 10, 100).name("scale");
  terrainFolder.add(world.params.terrain, "magnitude", 0, 1).name("magnitude");
  terrainFolder.add(world.params.terrain, "offset", 0, 1).name("offset");
  terrainFolder.add(world.params.terrain, "waterOffset", 0, 10).name("Wateroffset");

  const resourcesFolder = gui.addFolder("resources");

  resources.forEach((res) => {
    const resourceFolder = resourcesFolder.addFolder(res.name);
    resourceFolder.add(res, "scarcity", 0, 1).name("Scarcity");

    const scaleFolder = resourcesFolder.addFolder("Scale");
    scaleFolder.add(res.scale, "x", 1, 100).name("x scale");
    scaleFolder.add(res.scale, "y", 1, 100).name("y scale");
    scaleFolder.add(res.scale, "z", 1, 100).name("z scale");
  });

  const treesFolder = terrainFolder.addFolder("Trees").close();
  treesFolder.add(world.params.trees , 'frequency' , 0 , 0.1).name('Frequency')
  treesFolder.add(world.params.trees.trunk, 'minHeight', 0, 10, 1).name('Min Trunk Height');
  treesFolder.add(world.params.trees.trunk, 'maxHeight', 0, 10, 1).name('Max Trunk Height');
  treesFolder.add(world.params.trees.canopy, 'minRadius', 0, 10, 1).name('Min Canopy Size');
  treesFolder.add(world.params.trees.canopy, 'maxRadius', 0, 10, 1).name('Max Canopy Size');
  treesFolder.add(world.params.trees.canopy, 'density', 0, 1).name('Canopy Density');

   const cloudFolder = terrainFolder.addFolder("Clouds").close();
  cloudFolder.add(world.params.clouds , 'scale' , 0 , 100).name('scale')
  cloudFolder.add(world.params.clouds, 'density', 0, 1).name('density');

  gui.onChange(() => {
    world.generate(true);
  });

}
