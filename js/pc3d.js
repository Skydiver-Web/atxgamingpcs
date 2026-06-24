import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ── Tier configs ─────────────────────────────────────────────────────────── */
const TIERS = {
  longhorn: {
    W:1.00, H:2.10, D:1.90,
    caseColor:0x16161c, accent:0x00c96b, accent2:0x00ff88,
    gpuColor:0x0e0e14, gpuH:0.38, gpuFans:2, gpuL:0.92,
    ramCount:2, ramRgb:0x00c96b,
    aioW:0.96, aioFans:2, customLoop:false,
  },
  capitol: {
    W:1.12, H:2.62, D:2.10,
    caseColor:0x0c0c13, accent:0x3b82f6, accent2:0x60a5fa,
    gpuColor:0x09090f, gpuH:0.52, gpuFans:3, gpuL:1.08,
    ramCount:4, ramRgb:0x3b82f6,
    aioW:1.34, aioFans:3, customLoop:false,
  },
  f1: {
    W:1.28, H:3.10, D:2.40,
    caseColor:0x070708, accent:0xe84118, accent2:0xff6040,
    gpuColor:0x0b0806, gpuH:0.68, gpuFans:3, gpuL:1.22,
    ramCount:4, ramRgb:0xe84118,
    aioW:1.34, aioFans:3, customLoop:true,
  },
};

/* ── Material helpers ─────────────────────────────────────────────────────── */
const sm  = (c,me=0.65,ro=0.32) => new THREE.MeshStandardMaterial({color:c,metalness:me,roughness:ro});
const gl  = (c)                  => sm(c, 0.92, 0.05);
const em  = (c,i=1.6)            => new THREE.MeshStandardMaterial({color:c,emissive:new THREE.Color(c),emissiveIntensity:i,metalness:0,roughness:0.85});
const trn = (c,o=0.07)           => new THREE.MeshPhysicalMaterial({color:c,transparent:true,opacity:o,roughness:0,metalness:0,transmission:0.94,side:THREE.DoubleSide,depthWrite:false});

/* ── Geometry helpers ─────────────────────────────────────────────────────── */
const bx = (w,h,d) => new THREE.BoxGeometry(w,h,d);
const cy = (r,h,s=16) => new THREE.CylinderGeometry(r,r,h,s);
const tr = (R,r,s=6,t=24) => new THREE.TorusGeometry(R,r,s,t);

function mk(parent, geom, mat, px=0,py=0,pz=0, rx=0,ry=0,rz=0) {
  const m = new THREE.Mesh(geom,mat);
  m.position.set(px,py,pz);
  m.rotation.set(rx,ry,rz);
  m.castShadow = true;
  parent.add(m);
  return m;
}

/* ── Fan (disk in XZ plane, normal = +Y) ─────────────────────────────────── */
function fan(radius, blades=11, col=0x111116) {
  const g = new THREE.Group();
  const hubR = radius * 0.19;
  const ring = new THREE.Mesh(tr(radius, radius*0.052, 6, 28), sm(0x222232,0.78,0.28));
  ring.rotation.x = Math.PI/2; g.add(ring);
  mk(g, cy(hubR,0.026,14), sm(0x18181e,0.85,0.38));
  mk(g, cy(hubR*0.55,0.030,10), gl(0x2a2a38), 0,0.002,0);
  const bm = new THREE.MeshStandardMaterial({color:col,metalness:0.28,roughness:0.78,side:THREE.DoubleSide});
  const blen = radius - hubR - radius*0.055;
  for (let i=0;i<blades;i++) {
    const piv = new THREE.Object3D();
    piv.rotation.y = (i/blades)*Math.PI*2;
    const b = new THREE.Mesh(bx(blen, 0.006, radius*0.24), bm);
    b.position.x = hubR + blen*0.5;
    b.rotation.y = 0.20;
    piv.add(b); g.add(piv);
  }
  return g;
}

