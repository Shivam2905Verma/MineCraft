import GUI from "lil-gui";
import { blocks, resources } from "./blocks";

export function lilGUI(scene, world, player) {
  const gui = new GUI();

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

  const resourcesFolder = gui.addFolder("resources");

  resources.forEach((res) => {
    const resourceFolder = resourcesFolder.addFolder(res.name);
    resourceFolder.add(res, "scarcity", 0, 1).name("Scarcity");

    const scaleFolder = resourcesFolder.addFolder("Scale");
    scaleFolder.add(res.scale, "x", 1, 100).name("x scale");
    scaleFolder.add(res.scale, "y", 1, 100).name("y scale");
    scaleFolder.add(res.scale, "z", 1, 100).name("z scale");
  });

  gui.onChange(() => {
    world.generate();
  });
}
