import * as THREE from '//cdn.skypack.dev/three@0.136?min'
import { OrbitControls } from '//cdn.skypack.dev/three@0.136/examples/jsm/controls/OrbitControls?min'
import { EffectComposer, FullScreenQuad, Pass } from '//cdn.skypack.dev/three@0.136/examples/jsm/postprocessing/EffectComposer?min'
import { RenderPass } from '//cdn.skypack.dev/three@0.136/examples/jsm/postprocessing/RenderPass?min'
import { RadialBlurPassGen } from 'https://cdn.jsdelivr.net/gh/ycw/three-radial-blur@3.1.1/src/index.js'
import { gsap } from "https://cdn.skypack.dev/gsap@3.9.1";

// ----
// main
// ----

const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 2, .1, 100);
const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;

const light = new THREE.DirectionalLight('magenta', 1);
light.position.set(0, 5, 1);
scene.add(light);

const light1 = new THREE.PointLight('cyan', 2);
light1.position.set(0, 0, 1);
scene.add(light1);

// photo by Joe Woods - https://unsplash.com/photos/4Zaq5xY5M_c
const url = 'https://images.unsplash.com/photo-1531685250784-7569952593d2?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80';
const tex = new THREE.TextureLoader().load(url);
tex.repeat.set(.2, .2);

const nRow = 16;
const nCol = 16;
const nInst = nCol * nRow;
const sz = .05;
const geom = new THREE.BoxGeometry(sz * 2, sz * 2, sz).translate(0, 0, sz / 2);
const mat = new THREE.MeshPhysicalMaterial({ clearcoat: 1, alphaMap: tex, alphaTest: .74 });
const mesh = new THREE.InstancedMesh(geom, mat, nInst);
const mat4 = new THREE.Matrix4();
for (let i = 0, c = 0; i < nRow; ++i) {
  for (let j = 0; j < nCol; ++j, ++c) {
    const t = Math.max(0, Math.hypot(j - nCol / 2, i - nRow / 2) ** 2 - 10);
    mat4.makeScale(1, 1, Math.random() * t);
    mat4.setPosition(j * sz, i * sz, t == 0 ? 10000 : 0); // hide some.
    mesh.setMatrixAt(c, mat4);
  }
}
const g = new THREE.Group();
g.add(mesh);
g.position.set(sz / 2 - nCol * sz / 2, sz / 2 - nRow * sz / 2, 0);
scene.add(g);

// ----
// render
// ----

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const RadialBlurPass = RadialBlurPassGen({ THREE, FullScreenQuad, Pass });
composer.addPass(new RadialBlurPass({ intensity: .4, iterations: 32 }));

const n = new THREE.Group();
scene.add(n);
n.add(camera);
camera.position.set(.1, 0, 3);
gsap.to(n.rotation, { z: Math.PI * 2, duration: 2, ease: 'none', repeat: -1 });
controls.enableRotate = false;

renderer.setAnimationLoop(() => {
  controls.update();
  composer.render();
});

// ----
// view
// ----

function resize(w, h, dpr = devicePixelRatio) {
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  composer.setPixelRatio(dpr);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', () => resize(innerWidth, innerHeight));
dispatchEvent(new Event('resize'));
document.body.prepend(renderer.domElement);