/* ── AIO radiator ─────────────────────────────────────────────────────────── */
function buildAIO(aioW, fanCount, accent) {
  const g = new THREE.Group();
  const RD = 0.30, TH = 0.030;
  mk(g, bx(aioW, TH*1.7, RD), sm(0x0d0d10,0.62,0.52));
  for (let i=0;i<16;i++)
    mk(g, bx(aioW*0.96, TH*1.3, 0.005), sm(0x1c1c24,0.84,0.24), 0,0,-RD*0.48+i*(RD*0.96/15));
  for (let p=0;p<3;p++)
    mk(g, cy(0.007, aioW*0.94, 8), sm(0x888898,0.92,0.08), 0,0,0, 0,0,Math.PI/2);
  const sp = aioW*0.90/fanCount;
  for (let i=0;i<fanCount;i++) {
    const fx = -aioW*0.45 + sp*0.5 + i*sp;
    const fg = fan(0.058,11,0x0d0d12);
    fg.rotation.x = Math.PI;
    fg.position.set(fx, -TH-0.020, 0);
    g.add(fg);
    mk(g, bx(0.126,0.024,0.126), sm(0x1a1a20,0.5,0.7), fx,-TH-0.020,0);
  }
  mk(g, cy(0.018,0.042,12), gl(0x2a2a32), -aioW*0.42, TH*0.9, -RD*0.30);
  mk(g, cy(0.018,0.042,12), gl(0x2a2a32), -aioW*0.42, TH*0.9,  RD*0.30);
  mk(g, bx(aioW*0.58, 0.006, 0.010), em(accent,0.9), 0, TH*1.0, RD*0.42);
  return g;
}

/* ── GPU water block (F1) ─────────────────────────────────────────────────── */
function gpuWB(gpuH, accent) {
  const g = new THREE.Group();
  mk(g, bx(0.040, gpuH*0.80, 0.080), sm(0x1a1820,0.75,0.28));
  mk(g, bx(0.038, gpuH*0.76, 0.076), em(accent,0.5), 0.001,0,0);
  mk(g, bx(0.040, gpuH*0.78, 0.010), gl(0x444450), 0,0, 0.036);
  mk(g, bx(0.040, gpuH*0.78, 0.010), gl(0x444450), 0,0,-0.036);
  mk(g, cy(0.012,0.028,10), gl(0x333340), 0, gpuH*0.36,0, 0,0,Math.PI/2);
  mk(g, cy(0.012,0.028,10), gl(0x333340), 0,-gpuH*0.36,0, 0,0,Math.PI/2);
  return g;
}

