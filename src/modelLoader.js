import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class ModelLoader {
  loader = new GLTFLoader();

  model = {
    pickaxe: undefined,
  };

  loadModels(onLoads) {
    this.loader.load("/models/minecraft_pickaxe.glb", (model) => {
      const mesh = model.scene;

      this.model.pickaxe = mesh;
      onLoads(this.model);
    });
  }
}
