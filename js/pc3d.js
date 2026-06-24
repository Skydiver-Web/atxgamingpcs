import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TIERS = {
  longhorn: {
    W: 0.90, H: 2.00, D: 1.80,
    caseColor:   0x181820,
    accentColor: 0x00c96b,
    gpuColor:    0x111118,
    gpuH: 0.36, gpuFans: 2,
    ramCount: 2, ramColor: 0x111118, ramRgb: 0x00c96b,
    aioW: 0.92, aioFans: 2,
    customLoop: false,
  },
  capitol: {
    W: 1.05, H: 2.55, D: 2.05,
    caseColor:   0x0d0d14,
    accentColor: 0x3b82f6,
    gpuColor:    0x0a0a12,
    gpuH: 0.50, gpuFans: 3,
    ramCount: 4, ramColor: 0x0d0d18, ramRgb: 0x3b82f6,
    aioW: 1.32, aioFans: 3,
    customLoop: false,
  },
  f1: {
    W: 1.20, H: 3.05, D: 2.35,
    caseColor:   0x070708,
    accentColor: 0xe84118,
    gpuColor:    0x0a0806,
    gpuH: 0.66, gpuFans: 3,
    ramCount: 4, ramColor: 0x12080a, ramRgb: 0xe84118,
    aioW: 1.32, aioFans: 3,
    customLoop: true,
  },
};

function stdMat(color, metalness = 0.65, roughness = 0.35) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}
function emissiveMat(color, intensity = 1.2) {
  return new THREE.MeshStandardMaterial({
    color, emissive: new THREE.Color(color),
    emissiveIntensity: intensity, metalness: 0.1, roughness: 0.8,
  });
}
function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
function add(parent, geom, mat, px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geom, mat);
  m.position.set(px, py, pz);
  m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