/* ── GPU ──────────────────────────────────────────────────────────────────── */
function buildGPU(t) {
  const {gpuH,gpuFans,gpuColor,accent,gpuL} = t;
  const g = new THREE.Group();
  const pcbTH = 0.020;

  mk(g, bx(pcbTH, gpuH, gpuL), sm(0x0a120a,0.12,0.90));
  // Backplate
  mk(g, bx(0.009, gpuH*0.96, gpuL*0.96), sm(gpuColor,0.88,0.15), -pcbTH*0.5-0.004,0,0);
  mk(g, bx(0.009, gpuH*0.038, gpuL*0.92), em(accent,0.9), -pcbTH*0.5-0.004, gpuH*0.44, 0);
  mk(g, bx(0.009, gpuH*0.09, gpuH*0.09), em(accent,1.1), -pcbTH*0.5-0.004, 0,-gpuL*0.10);
  // Heatsink base
  mk(g, bx(gpuH*0.31, gpuH*0.90, gpuL*0.90), sm(0x1e1e28,0.78,0.22), gpuH*0.155,0,0);
  // Fin stacks ×3 with heatpipes
  const finM = sm(0x262632,0.84,0.18);
  for (let s=0;s<3;s++) {
    const base = -gpuL*0.38 + s*(gpuL*0.34);
    for (let i=0;i<13;i++)
      mk(g, bx(gpuH*0.295, gpuH*0.88, 0.005), finM, gpuH*0.155,0, base+i*(gpuL*0.32/12));
    for (let p=0;p<4;p++) {
      const pz = base + gpuL*0.04 + p*gpuL*0.08;
      mk(g, cy(0.006, gpuH*0.92, 8), sm(0x909098,0.94,0.06), gpuH*0.20,0,pz, 0,0,Math.PI/2);
    }
  }
  // Shroud
  const shrM = sm(gpuColor,0.72,0.28);
  mk(g, bx(0.008, gpuH*0.96, gpuL*0.88), shrM, gpuH*0.425,0,0);
  for (let i=0;i<7;i++)
    mk(g, bx(0.010,0.007,gpuL*0.86), sm(0x040406,0.9,0.9), gpuH*0.425, gpuH*0.38-i*gpuH*0.13,0);
  // Fans
  const fanR = gpuH>0.58 ? 0.095 : gpuH>0.44 ? 0.084 : 0.074;
  const fanSp = gpuL*0.78/gpuFans;
  for (let i=0;i<gpuFans;i++) {
    const fz = -gpuL*0.32 + fanSp*0.5 + i*fanSp;
    mk(g, bx(0.014, gpuH*0.34, gpuH*0.34), shrM, gpuH*0.38,0,fz);
    const fg = fan(fanR,13,0x0b0b11);
    fg.rotation.z = -Math.PI/2;
    fg.position.set(gpuH*0.400,0,fz);
    g.add(fg);
    const rg = new THREE.Mesh(tr(fanR,0.006,6,28), em(accent,0.75));
    rg.rotation.z = Math.PI/2;
    rg.position.set(gpuH*0.41,0,fz);
    g.add(rg);
  }
  // Water block for F1
  if (t.customLoop) {
    const wb = gpuWB(gpuH, accent);
    wb.position.set(gpuH*0.40,0,-gpuL*0.05);
    g.add(wb);
  }
  // PCIe connector
  mk(g, bx(0.014,0.016,gpuL*0.19), sm(0x222228,0.5,0.8), 0,-gpuH*0.50,-gpuL*0.10);
  for (let i=0;i<8;i++)
    mk(g, bx(0.010,0.012,0.007), sm(0xddaa33,0.96,0.04), 0,-gpuH*0.50,-gpuL*0.17+i*0.011);
  // Power connector
  mk(g, bx(0.034,0.044,0.050), sm(0x1a1a1e,0.4,0.8), gpuH*0.10, gpuH*0.48, gpuL*0.36);
  mk(g, bx(0.022,0.038,0.040), sm(0x111114,0.3,0.9), gpuH*0.10, gpuH*0.53, gpuL*0.36);
  // Display outputs
  for (let i=0;i<4;i++)
    mk(g, bx(0.006,0.014,0.022), sm(0x1c1c22,0.5,0.7), pcbTH*0.5,-gpuH*0.38,-gpuL*0.44+i*0.028);

  return g;
}

