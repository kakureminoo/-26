import {sharedSurfaceAtlas,applySurfaceShader} from './surface-textures';
import * as THREE from 'three';


/** Adapter keeps integer board rules independent from the renderer. */
export class HoundWorld {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly view = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100);
  readonly staticMesh: THREE.Mesh;
  readonly dynamicMesh: THREE.Mesh;
  readonly backdropMesh: THREE.Mesh;
  readonly lamps: THREE.PointLight[];
  readonly key: THREE.DirectionalLight;
  lights: number[][] = [];
  boxes: number[][] = [];
  sky: number[] = [.018, .026, .043];
  private readonly vector = new THREE.Vector3();
  private readonly blockers = { value: Array.from({ length: 20 }, () => new THREE.Vector4()) };
  private readonly blockerCount = { value: 0 };
  private readonly sources = { value: Array.from({ length: 3 }, () => new THREE.Vector3()) };

  private width = 0;
  private height = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    canvas.dataset.wolfModel='original';
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .78, metalness: .12, side: THREE.DoubleSide, alphaHash: true });
    material.onBeforeCompile = shader => {
      shader.uniforms.uBlockers = this.blockers; shader.uniforms.uBlockerCount = this.blockerCount; shader.uniforms.uSources = this.sources;
      shader.vertexShader = 'attribute float glow; varying float vGlow; varying vec3 vWorldPoint;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow; vWorldPoint = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = `varying float vGlow; varying vec3 vWorldPoint;
        uniform vec4 uBlockers[20]; uniform int uBlockerCount; uniform vec3 uSources[3];
        float lanternOcclusion(vec3 lightPosition) {
          vec3 delta = lightPosition - vWorldPoint;
          for (int b = 0; b < 20; b++) {
            if (b >= uBlockerCount) break;
            vec4 box = uBlockers[b];
            vec3 lo = vec3(box.x-.43,.08,box.y-.43), hi = vec3(box.x+.43,box.w,box.y+.43);
            vec3 a = (lo-vWorldPoint)/(delta+vec3(.0001)), z = (hi-vWorldPoint)/(delta+vec3(.0001));
            vec3 mn=min(a,z), mx=max(a,z);
            float entry=max(max(mn.x,mn.y),mn.z), leave=min(min(mx.x,mx.y),mx.z);
            if(leave>=entry && leave>.01 && entry<.98 && entry>.002) return .06;
          }
          return 1.0;
        }\n` + shader.fragmentShader;
      const lighting = THREE.ShaderChunk.lights_fragment_begin.replace(
        'getPointLightInfo( pointLight, geometryPosition, directLight );',
        'getPointLightInfo( pointLight, geometryPosition, directLight ); directLight.color *= lanternOcclusion(uSources[ i ]);'
      );
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', lighting);
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor.rgb * max(vGlow,0.0);');
    };
    const creatureMaterial=material.clone();creatureMaterial.roughness=.58;creatureMaterial.metalness=.18;
    const compile=material.onBeforeCompile;
    creatureMaterial.onBeforeCompile=(shader,renderer)=>{
      compile.call(creatureMaterial,shader,renderer);
      applySurfaceShader(shader,sharedSurfaceAtlas());
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat grain=sin(vWorldPoint.x*195.0)*sin(vWorldPoint.y*163.0)*sin(vWorldPoint.z*177.0);roughnessFactor=clamp(roughnessFactor+grain*.045,.3,.9);');
      shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat edge=pow(1.0-max(dot(normal,normalize(vViewPosition)),0.0),3.0);totalEmissiveRadiance+=vec3(.055,.075,.11)*edge;');
    };
    material.customProgramCacheKey=()=> 'world-surfaces-v1';
    creatureMaterial.customProgramCacheKey=()=> 'creatures-surfaces-v2';
    material.onBeforeCompile=(shader,renderer)=>{compile.call(material,shader,renderer);applySurfaceShader(shader,sharedSurfaceAtlas());};
    this.staticMesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    this.dynamicMesh = new THREE.Mesh(new THREE.BufferGeometry(), creatureMaterial);
    this.backdropMesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    for (const mesh of [this.staticMesh, this.dynamicMesh, this.backdropMesh]) {
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; this.scene.add(mesh);
    }
    this.scene.add(new THREE.HemisphereLight(0xc0d9ff, 0x101924, .32));
    this.key = new THREE.DirectionalLight(0xc7dcff, canvas.id==='battle'?1.05:.9);
    this.key.position.set(-4, 9, 6); this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    Object.assign(this.key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: .1, far: 50 });
    this.key.shadow.normalBias = .035; this.key.shadow.bias = -.00015;
    this.scene.add(this.key, this.key.target);
    this.lamps = Array.from({ length: 3 }, () => {
      const lamp = new THREE.PointLight(0xffbc62, canvas.id==='battle'?12:4.5, 9, 2);
      // Exact blocker occlusion in the material avoids 18 point-shadow passes per frame.
      this.scene.add(lamp); return lamp;
    });
    const rim = new THREE.DirectionalLight(0x9dc9e2, 1.5); rim.position.set(-3, 4, -5); this.scene.add(rim);
  }
  camera(eye: number[], target: number[], width: number) {
    this.view.position.fromArray(eye); this.view.lookAt(new THREE.Vector3().fromArray(target));
    this.view.left = -width / 2; this.view.right = width / 2;
    const height = width * this.canvas.height / Math.max(1, this.canvas.width);
    this.view.top = height / 2; this.view.bottom = -height / 2; this.view.updateProjectionMatrix(); this.view.updateMatrixWorld();
    this.key.target.position.fromArray(target);
    this.key.position.set(target[0] - 4, 10, target[2] + 5);
  }
  project(point: number[]) {
    const p = this.vector.fromArray(point).project(this.view);
    return { x: (p.x + 1) * .5 * this.canvas.width, y: (1 - p.y) * .5 * this.canvas.height };
  }
  pick(px: number, py: number, width: number, height: number, floorHeight?: (x:number,y:number)=>number) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(px / this.canvas.width * 2 - 1, 1 - py / this.canvas.height * 2), this.view);
    if(floorHeight){
      let nearest=Infinity,selected={x:-1,y:-1};
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const h=floorHeight(x,y);if(!Number.isFinite(h))continue;
        const point=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-h),new THREE.Vector3());
        if(point&&point.x>=x&&point.x<x+1&&point.z>=y&&point.z<y+1){const distance=point.distanceToSquared(ray.ray.origin);if(distance<nearest){nearest=distance;selected={x,y};}}
      }return selected;
    }
    const hit = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
    if (!hit) return { x: -1, y: -1 };
    const x = Math.floor(hit.x), y = Math.floor(hit.z);
    return x >= 0 && y >= 0 && x < width && y < height ? { x, y } : { x: -1, y: -1 };
  }
  private upload(mesh: THREE.Mesh, vertices: number[], dynamic = false) {
    const count = vertices.length / 11;
    const old = mesh.geometry.getAttribute('position');
    if (!dynamic || !old || old.count < count) {
      mesh.geometry.dispose();
      const geometry = new THREE.BufferGeometry();
      const capacity = dynamic ? Math.ceil(Math.max(count, 1024) * 1.4) : count;
      for (const [name, size] of [['position', 3], ['normal', 3], ['color', 4], ['glow', 1]] as const) {
        const attribute = new THREE.BufferAttribute(new Float32Array(capacity * size), size);
        if (dynamic) attribute.setUsage(THREE.DynamicDrawUsage);
        geometry.setAttribute(name, attribute);
      }
      mesh.geometry = geometry;
    }
    const position = mesh.geometry.getAttribute('position'), normal = mesh.geometry.getAttribute('normal');
    const color = mesh.geometry.getAttribute('color'), glow = mesh.geometry.getAttribute('glow');
    for (let i = 0; i < count; i++) {
      const k = i * 11;
      position.setXYZ(i, vertices[k], vertices[k + 1], vertices[k + 2]);
      normal.setXYZ(i, vertices[k + 3], vertices[k + 4], vertices[k + 5]);
      color.setXYZW(i, vertices[k + 6], vertices[k + 7], vertices[k + 8], vertices[k + 10]);
      glow.setX(i, vertices[k + 9]);
    }
    for (const a of [position, normal, color, glow]) a.needsUpdate = true;
    mesh.geometry.setDrawRange(0, count);
  }
  dispose() {

    this.staticMesh.geometry.dispose(); this.dynamicMesh.geometry.dispose(); this.backdropMesh.geometry.dispose();
    (this.staticMesh.material as THREE.Material).dispose();(this.dynamicMesh.material as THREE.Material).dispose();
    this.key.shadow.map?.dispose(); this.renderer.dispose(); this.renderer.forceContextLoss();
  }
  backdrop(vertices: number[]) { this.upload(this.backdropMesh, vertices, true); }
  static(vertices: number[], lights: number[][], boxes: number[][]) {
    this.upload(this.staticMesh, vertices, true); this.lights = lights; this.boxes = boxes.slice(0, 20);
    this.blockerCount.value = this.boxes.length; this.boxes.forEach((b,i) => this.blockers.value[i].fromArray(b));
  }
  draw(vertices: number[]) {
    this.upload(this.dynamicMesh, vertices, true);
    this.redraw();
  }
  /** Reuse uploaded geometry when only the camera changes. */
  redraw() {
    if (this.width !== this.canvas.width || this.height !== this.canvas.height) {
      this.width = this.canvas.width; this.height = this.canvas.height;
      this.renderer.setSize(this.width, this.height, false);
    }
    this.renderer.setClearColor(new THREE.Color().fromArray(this.sky));
    this.lamps.forEach((lamp, i) => { lamp.visible = !!this.lights[i]; if (this.lights[i]) { lamp.position.fromArray(this.lights[i]); this.sources.value[i].fromArray(this.lights[i]); } });
    this.renderer.render(this.scene, this.view);
  }
}