function buildPC(t) {
  const g = new THREE.Group();
  const { W, H, D } = t;
  const TH = 0.035; // panel thickness

  const caseMat  = stdMat(t.caseColor, 0.75, 0.28);
  const frontMat = stdMat(new THREE.Color(t.caseColor).addScalar(0.03).getHex(), 0.6, 0.4);
  const darkMat  = stdMat(0x050507, 0.9, 0.5);
  const accentM  = emissiveMat(t.accentColor, 1.8);

  // ── Case shell (5 panels, right side open for glass) ──
  add(g, box(W, TH, D), caseMat, 0,   H/2,  0);   // top
  add(g, box(W, TH, D), caseMat, 0,  -H/2,  0);   // bottom
  add(g, box(TH, H, D), caseMat,-W/2, 0,    0);   // left
  add(g, box(W, H, TH), caseMat, 0,   0,  -D/2);  // back
  add(g, box(W, H, TH), frontMat,0,   0,   D/2);  // front

  // ── Front accent strip ──
  add(g, box(0.025, H * 0.60, 0.048), accentM, W/2 - 0.05, 0, D/2 + 0.018);

  // ── Front logo indent ──
  add(g, box(0.12, 0.03, 0.01), stdMat(0x333338, 0.8, 0.2), 0, H * 0.44, D/2 + 0.028);

  // ── Power button ──
  add(g, box(0.042, 0.042, 0.018),
    stdMat(t.accentColor, 0.4, 0.5), W * 0.28, H * 0.43, D/2 + 0.026);

  // ── USB ports ──
  for (let i = 0; i < 2; i++)
    add(g, box(0.040, 0.022, 0.016), darkMat, W * 0.06 + i * 0.055, H * 0.43, D/2 + 0.026);

  // ── Front mesh grille ──
  for (let i = 0; i < 4; i++)
    add(g, box(W * 0.50, 0.012, 0.008), darkMat, -W*0.05, -H*0.22 + i*0.055, D/2 + 0.022);

  // ── Tempered glass right panel ──
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaccee, transparent: true, opacity: 0.07,
    roughness: 0, metalness: 0, transmission: 0.94, side: THREE.DoubleSide,
  });
  add(g, box(0.012, H - 0.02, D - 0.02), glassMat, W/2 + 0.004, 0, 0);

  // Glass frame top/bottom
  const frameMat = stdMat(new THREE.Color(t.caseColor).addScalar(0.1).getHex(), 0.85, 0.18);
  add(g, box(0.018, 0.018, D - 0.02), frameMat, W/2, H/2 - 0.01, 0);
  add(g, box(0.018, 0.018, D - 0.02), frameMat, W/2,-H/2 + 0.01, 0);

  // ── PSU (bottom-rear) ──
  add(g, box(W * 0.52, H * 0.13, D * 0.27), stdMat(0x1a1a1c, 0.7, 0.4),
    -W * 0.10, -H/2 + H * 0.07, D * 0.27);

  // ── Motherboard (dark PCB) ──
  const moboMat = stdMat(0x0c180c, 0.18, 0.88);
  add(g, box(0.022, H * 0.70, D * 0.56), moboMat, -W * 0.04, H * 0.03, -D * 0.10);

  // Mobo VRM heatsinks
  const vrmMat = stdMat(0x2a2a30, 0.7, 0.3);
  for (let i = 0; i < 3; i++)
    add(g, box(0.015, 0.040, H * 0.038), vrmMat, -W*0.01, H*0.27, -D*0.30 + i*0.028);

  // ── RAM sticks ──
  for (let i = 0; i < t.ramCount; i++) {
    const xOff = -D * 0.33 + i * (D * 0.063);
    add(g, box(0.018, H * 0.30, D * 0.048), stdMat(t.ramColor, 0.5, 0.55),
      -W * 0.01, H * 0.14, xOff);
    // RGB diffuser bar on RAM
    add(g, box(0.020, H * 0.038, D * 0.048), emissiveMat(t.ramRgb, 0.9),
      -W * 0.01, H * 0.31, xOff);
  }

  // ── GPU ──
  const gpuBodyMat = stdMat(t.gpuColor, 0.82, 0.18);
  const gpuShroud  = stdMat(new THREE.Color(t.gpuColor).addScalar(0.05).getHex(), 0.6, 0.4);
  add(g, box(0.028, t.gpuH, D * 0.50), gpuBodyMat, W * 0.13, -H * 0.10, -D * 0.07);
  // GPU heatsink fins
  for (let i = 0; i < 5; i++)
    add(g, box(0.020, t.gpuH * 0.88, 0.009), gpuShroud,
      W * 0.15, -H * 0.10, -D * 0.25 + i * 0.038);
  // GPU fans
  const fanRad = t.gpuH > 0.55 ? 0.072 : t.gpuH > 0.38 ? 0.064 : 0.058;
  for (let i = 0; i < t.gpuFans; i++) {
    const fanZ = -D * 0.28 + i * (D * 0.19 / Math.max(t.gpuFans - 1, 1));
    const fanMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(fanRad, fanRad, 0.014, 14),
      stdMat(0x1c1c22, 0.5, 0.6)
    );
    fanMesh.rotation.x = Math.PI / 2;
    fanMesh.position.set(W * 0.16, -H * 0.10, fanZ);
    g.add(fanMesh);
    // Fan ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(fanRad, 0.009, 6, 14),
      stdMat(0x2a2a32, 0.7, 0.3)
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(fanMesh.position);
    g.add(ring);
    // Fan hub
    add(g, new THREE.CylinderGeometry(0.016, 0.016, 0.018, 8),
      stdMat(0x111116, 0.8, 0.4),
      W * 0.16, -H * 0.10, fanZ, Math.PI/2, 0, 0);
  }

  // ── AIO Radiator (top) ──
  const aioMat = stdMat(0x101014, 0.55, 0.55);
  add(g, box(t.aioW, TH * 1.8, D * 0.28), aioMat,
    -W * 0.05, H/2 - TH * 3.5, -D * 0.12);
  // Fins
  for (let i = 0; i < 9; i++)
    add(g, box(t.aioW * 0.96, TH * 1.4, 0.007), stdMat(0x1c1c20, 0.8, 0.3),
      -W * 0.05, H/2 - TH * 3.5, -D * 0.22 + i * 0.023);
  // AIO fans
  const aioFanR = 0.053;
  for (let i = 0; i < t.aioFans; i++) {
    const fx = -t.aioW * 0.35 + i * (t.aioW * 0.33);
    const fm = new THREE.Mesh(
      new THREE.CylinderGeometry(aioFanR, aioFanR, 0.016, 12),
      stdMat(0x1a1a20, 0.5, 0.6)
    );
    fm.position.set(fx, H/2 - TH * 8, -D * 0.12);
    g.add(fm);
    const fr = new THREE.Mesh(
      new THREE.TorusGeometry(aioFanR, 0.008, 6, 12),
      stdMat(0x282830, 0.6, 0.4)
    );
    fr.position.copy(fm.position);
    g.add(fr);
  }

  // ── Cooling tubes / custom loop ──
  if (!t.customLoop) {
    const tubeMat = stdMat(0x2a2a34, 0.3, 0.75);
    const tc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-W*0.05, H/2 - TH*4, -D*0.06),
      new THREE.Vector3( W*0.08,  H*0.18,    -D*0.16),
      new THREE.Vector3( W*0.03, -H*0.04,    -D*0.22),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(tc, 22, 0.014, 8), tubeMat));
    const tc2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-W*0.05, H/2 - TH*4,  D*0.04),
      new THREE.Vector3( W*0.06,  H*0.20,     D*0.06),
      new THREE.Vector3( W*0.02, -H*0.06,    -D*0.12),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(tc2, 22, 0.014, 8), tubeMat));
  } else {
    // Reservoir
    const resMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, H * 0.38, 18),
      stdMat(0x180c0c, 0.35, 0.65)
    );
    resMesh.position.set(W * 0.24, H * 0.08, D * 0.10);
    g.add(resMesh);
    // Coolant (colored fluid)
    const fluidMat = new THREE.MeshStandardMaterial({
      color: 0xff2200, transparent: true, opacity: 0.55,
      emissive: 0xff1100, emissiveIntensity: 0.6,
    });
    const fluid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, H * 0.33, 18),
      fluidMat
    );
    fluid.position.copy(resMesh.position);
    g.add(fluid);
    // Hardline tubes (angular)
    const hlMat = new THREE.MeshPhysicalMaterial({
      color: 0xddddee, transparent: true, opacity: 0.28,
      roughness: 0.05, metalness: 0.0, transmission: 0.7,
    });
    const hl1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(W*0.24,  H*0.26,  D*0.10),
      new THREE.Vector3(W*0.24,  H*0.40,  D*0.10),
      new THREE.Vector3(-W*0.04, H*0.40,  D*0.10),
      new THREE.Vector3(-W*0.04, H*0.40, -D*0.08),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(hl1, 32, 0.017, 8), hlMat));
    const hl2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-W*0.04, H/2 - TH*3.5, 0),
      new THREE.Vector3( W*0.10, H*0.18,  -D*0.06),
      new THREE.Vector3( W*0.10, -H*0.14, -D*0.06),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(hl2, 32, 0.017, 8), hlMat));
    const hl3 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(W*0.10, -H*0.14, -D*0.06),
      new THREE.Vector3(W*0.18, -H*0.20,  D*0.05),
      new THREE.Vector3(W*0.24, -H*0.10,  D*0.10),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(hl3, 32, 0.017, 8), hlMat));
    // Pump block
    add(g, box(0.07, 0.07, 0.055), stdMat(0x1a0a0a, 0.7, 0.3),
      W*0.12, -H*0.15, -D*0.10);
  }

  // ── Internal RGB strip (runs down right edge inside) ──
  add(g, box(0.008, H * 0.75, 0.008),
    emissiveMat(t.accentColor, 2.2), W/2 - 0.055, 0, D/2 - 0.055);

  // ── Feet ──
  const feetMat = stdMat(0x101012, 0.3, 0.9);
  [[-W*0.32, D*0.32], [W*0.32, D*0.32], [-W*0.32,-D*0.32], [W*0.32,-D*0.32]]
    .forEach(([x, z]) => add(g, box(0.055, 0.03, 0.055), feetMat, x, -H/2 - 0.015, z));

  // ── Interior RGB glow light ──
  const rgb = new THREE.PointLight(t.accentColor, 3.0, H * 2.0);
  rgb.position.set(W/2 - 0.12, 0, 0);
  g.add(rgb);

  // Bottom accent glow
  const bot = new THREE.PointLight(t.accentColor, 1.2, H * 0.9);
  bot.position.set(0, -H * 0.38, D * 0.32);
  g.add(bot);

  return g;
}