/* ── Motherboard ──────────────────────────────────────────────────────────── */
function buildMobo(t) {
  const {H, D, ramCount, ramRgb, accent} = t;
  const g = new THREE.Group();
  const mH = H*0.72, mD = D*0.58, TH = 0.016;

  mk(g, bx(TH,mH,mD), sm(0x0a160a,0.10,0.92));
  for (let i=0;i<8;i++)
    mk(g, bx(TH*1.4,0.003,mD*0.85), em(0x003300,0.25), 0,-mH*0.45+i*mH*0.12,0);
  // VRM heatsink
  mk(g, bx(0.024,mH*0.09,mD*0.20), sm(0x1e1e28,0.76,0.26), 0.018,mH*0.28,-mD*0.32);
  for (let i=0;i<6;i++)
    mk(g, bx(0.020,mH*0.11,0.007), sm(0x2a2a34,0.82,0.18), 0.022,mH*0.28,-mD*0.40+i*0.012);
  mk(g, bx(0.024,0.034,mD*0.44), sm(0x1e1e28,0.76,0.26), 0.018,mH*0.36,-mD*0.14);
  // CPU socket
  mk(g, bx(0.020,mH*0.21,mH*0.21), sm(0x111a11,0.28,0.72), 0.016,mH*0.22,-mD*0.18);
  mk(g, bx(0.019,mH*0.16,mH*0.16), sm(0x8a8800,0.92,0.08), 0.018,mH*0.22,-mD*0.18);
  for (let r=0;r<5;r++) for (let c=0;c<5;c++)
    mk(g, bx(0.015,0.005,0.005), sm(0x997700,0.95,0.05),
       0.019, mH*0.22-mH*0.06+r*mH*0.030, -mD*0.21+c*0.020);
  // AIO pump head
  mk(g, cy(mH*0.082,0.042,18), sm(0x1a1a22,0.70,0.32), 0.038,mH*0.22,-mD*0.18, 0,0,Math.PI/2);
  mk(g, cy(mH*0.065,0.014,18), sm(accent,0.2,0.8),      0.052,mH*0.22,-mD*0.18, 0,0,Math.PI/2);
  const pr = new THREE.Mesh(tr(mH*0.076,0.006,6,28), em(accent,1.3));
  pr.rotation.z = Math.PI/2; pr.position.set(0.053,mH*0.22,-mD*0.18); g.add(pr);
  // Chipset heatsink
  mk(g, bx(0.026,0.058,mD*0.10), sm(0x1c1c26,0.70,0.32), 0.018,-mH*0.05,-mD*0.02);
  mk(g, bx(0.020,0.004,0.020), em(accent,0.65), 0.030,-mH*0.05,-mD*0.02);
  // RAM
  for (let i=0;i<ramCount;i++) {
    const rz = -mD*0.39 + i*(mD*0.065 + (ramCount>2?0:0.008));
    mk(g, bx(0.016,mH*0.005,mD*0.066), sm(0x0d0d12,0.5,0.7), 0.016,mH*0.17,rz);
    mk(g, bx(0.015,mH*0.28,mD*0.062), sm(0x0a0a12,0.44,0.62), 0.019,mH*0.30,rz);
    for (let c=0;c<5;c++)
      mk(g, bx(0.013,0.020,mD*0.005), sm(0x111118,0.62,0.40), 0.021,mH*0.28,rz-mD*0.025+c*mD*0.012);
    mk(g, bx(0.017,mH*0.042,mD*0.062), em(ramRgb,1.5), 0.019,mH*0.455,rz);
    mk(g, bx(0.017,mH*0.040,mD*0.060),
       new THREE.MeshPhysicalMaterial({color:new THREE.Color(ramRgb).multiplyScalar(0.25).getHex(),transparent:true,opacity:0.55,roughness:0.05,metalness:0}),
       0.020,mH*0.455,rz);
  }
  // PCIe slots
  mk(g, bx(0.016,0.012,mD*0.52), sm(0x080808,0.5,0.8), 0.016,-mH*0.10,mD*0.03);
  for (let i=1;i<3;i++)
    mk(g, bx(0.016,0.010,mD*0.30), sm(0x080808,0.5,0.8), 0.016,-mH*0.10-i*0.046,mD*0.03);
  // M.2 SSDs
  mk(g, bx(0.015,0.018,mD*0.20), sm(0x0c0c0a,0.5,0.72), 0.020,mH*0.07,-mD*0.10);
  mk(g, bx(0.015,0.018,mD*0.20), sm(0x0c0c0a,0.5,0.72), 0.020,-mH*0.20,mD*0.06);
  for (let c=0;c<3;c++) {
    mk(g, bx(0.013,0.014,mD*0.026), sm(0x1a1808,0.6,0.50), 0.022,mH*0.07,-mD*0.18+c*mD*0.066);
    mk(g, bx(0.013,0.014,mD*0.026), sm(0x1a1808,0.6,0.50), 0.022,-mH*0.20,mD*0.00+c*mD*0.066);
  }
  // 24-pin ATX
  mk(g, bx(0.016,0.038,mD*0.086), sm(0x111116,0.4,0.8), 0.026,mH*0.33,mD*0.40);
  for (let i=0;i<4;i++)
    mk(g, bx(0.005,0.028,mD*0.076), sm(0xccaa33,0.92,0.06), 0.032,mH*0.33,mD*0.38+i*mD*0.006);
  // SATA ports
  for (let i=0;i<4;i++)
    mk(g, bx(0.016,0.010,mD*0.030), sm(0x222228,0.5,0.7), 0.020,-mH*0.30+i*0.020,mD*0.38);
  // I/O shield
  mk(g, bx(0.016,mH*0.22,0.010), sm(0x1a1a1e,0.8,0.4), 0.016,mH*0.25,-mD*0.50);
  for (let i=0;i<3;i++)
    mk(g, bx(0.014,0.016,0.013), sm(0x333338,0.7,0.5), 0.024,mH*0.28-i*0.028,-mD*0.502);

  return g;
}

