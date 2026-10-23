import {houndByID} from '../game/roster';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

// One download and shared immutable geometry/textures; each dog has its own skeleton/materials.
let asset: Promise<GLTF> | undefined;
function loadWolf() {
  return asset ??= new GLTFLoader().loadAsync(new URL('./assets/dire-wolf.glb', import.meta.url).href);
}
type Pose = { hound?: string; y?: number; yaw?: number; pitch?: number; alpha?: number; flash?: number; walk?: number; jaw?: number };
type Actor = { pivot: THREE.Group; mixer: THREE.AnimationMixer; actions: Map<string, THREE.AnimationAction>; current?: THREE.AnimationAction; materials: THREE.MeshStandardMaterial[]; used: boolean; time: number };
export class WolfActors {
  private template?: GLTF;
  private disposed = false;
  private readonly actors = new Map<string, Actor>();
  constructor(private scene: THREE.Scene, private canvas: HTMLCanvasElement) {
    canvas.dataset.wolfModel = 'loading';
    void loadWolf().then(gltf => {
      if (!this.disposed) { this.template = gltf; canvas.dataset.wolfModel = 'ready'; }
    }).catch(error => { canvas.dataset.wolfModel = 'fallback'; console.warn('Wolf model unavailable; using built-in model.', error); });
  }
  show(id: string, x: number, z: number, kind: string, time: number, scale: number, pose: Pose = {}) {
    if (!this.template || this.disposed) return false;
    const actorID=id+':'+(pose.hound??kind);
    let actor = this.actors.get(actorID);
    if (!actor) {
      const root = clone(this.template.scene), materials: THREE.MeshStandardMaterial[] = [];
      root.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = true; object.receiveShadow = true;
        const multiple = Array.isArray(object.material);
        const copies = (multiple ? object.material as THREE.Material[] : [object.material as THREE.Material]).map(source => {
          const material = (source as THREE.MeshStandardMaterial).clone();
          material.color.setRGB(1,1,1);
          const identity=houndByID(pose.hound??''),tint=new THREE.Color(identity?.color??'#ffffff');
          const coat=(identity&& !['dawn','dusk'].includes(identity.id))?tint.lerp(new THREE.Color('#ffffff'),.45).multiplyScalar(kind==='shadow'?.5:2).toArray().map(v=>v.toFixed(4)).join(','):kind==='shadow'?'.25,.34,.50':'1.8,1.95,2.1';
          material.onBeforeCompile = shader => {
            shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nfloat coatLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=coatLuma*' + ('vec3('+coat+')'+(kind==='shadow'?'':'/sqrt(max(coatLuma,.001))')) + ';');
          };
          material.customProgramCacheKey = () => 'wolf-coat-' + (pose.hound??kind);
          material.roughness = .92; material.metalness = 0; material.alphaHash = true;
          materials.push(material); return material;
        });
        object.material = multiple ? copies : copies[0];
      });
      // Asset faces +Z. The game uses +X as forward, with a .35-high presentation pivot.
      root.scale.setScalar(.48); root.rotation.y = Math.PI / 2; root.position.y = -.35;
      const pivot = new THREE.Group(); pivot.add(root); this.scene.add(pivot);
      const mixer = new THREE.AnimationMixer(root), actions = new Map<string, THREE.AnimationAction>();
      for (const clip of this.template.animations) actions.set(clip.name, mixer.clipAction(clip));
      const bite = actions.get('bite'); if (bite) { bite.setLoop(THREE.LoopOnce, 1); bite.clampWhenFinished = true; }
      actor = { pivot, mixer, actions, materials, used: true, time }; this.actors.set(actorID, actor);
    }
    actor.used = true; actor.pivot.visible = true;
    actor.pivot.position.set(x, .35 * scale + (pose.y ?? 0), z); actor.pivot.scale.setScalar(scale);
    actor.pivot.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), -(pose.yaw ?? 0));
    actor.pivot.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), pose.pitch ?? 0));
    const animation = actor.actions.get((pose.jaw ?? 0) > .08 ? 'bite' : (pose.walk ?? 0) > .1 ? 'run_loop' : 'idle_loop');
    if (animation && animation !== actor.current) {
      actor.current?.fadeOut(.12); animation.reset().fadeIn(.12).play(); actor.current = animation;
    }
    actor.mixer.update(Math.max(0, Math.min(.1, time - actor.time))); actor.time = time;
    for (const material of actor.materials) {
      material.opacity = pose.alpha ?? 1;
      material.emissive.setRGB(pose.flash ?? 0, pose.flash ?? 0, pose.flash ?? 0);
    }
    return true;
  }
  beforeRender() { for (const actor of this.actors.values()) { actor.pivot.visible = actor.used; actor.used = false; } }
  dispose() {
    this.disposed = true;
    for (const actor of this.actors.values()) {
      actor.mixer.stopAllAction(); actor.mixer.uncacheRoot(actor.mixer.getRoot());
      for (const material of actor.materials) material.dispose(); this.scene.remove(actor.pivot);
    }
    this.actors.clear();
  }
}