export function initPCViewer(canvasId, tierId) {
  const cfg = TIERS[tierId];
  if (!cfg) return;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(cfg.W * 3.6, cfg.H * 0.55, cfg.D * 3.4);
  camera.lookAt(0, cfg.H * 0.05, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping  = true;
  controls.dampingFactor  = 0.055;
  controls.autoRotate     = true;
  controls.autoRotateSpeed = 0.65;
  controls.enableZoom     = false;
  controls.enablePan      = false;
  controls.minPolarAngle  = Math.PI * 0.22;
  controls.maxPolarAngle  = Math.PI * 0.52;

  // ── Scene Lighting ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.30));

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(4, 7, 5); scene.add(key);

  const fill = new THREE.DirectionalLight(0x8899cc, 0.35);
  fill.position.set(-5, 2, -4); scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.55);
  rim.position.set(2, -4, -5); scene.add(rim);

  const accentRim = new THREE.DirectionalLight(new THREE.Color(cfg.accentColor), 0.45);
  accentRim.position.set(-3, 1, 4); scene.add(accentRim);

  // ── Floor ──
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(cfg.H * 1.5, 64),
    new THREE.MeshStandardMaterial({ color: 0x0c0c10, metalness: 0.55, roughness: 0.45 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -cfg.H / 2 - 0.03;
  scene.add(floor);

  // ── PC Model ──
  scene.add(buildPC(cfg));

  // ── Responsive resize ──
  function resize() {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  // ── Pause auto-rotate on drag ──
  canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; });

  // ── Animate ──
  (function loop() {
    requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  })();
}