/* ── Custom water loop (F1) ───────────────────────────────────────────────── */
function buildLoop(t, g) {
  const {W,H,D,accent} = t;
  // Reservoir acrylic shell
  mk(g, cy(0.056,H*0.40,22),
     new THREE.MeshPhysicalMaterial({color:0x224444,transparent:true,opacity:0.18,roughness:0,transmission:0.90,side:THREE.DoubleSide}),
     W*0.26,H*0.08,D*0.14);
  // Coolant column
  mk(g, cy(0.044,H*0.37,20),
     new THREE.MeshStandardMaterial({color:0xff2200,transparent:true,opacity:0.72,emissive:0xff0f00,emissiveIntensity:0.85}),
     W*0.26,H*0.08,D*0.14);
  mk(g, cy(0.056,H*0.40,22), sm(0x141010,0.35,0.72), W*0.26,H*0.08,D*0.14);
  mk(g, cy(0.058,0.024,20), gl(0x222228), W*0.26,H*0.285,D*0.14);
  mk(g, cy(0.058,0.024,20), gl(0x222228), W*0.26,-H*0.115,D*0.14);
  mk(g, cy(0.018,0.036,12), sm(0x333338,0.72,0.28), W*0.26,H*0.306,D*0.14);
  // Pump
  mk(g, bx(0.090,0.072,0.078), sm(0x1a1214,0.72,0.32), W*0.26,-H*0.148,D*0.14);
  mk(g, cy(0.028,0.042,14), gl(0x2a2022), W*0.26,-H*0.190,D*0.14);

  const clearM = new THREE.MeshPhysicalMaterial({color:0xeeeeff,transparent:true,opacity:0.20,roughness:0.02,transmission:0.80,side:THREE.DoubleSide});
  const fluidM = new THREE.MeshStandardMaterial({color:0xff2000,transparent:true,opacity:0.60,emissive:0xff0800,emissiveIntensity:0.70});
  const fitM   = gl(0x282830);

  const tube = (pts) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,48,0.018,10), clearM));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,48,0.013,10), fluidM));
  };
  const fit = (px,py,pz) => mk(g, cy(0.022,0.034,12), fitM, px,py,pz);

  tube([[W*0.26,H*0.30,D*0.14],[W*0.26,H*0.40,D*0.14],[-W*0.02,H*0.40,D*0.14],[-W*0.02,H*0.40,-D*0.10]]);
  fit(W*0.26,H*0.30,D*0.14); fit(-W*0.02,H*0.40,-D*0.10);
  tube([[-W*0.02,H*0.42,-D*0.28],[-W*0.02,H*0.28,-D*0.28],[W*0.14,H*0.05,-D*0.22]]);
  fit(-W*0.02,H*0.42,-D*0.28); fit(W*0.14,H*0.05,-D*0.22);
  tube([[W*0.14,-H*0.19,-D*0.10],[W*0.22,-H*0.20,D*0.02],[W*0.26,-H*0.190,D*0.14]]);
  fit(W*0.14,-H*0.19,-D*0.10);

  const cl = new THREE.PointLight(0xff2200,4.0,H*1.4);
  cl.position.set(W*0.26,H*0.08,D*0.14); g.add(cl);
}

/* ── Cables ───────────────────────────────────────────────────────────────── */
function buildCables(t, g) {
  const {W,H,D} = t;
  const tb = (pts,r=0.010,col=0x111114) => {
    const c = new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c,16,r,6), sm(col,0.3,0.9)));
  };
  tb([[-W*0.10,-H*0.26,D*0.22],[-W*0.05,-H*0.22,D*0.26],[-W*0.00,H*0.16,D*0.28],[-W*0.00,H*0.33,D*0.28]],0.016,0x181818);
  tb([[-W*0.12,-H*0.25,D*0.20],[-W*0.08,-H*0.10,D*0.05],[-W*0.05,H*0.32,-D*0.10]],0.010,0x121212);
  for (let i=0;i<3;i++)
    tb([[-W*0.10,-H*0.24,D*0.18+i*0.03],[W*0.00,-H*0.20,D*0.10+i*0.02],[W*0.10,-H*0.15,-D*0.04]],0.009,[0x111114,0x0a0a0f,0x181818][i]);
  for (let i=0;i<2;i++)
    tb([[-W*0.14,-H*0.28,D*0.16+i*0.025],[-W*0.06,-H*0.30,D*0.12],[-W*0.02,-H*0.30,D*0.30]],0.007,0x100f12);
  tb([[-W*0.05,-H*0.15,D*0.34],[-W*0.04,-H*0.26,D*0.30],[-W*0.02,-H*0.35,D*0.25]],0.006,0x111118);
}

/* ── Main PC assembly ─────────────────────────────────────────────────────── */
function buildPC(t) {
  const g = new THREE.Group();
  const {W,H,D,caseColor,accent,accent2} = t;
  const TH = 0.036;
  const cM  = sm(caseColor,0.72,0.28);
  const frM = sm(new THREE.Color(caseColor).addScalar(0.038).getHex(),0.58,0.44);

  /* ── Panels ── */
  mk(g,bx(W,TH,D),cM, 0,-H/2,0);
  mk(g,bx(W,TH,D),cM, 0, H/2,0);
  mk(g,bx(TH,H,D),cM,-W/2,0,0);
  mk(g,bx(W,H,TH),cM, 0,0,-D/2);
  mk(g,bx(W,H,TH),frM,0,0, D/2);

  /* ── Front panel ── */
  const gM = sm(0x040506,0.88,0.88);
  for (let i=0;i<7;i++) mk(g,bx(W*0.54,0.009,0.006),gM,-W*0.03,H*0.12+i*H*0.060,D/2+0.026);
  for (let i=0;i<7;i++) mk(g,bx(0.009,H*0.40,0.006),gM,-W*0.22+i*W*0.095,H*0.25, D/2+0.026);
  mk(g,bx(W*0.68,0.052,0.009),sm(new THREE.Color(caseColor).addScalar(0.065).getHex(),0.55,0.52),0,H*0.445,D/2+0.019);
  mk(g,cy(0.023,0.018,18),sm(accent,0.30,0.62), W*0.25,H*0.445,D/2+0.027);
  mk(g,cy(0.016,0.022,18),em(accent,1.1),        W*0.25,H*0.445,D/2+0.029);
  mk(g,bx(0.038,0.020,0.010),sm(0x222228,0.6,0.7),-W*0.04, H*0.445,D/2+0.026);
  mk(g,bx(0.038,0.020,0.010),sm(0x222228,0.6,0.7),-W*0.095,H*0.445,D/2+0.026);
  mk(g,bx(0.022,0.012,0.009),sm(0x333338,0.6,0.7),-W*0.155,H*0.445,D/2+0.026);
  mk(g,cy(0.006,0.012,8),sm(0x00aa00,0.3,0.7),-W*0.215,H*0.445,D/2+0.026,Math.PI/2);
  mk(g,cy(0.006,0.012,8),sm(0xaa0000,0.3,0.7),-W*0.255,H*0.445,D/2+0.026,Math.PI/2);
  mk(g,bx(0.021,H*0.64,0.042),em(accent,2.2),W/2-0.042,0,D/2+0.016);
  for (let i=0;i<2;i++) {
    const ff = fan(0.064,11,0x0f0f14);
    ff.rotation.x = Math.PI/2;
    ff.position.set(-W*0.07,H*0.07-i*H*0.27,D/2-0.018);
    g.add(ff);
  }

  /* ── Top vents ── */
  for (let i=0;i<10;i++)
    mk(g,bx(W*0.72,0.005,0.011),sm(0x060607,0.9,0.85),0,H/2+0.001,-D*0.10+i*D*0.083);

  /* ── Rear ── */
  mk(g,bx(W*0.56,H*0.23,0.018),sm(0x080808,0.6,0.6),-W*0.04,H*0.27,-D/2+0.004);
  for (let i=0;i<7;i++) mk(g,bx(W*0.72,0.009,0.018),sm(0x1a1a1e,0.6,0.5),-W*0.02,H*0.05-i*0.026,-D/2+0.004);
  const rf = fan(0.060,11,0x0f0f14);
  rf.rotation.x = -Math.PI/2;
  rf.position.set(-W*0.05,H*0.29,-D/2+0.018); g.add(rf);
  mk(g,bx(W*0.54,H*0.155,0.018),sm(0x161618,0.7,0.52),-W*0.10,-H*0.42,-D/2+0.004);

  /* ── Tempered glass + frame ── */
  mk(g,bx(0.010,H-0.022,D-0.022),trn(0xaaccee,0.065),W/2+0.002,0,0);
  const fM2 = gl(new THREE.Color(caseColor).addScalar(0.14).getHex());
  mk(g,bx(0.015,H*1.001,0.016),fM2,W/2+0.001,0,-D/2+0.006);
  mk(g,bx(0.015,H*1.001,0.016),fM2,W/2+0.001,0, D/2-0.006);
  mk(g,bx(0.015,0.014,D),       fM2,W/2+0.001, H/2,0);
  mk(g,bx(0.015,0.014,D),       fM2,W/2+0.001,-H/2,0);

  /* ── PSU ── */
  mk(g,bx(W*0.54,H*0.134,D*0.28),sm(0x181818,0.72,0.44),-W*0.10,-H/2+H*0.068,D*0.28);
  mk(g,cy(0.044,H*0.10,18),sm(0x111114,0.5,0.7),-W*0.10,-H/2+H*0.068,D*0.28,0,0,Math.PI/2);
  for (let i=0;i<7;i++)
    mk(g,bx(W*0.48,0.005,0.006),sm(0x080808,0.9,0.9),-W*0.10,-H/2+H*0.10,D*0.12+i*0.022);
  mk(g,bx(W*0.46,H*0.068,0.006),sm(0x222228,0.5,0.8),-W*0.10,-H/2+H*0.068,D*0.42-0.003);

  /* ── Drive cage ── */
  mk(g,bx(W*0.30,H*0.18,D*0.20),sm(0x0f0f12,0.5,0.72),-W*0.24,-H*0.20,D*0.18);
  mk(g,bx(W*0.28,0.014,D*0.18), sm(0x141418,0.6,0.62),-W*0.24,-H*0.20,D*0.18);

  /* ── Feet ── */
  const fM = sm(0x0b0b0b,0.18,0.96);
  for (const [fx,fz] of [[-W*0.34,D*0.38],[W*0.34,D*0.38],[-W*0.34,-D*0.38],[W*0.34,-D*0.38]])
    mk(g,bx(0.060,0.028,0.060),fM,fx,-H/2-0.014,fz);

  /* ── ARGB strips ── */
  const s1=em(accent,2.5), s2=em(accent2,1.4);
  mk(g,bx(0.006,0.006,D*0.90),s1,W/2-0.048, H/2-0.048,0);
  mk(g,bx(0.006,0.006,D*0.90),s1,W/2-0.048,-H/2+0.048,0);
  mk(g,bx(0.006,H*0.90,0.006),s1,W/2-0.048,0, D/2-0.048);
  mk(g,bx(0.006,H*0.90,0.006),s2,W/2-0.048,0,-D/2+0.055);
  mk(g,bx(W*0.90,0.006,0.006),s1,0,-H/2+0.018, D/2-0.055);
  mk(g,bx(W*0.90,0.006,0.006),s2,0,-H/2+0.018,-D/2+0.060);

  /* ── Components ── */
  const mobo = buildMobo(t);
  mobo.position.set(-W*0.038,H*0.022,-D*0.080); g.add(mobo);

  const gpu = buildGPU(t);
  gpu.position.set(W*0.145,-H*0.100,-D*0.058); g.add(gpu);

  const aio = buildAIO(t.aioW,t.aioFans,accent);
  aio.position.set(-W*0.048,H/2-TH*3.4,-D*0.140); g.add(aio);

  /* ── Cooling tubes ── */
  if (!t.customLoop) {
    const tubeM = sm(0x26262e,0.30,0.80);
    [
      [[-W*0.048-t.aioW*0.43,H/2-TH*3.0,-D*0.29],[W*0.04,H*0.22,-D*0.24],[-W*0.02,H*0.24,-D*0.18]],
      [[-W*0.048-t.aioW*0.43+0.028,H/2-TH*3.0,-D*0.29],[W*0.06,H*0.26,-D*0.22],[-W*0.01,H*0.27,-D*0.15]],
    ].forEach(pts=>{
      const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(c,28,0.013,8),tubeM));
    });
  } else {
    buildLoop(t,g);
  }
  buildCables(t,g);

  /* ── Interior point lights ── */
  const il=(col,int,dist,x,y,z)=>{const l=new THREE.PointLight(col,int,dist);l.position.set(x,y,z);g.add(l);};
  il(accent, 3.8,H*2.4, W/2-0.11,    0,        0);
  il(accent, 2.2,H*1.6, W/2-0.10,    H*0.46,   D*0.22);
  il(accent, 2.0,H*1.3, W/2-0.10,   -H*0.46,   0);
  il(accent, 2.8,H*0.95,W*0.22,     -H*0.10,  -D*0.06);
  il(accent, 2.0,H*0.55,W*0.02,      H*0.37,  -D*0.28);
  il(accent, 1.6,H*0.85,W*0.58,      0,         D*0.45);
  il(accent, 1.4,H*0.55,0,          -H/2-0.04, D*0.10);
  il(0x8899ff,1.1,H*0.80,-W*0.048,   H*0.46,  -D*0.14);
  il(accent2, 0.9,H*1.20,-W*0.30,    H*0.00,   D*0.10);

  return g;
}

/* ── Public entry point ───────────────────────────────────────────────────── */
export function initPCViewer(canvasId, tierId) {
  const t = TIERS[tierId];
  if (!t) return;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40,1,0.1,100);
  camera.position.set(t.W*3.9,t.H*0.68,t.D*3.6);
  camera.lookAt(0,t.H*0.05,0);

  const controls = new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true; controls.dampingFactor=0.055;
  controls.autoRotate=true;    controls.autoRotateSpeed=0.55;
  controls.enableZoom=false;   controls.enablePan=false;
  controls.minPolarAngle=Math.PI*0.18;
  controls.maxPolarAngle=Math.PI*0.52;

  /* ── Scene lights ── */
  scene.add(new THREE.AmbientLight(0xffffff,0.16));

  const key=new THREE.DirectionalLight(0xfff5ee,1.90);
  key.position.set(6,9,7); key.castShadow=true;
  key.shadow.mapSize.set(1024,1024); scene.add(key);

  const fill=new THREE.DirectionalLight(0x8090cc,0.52);
  fill.position.set(-6,3,-3); scene.add(fill);

  const rim=new THREE.DirectionalLight(0xffffff,0.80);
  rim.position.set(3,-4,-7); scene.add(rim);

  const acRim=new THREE.DirectionalLight(new THREE.Color(t.accent),0.58);
  acRim.position.set(-4,1,5); scene.add(acRim);

  const spot=new THREE.SpotLight(0xffeedd,1.1,t.H*14,Math.PI*0.18,0.4);
  spot.position.set(0,t.H*4,t.D*1.6); scene.add(spot);

  scene.add(new THREE.DirectionalLight(0x1a0a3a,0.28).position.set(0,-5,0)&&new THREE.DirectionalLight(0x1a0a3a,0.28));

  /* ── Floor ── */
  const floor=new THREE.Mesh(
    new THREE.CircleGeometry(t.H*2.2,72),
    new THREE.MeshStandardMaterial({color:0x080809,metalness:0.62,roughness:0.40})
  );
  floor.rotation.x=-Math.PI/2; floor.position.y=-t.H/2-0.028;
  floor.receiveShadow=true; scene.add(floor);

  const fg=new THREE.PointLight(t.accent,1.2,t.H*1.8);
  fg.position.set(0,-t.H*0.56,0); scene.add(fg);

  scene.add(buildPC(t));

  function resize(){
    const w=canvas.offsetWidth,h=canvas.offsetHeight;
    if(!w||!h) return;
    renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);
  canvas.addEventListener('pointerdown',()=>{controls.autoRotate=false;});

  (function loop(){
    requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene,camera);
  })();
}
