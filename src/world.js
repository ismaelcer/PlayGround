import * as THREE from "three";

const srgb = (hex) => new THREE.Color(hex);
const textile = (texture, repeatX = 1, repeatY = 1) => {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

function canvasTexture(w, h, draw, { repeatX = 1, repeatY = 1, smooth = true } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4;
  if (!smooth) tex.magFilter = THREE.NearestFilter;
  return tex;
}

function rng(seed = 913) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function asphaltTexture() {
  const r = rng(42);
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#171e23";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2100; i++) {
      const v = 18 + Math.floor(r() * 24);
      ctx.fillStyle = `rgba(${v},${v + 5},${v + 7},${0.18 + r() * 0.4})`;
      const s = r() > 0.92 ? 3 : 1;
      ctx.fillRect(r() * w, r() * h, s, s);
    }
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = `rgba(4,8,10,${0.1 + r() * 0.25})`;
      ctx.lineWidth = 1 + r() * 2;
      ctx.beginPath();
      const x = r() * w;
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + r() * 30 - 15, h * 0.3, x + r() * 40 - 20, h * 0.7, x + r() * 20 - 10, h);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(218,195,145,.08)";
    ctx.lineWidth = 7;
    ctx.setLineDash([34, 26]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
  }, { repeatX: 2, repeatY: 17 });
}

function brickTexture(base = "#202f35", mortar = "#0f191e", brick = "#2a3c42") {
  const r = rng(170 + base.length);
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, w, h);
    const bw = 64;
    const bh = 25;
    for (let row = 0; row < 11; row++) {
      const off = row % 2 ? -bw / 2 : 0;
      for (let col = -1; col < 5; col++) {
        const x = col * bw + off;
        const shade = 0.8 + r() * 0.42;
        ctx.fillStyle = base;
        ctx.fillRect(x + 2, row * bh + 2, bw - 4, bh - 4);
        ctx.fillStyle = brick;
        ctx.globalAlpha = 0.42 * shade;
        ctx.fillRect(x + 4, row * bh + 4, bw - 8, bh - 9);
        ctx.globalAlpha = 1;
      }
    }
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = `rgba(4,8,10,${0.08 + r() * 0.16})`;
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
  }, { repeatX: 2, repeatY: 3 });
}

function concreteTexture(base = "#233139") {
  const r = rng(540);
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const a = 0.03 + r() * 0.12;
      ctx.fillStyle = r() > 0.5 ? `rgba(235,224,195,${a})` : `rgba(4,10,12,${a * 1.5})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 3);
    }
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = "rgba(5,10,12,.22)";
      ctx.beginPath();
      ctx.moveTo(r() * w, 0);
      ctx.lineTo(r() * w, h);
      ctx.stroke();
    }
  }, { repeatX: 2, repeatY: 4 });
}

function sidewalkTexture() {
  const r = rng(330);
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#28363b";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#111d21";
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    for (let i = 0; i < 360; i++) {
      const v = 30 + r() * 32;
      ctx.fillStyle = `rgba(${v},${v + 6},${v + 8},${0.08 + r() * 0.2})`;
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
  }, { repeatX: 1.5, repeatY: 42 });
}

function posterTexture(lines, accent = "#e65b3c") {
  return canvasTexture(256, 360, (ctx, w, h) => {
    ctx.fillStyle = "#e5d9bd";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1b2a31";
    ctx.fillRect(0, 0, w, 72);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(w / 2, 116, 61, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e5d9bd";
    ctx.font = "900 82px Anton, Arial Black, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", w / 2, 146);
    ctx.fillStyle = "#1b2a31";
    ctx.font = "900 32px Anton, Arial Black, sans-serif";
    ctx.fillText(lines[0], w / 2, 222);
    ctx.font = "700 21px 'Barlow Condensed', Arial, sans-serif";
    ctx.fillText(lines[1], w / 2, 254);
    ctx.fillStyle = accent;
    ctx.fillRect(28, 284, w - 56, 8);
    ctx.fillStyle = "#1b2a31";
    ctx.font = "700 17px 'Barlow Condensed', Arial, sans-serif";
    ctx.fillText(lines[2] || "DISTRITO 9 · DPD", w / 2, 324);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#151c1f";
    for (let i = 0; i < 85; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  });
}

function graffitiTexture(text, color = "#e95b39", size = 150) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 512, 256);
  ctx.font = `900 ${size}px Anton, Arial Black, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 11;
  ctx.strokeStyle = "rgba(6,14,18,.72)";
  ctx.strokeText(text, 256, 130);
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 130);
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = "#e2d4b7";
  ctx.font = "700 18px 'Barlow Condensed', Arial, sans-serif";
  ctx.fillText("D9 CREW · 23:47", 262, 210);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function neonTexture(text, color = "#ff7747", { vertical = false, small = "" } = {}) {
  const canvas = document.createElement("canvas");
  const chars = text.split("");
  canvas.width = vertical ? 256 : 1024;
  canvas.height = vertical ? Math.max(320, chars.length * 150) : 320;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (vertical) {
    ctx.font = "400 120px Anton, Arial Black, sans-serif";
    chars.forEach((c, i) => {
      const y = 90 + i * 142;
      ctx.shadowColor = color;
      ctx.shadowBlur = 32;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeText(c, 128, y);
      ctx.fillStyle = "#fff4d9";
      ctx.fillText(c, 128, y);
    });
  } else {
    ctx.font = "400 176px Anton, Arial Black, sans-serif";
    ctx.shadowColor = color;
    ctx.shadowBlur = 38;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.strokeText(text, 512, 134);
    ctx.fillStyle = "#fff5dc";
    ctx.fillText(text, 512, 134);
    if (small) {
      ctx.font = "700 35px 'Barlow Condensed', Arial, sans-serif";
      ctx.shadowBlur = 14;
      ctx.fillStyle = color;
      ctx.fillText(small, 512, 246);
    }
  }
  ctx.shadowBlur = 0;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function radialTexture(inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(0.28, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function skyTexture() {
  const r = rng(88);
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#050c15");
    g.addColorStop(0.48, "#0b1b28");
    g.addColorStop(0.74, "#17303c");
    g.addColorStop(1, "#3d2a29");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 95; i++) {
      ctx.fillStyle = `rgba(215,231,228,${0.14 + r() * 0.48})`;
      ctx.fillRect(r() * w, r() * h * 0.52, r() > 0.86 ? 2 : 1, r() > 0.86 ? 2 : 1);
    }
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = r() > 0.5 ? "#f2a262" : "#64b9bd";
      const bw = 18 + r() * 45;
      ctx.fillRect(r() * w, h * (0.48 + r() * 0.2), bw, 1);
    }
  }, { smooth: true });
}

function mergeStaticGeometry(root, hittables, isDynamic) {
  root.updateMatrixWorld(true);
  const hitSet = new Set(hittables);
  const buckets = new Map();
  const sources = [];
  const seen = new Set();

  root.traverse((obj) => {
    if (!obj.isMesh || obj.isInstancedMesh || obj.isSkinnedMesh) return;
    if (seen.has(obj) || isDynamic(obj)) return;
    const material = obj.material;
    if (!material || Array.isArray(material)) return;
    if (material.transparent || material.opacity < 1) return;
    seen.add(obj);
    sources.push(obj);
    const key = material.map
      ? `${material.uuid}`
      : `${material.type}:${material.color ? material.color.getHex() : 0}:${material.emissive ? material.emissive.getHex() : 0}:${material.fog === false ? 1 : 0}:${material.opacity}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material, items: [], hit: false };
      buckets.set(key, bucket);
    }
    bucket.items.push(obj);
    if (hitSet.has(obj)) bucket.hit = true;
  });

  const mergedMeshes = [];
  const removed = new Set();
  for (const bucket of buckets.values()) {
    if (bucket.items.length < 2) continue;
    const geometries = [];
    let vertexCount = 0;
    for (const mesh of bucket.items) {
      let geo = mesh.geometry;
      geo = geo.index ? geo.toNonIndexed() : geo.clone();
      geo.applyMatrix4(mesh.matrixWorld);
      geometries.push(geo);
      vertexCount += geo.attributes.position.count;
    }
    const merged = new THREE.BufferGeometry();
    for (const name of ["position", "normal", "uv"]) {
      if (!geometries.every((g) => g.attributes[name])) continue;
      const itemSize = geometries[0].attributes[name].itemSize;
      const array = new Float32Array(vertexCount * itemSize);
      let offset = 0;
      for (const g of geometries) {
        array.set(g.attributes[name].array, offset);
        offset += g.attributes[name].array.length;
      }
      merged.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
    }
    merged.computeBoundingSphere();
    merged.computeBoundingBox();
    const mesh = new THREE.Mesh(merged, bucket.material);
    mesh.matrixAutoUpdate = false;
    mesh.userData.staticMerge = true;
    root.add(mesh);
    mergedMeshes.push(mesh);
    if (bucket.hit) mesh.userData.hit = true;
    for (const src of bucket.items) {
      src.parent?.remove(src);
      removed.add(src);
      src.geometry.dispose();
    }
    for (const g of geometries) g.dispose();
  }

  if (removed.size) {
    const kept = hittables.filter((mesh) => !removed.has(mesh));
    for (const mesh of mergedMeshes) if (mesh.userData.hit) kept.push(mesh);
    hittables.length = 0;
    hittables.push(...kept);
  }
  return mergedMeshes.length;
}

export function buildWorld(scene) {
  const world = new THREE.Group();
  world.name = "district-9";
  scene.add(world);

  const hittables = [];
  const animatedLights = [];
  const neon = [];
  const lampGroups = [];
  const policeLights = [];
  const glows = [];
  const tmp = new THREE.Vector3();

  scene.background = new THREE.Color(0x07141d);
  scene.fog = new THREE.FogExp2(0x0c1e27, 0.0112);

  const asphalt = new THREE.MeshPhongMaterial({
    map: asphaltTexture(),
    color: 0xa4adb0,
    emissive: 0x080e11,
    specular: 0x2a414c,
    shininess: 24,
  });
  const sidewalkMat = new THREE.MeshLambertMaterial({ map: sidewalkTexture(), color: 0x9aa7a7, emissive: 0x0a1215 });
  const brickA = new THREE.MeshLambertMaterial({ map: brickTexture("#202f35", "#0e191e", "#2b3c42"), color: 0xa8b3b1, emissive: 0x071319 });
  const brickB = new THREE.MeshLambertMaterial({ map: brickTexture("#253139", "#11191d", "#303b3e"), color: 0x9ba1a0, emissive: 0x081318 });
  const concrete = new THREE.MeshLambertMaterial({ map: concreteTexture("#25343c"), color: 0xb0b6b2, emissive: 0x08141a });
  const concreteDark = new THREE.MeshLambertMaterial({ map: concreteTexture("#1b282e"), color: 0x7f8b8b, emissive: 0x071016 });
  const iron = new THREE.MeshLambertMaterial({ color: 0x182329 });
  const ironLight = new THREE.MeshLambertMaterial({ color: 0x2d3b3e });
  const wood = new THREE.MeshLambertMaterial({ color: 0x493426 });
  const woodLight = new THREE.MeshLambertMaterial({ color: 0x71533a });
  const glassDark = new THREE.MeshLambertMaterial({ color: 0x0a161d, emissive: 0x071016 });
  const paperMat = new THREE.MeshBasicMaterial({ color: 0xf0e3c3 });
  const glowTex = radialTexture("rgba(255,255,255,.95)", "rgba(255,255,255,0)");
  const lightPoolTex = radialTexture("rgba(255,255,255,.75)", "rgba(255,255,255,0)");

  const addBox = (w, h, d, material, x, y, z, { hit = false, rotY = 0, parent = world } = {}) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    parent.add(mesh);
    if (hit) hittables.push(mesh);
    return mesh;
  };

  const addPlane = (w, h, material, x, y, z, { rotY = 0, rotX = 0, parent = world, hit = false } = {}) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotX, rotY, 0);
    parent.add(mesh);
    if (hit) hittables.push(mesh);
    return mesh;
  };

  // ---------- skyline and moon ----------
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(190, 80),
    new THREE.MeshBasicMaterial({ map: skyTexture(), fog: false, depthWrite: false })
  );
  sky.position.set(0, 36, -118);
  world.add(sky);

  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xf4e5c0,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }));
  moonGlow.scale.set(20, 20, 1);
  moonGlow.position.set(12, 26, -112);
  world.add(moonGlow);

  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(2.3, 20),
    new THREE.MeshBasicMaterial({ color: 0xf6e6c2, fog: false })
  );
  moon.position.set(12, 26, -111.8);
  world.add(moon);

  for (let i = 0; i < 20; i++) {
    const r = rng(i * 17 + 4);
    const w = 3 + r() * 9;
    const h = 8 + r() * 25;
    addBox(w, h, 3, new THREE.MeshBasicMaterial({
      color: r() > 0.55 ? 0x0a171e : 0x0d1c22,
      fog: false,
    }), -55 + i * 6, h / 2 - 1, -102 - r() * 9);
  }

  // ---------- street ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 154), asphalt);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -44);
  world.add(ground);
  hittables.push(ground);

  addBox(1.55, 0.16, 154, sidewalkMat, -5.35, 0.08, -44, { hit: true });
  addBox(1.55, 0.16, 154, sidewalkMat, 5.35, 0.08, -44, { hit: true });
  addBox(0.22, 0.3, 154, concreteDark, -4.55, 0.15, -44, { hit: true });
  addBox(0.22, 0.3, 154, concreteDark, 4.55, 0.15, -44, { hit: true });

  // Manhole covers and drain grates
  const manholeMat = new THREE.MeshLambertMaterial({ color: 0x182126, emissive: 0x020708 });
  for (const [x, z] of [[0.5, 5], [-1.4, -21], [2.1, -44], [-0.2, -67]]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.035, 16), manholeMat);
    m.position.set(x, 0.018, z);
    world.add(m);
  }

  // Puddles with colored spill light
  const puddles = [
    [-2.8, 2, 2.5, 0.28, 0xf36d38],
    [3.2, -12, 1.7, 0.22, 0x49c7c2],
    [-0.6, -31, 2.8, 0.24, 0xf0a642],
    [2.8, -50, 2.1, 0.26, 0xda4c37],
    [-2.4, -74, 2.6, 0.32, 0xefb249],
  ];
  for (const [x, z, size, opacity, color] of puddles) {
    const mat = new THREE.MeshBasicMaterial({
      map: lightPoolTex,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 1.8), mat);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, 0.012, z);
    world.add(p);
    glows.push({ mesh: p, base: opacity, speed: 0.27 + Math.random() * 0.2 });
  }

  // ---------- buildings ----------
  const buildingSeeds = [];
  for (let i = 0; i < 15; i++) {
    buildingSeeds.push({ z: 19 - i * 8, lh: 7.5 + ((i * 13) % 40) / 8, rh: 8 + ((i * 19) % 44) / 8 });
  }

  let windowIndex = 0;
  const windowInstances = [];
  const frameInstances = [];
  for (const [side, label] of [[-1, "left"], [1, "right"]]) {
    for (let i = 0; i < buildingSeeds.length; i++) {
      const block = buildingSeeds[i];
      const h = side < 0 ? block.lh : block.rh;
      const wallMat = i % 3 === 0 ? concrete : i % 2 === 0 ? brickA : brickB;
      addBox(6, h, 7.45, wallMat, side * 9.1, h / 2, block.z, { hit: true });
      addBox(6.55, 0.35, 7.7, concreteDark, side * 9.1, h + 0.16, block.z, { hit: true });
      // roof clutter silhouettes
      if (i % 2 === 0) {
        addBox(1.3, 0.8, 1.1, iron, side * 8.2, h + 0.6, block.z - 1.6);
        addBox(0.8, 0.4, 0.6, ironLight, side * 8.2, h + 1.2, block.z - 1.6);
      }

      // windows, front face (instanced after the loop for mobile draw-call budget)
      const wx = side * 6.06;
      for (let floor = 0; floor < 3; floor++) {
        const wy = 3.1 + floor * 2.65;
        if (wy > h - 1.2) break;
        for (let col = -1; col <= 1; col += 2) {
          const wz = block.z + col * 1.65;
          const lit = (windowIndex++ * 37) % 5 < 2;
          const color = lit ? (windowIndex % 3 === 0 ? 0xefbd77 : 0x7ea9a8) : 0x061016;
          windowInstances.push({
            x: wx + side * 0.012,
            y: wy,
            z: wz,
            rotY: side < 0 ? Math.PI / 2 : -Math.PI / 2,
            color,
          });
          frameInstances.push({
            x: wx + side * 0.03,
            y: wy,
            z: wz,
            rotY: 0,
          });
        }
      }

      // ac units / pipes / balconies
      if (i % 3 === 1) {
        addBox(0.42, 0.9, 1.25, ironLight, side * 6.29, 4.6, block.z + 2.3);
        addBox(0.35, 0.55, 0.35, iron, side * 6.26, 3.9, block.z + 2.28);
      }
      if (i % 4 === 2) {
        const rail = new THREE.Group();
        rail.position.set(side * 6.15, 4.4, block.z);
        for (let r = 0; r < 5; r++) addBox(0.05, 0.85, 0.05, iron, side * 0.22, 0, r * 0.42 - 0.84, { parent: rail });
        addBox(0.05, 0.05, 2.1, iron, side * 0.22, 0.42, 0, { parent: rail });
        addBox(1.05, 0.1, 2.55, ironLight, side * 0.12, -0.15, 0, { parent: rail, hit: true });
        world.add(rail);
      }
    }
  }

  // two instanced meshes instead of hundreds of window/frame draw calls
  {
    const dummy = new THREE.Object3D();
    const winColor = new THREE.Color();
    const winMesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1.02, 1.35),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      windowInstances.length
    );
    windowInstances.forEach((w, i) => {
      dummy.position.set(w.x, w.y, w.z);
      dummy.rotation.set(0, w.rotY, 0);
      dummy.updateMatrix();
      winMesh.setMatrixAt(i, dummy.matrix);
      winMesh.setColorAt(i, winColor.setHex(w.color));
    });
    winMesh.instanceMatrix.needsUpdate = true;
    if (winMesh.instanceColor) winMesh.instanceColor.needsUpdate = true;
    world.add(winMesh);

    const frameMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.08, 1.48, 1.15),
      iron,
      frameInstances.length
    );
    frameInstances.forEach((f, i) => {
      dummy.position.set(f.x, f.y, f.z);
      dummy.rotation.set(0, f.rotY, 0);
      dummy.updateMatrix();
      frameMesh.setMatrixAt(i, dummy.matrix);
    });
    frameMesh.instanceMatrix.needsUpdate = true;
    world.add(frameMesh);
  }

  // fire escape on the left
  const escape = new THREE.Group();
  escape.position.set(-6.05, 0, 5.3);
  for (let level = 0; level < 3; level++) {
    const y = 3.4 + level * 2.2;
    addBox(1.15, 0.1, 3.2, ironLight, 0.45, y, 0, { parent: escape, hit: true });
    addBox(0.05, 0.82, 3.2, iron, 1.02, y + 0.42, 0, { parent: escape });
    for (let r = 0; r < 8; r++) addBox(0.05, 0.82, 0.05, iron, 1.02, y + 0.42, -1.5 + r * 0.43, { parent: escape });
    addBox(0.52, 0.08, 0.1, iron, 0.65, y + 0.8, 1.1, { parent: escape });
    if (level < 2) {
      const ladder = addBox(0.08, 2.2, 0.42, iron, 0.72, y + 1.1, 0.4, { parent: escape });
      ladder.rotation.x = -0.3;
    }
  }
  world.add(escape);

  // wall doors
  const doorLights = [];
  const doorAt = (side, z, color = 0xd95232) => {
    const x = side * 6.075;
    const rotY = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    addBox(1.7, 2.48, 0.14, iron, side * 6.12, 1.24, z);
    addPlane(1.36, 2.14, new THREE.MeshBasicMaterial({ color: 0x0b151a }), x, 1.16, z, { rotY });
    addBox(0.1, 0.1, 0.3, new THREE.MeshBasicMaterial({ color: 0xf0ae5a }), side * 6.0, 1.1, z + 0.64);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 8, 6),
      new THREE.MeshBasicMaterial({ color })
    );
    bulb.position.set(side * 5.84, 2.58, z);
    world.add(bulb);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex,
      color,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    glow.scale.set(1.8, 1.8, 1);
    glow.position.copy(bulb.position);
    world.add(glow);
    doorLights.push({ glow, light: null, phase: Math.random() * 7 });
  };
  doorAt(-1, 8.3, 0xf0783d);
  doorAt(1, -4.2, 0xd44d34);
  doorAt(-1, -27.5, 0xe89c48);
  doorAt(1, -55.2, 0x56c9c2);
  doorAt(-1, -72.8, 0xde5c38);

  // concrete loading dock
  addBox(3.5, 1.1, 7.8, concreteDark, 4.1, 0.55, -20.4, { hit: true });
  addBox(3.8, 0.22, 8.1, concrete, 4.1, 1.16, -20.4, { hit: true });
  addBox(0.2, 1.1, 7.8, wood, 5.82, 0.55, -20.4);
  addBox(0.22, 2.7, 0.22, iron, 2.4, 1.35, -16.6, { hit: true });
  addBox(0.22, 2.7, 0.22, iron, 2.4, 1.35, -24.2, { hit: true });
  addBox(3.8, 0.22, 0.25, iron, 4.1, 2.7, -16.6, { hit: true });
  addBox(3.8, 0.22, 0.25, iron, 4.1, 2.7, -24.2, { hit: true });

  // crates
  const crate = (x, y, z, s = 1, rot = 0, hit = true) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rot;
    addBox(s, s, s, wood, 0, s / 2, 0, { parent: g, hit });
    addBox(s * 1.01, 0.09, s * 0.14, woodLight, 0, s * 0.83, 0, { parent: g });
    addBox(s * 0.14, s * 0.12, s * 1.01, woodLight, 0, s * 0.16, 0, { parent: g });
    addBox(0.1, s, 0.1, woodLight, -s * 0.43, s / 2, s * 0.46, { parent: g });
    world.add(g);
  };
  crate(3.6, 0, -18.2, 1.05, 0.1);
  crate(3.1, 0, -17.1, 0.86, -0.2);
  crate(3.25, 1.08, -18, 0.74, 0.2);
  crate(-3.5, 0, -34.2, 1.1, -0.18);
  crate(-3.4, 1.1, -34.1, 0.72, 0.25);
  crate(3.7, 0, -61.5, 1.2, 0.18);
  crate(-3.6, 0, -80.5, 1.1, 0);
  crate(-2.65, 0, -80, 0.82, 0.25);

  // dumpsters
  const dumpster = (x, z, rot = 0) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    addBox(1.9, 1.15, 1.08, ironLight, 0, 0.69, 0, { parent: g, hit: true });
    const lid = addBox(1.94, 0.13, 1.12, iron, 0, 1.32, -0.08, { parent: g });
    lid.rotation.x = -0.18;
    for (const wx of [-0.72, 0.72]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 8), iron);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.13, 0.48);
      g.add(wheel);
    }
    const stripe = addBox(1.91, 0.24, 1.09, new THREE.MeshLambertMaterial({ color: 0xb74d39 }), 0, 0.72, 0.552, { parent: g });
    stripe.scale.z = 0.02;
    world.add(g);
  };
  dumpster(-4.35, -7.6, 0.08);
  dumpster(4.1, -47.8, -0.08);
  dumpster(-4.2, -59, 0.03);

  // barrels and trash
  const barrel = (x, z, color = 0x39565b) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 1.0, 10), new THREE.MeshLambertMaterial({ color }));
    m.position.set(x, 0.5, z);
    world.add(m);
    hittables.push(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 5, 12), iron);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.63, z);
    world.add(ring);
  };
  barrel(-4.2, -19.3);
  barrel(-3.72, -20.1, 0x5d4933);
  barrel(4.16, -31, 0x324c4e);

  const bagMat = new THREE.MeshLambertMaterial({ color: 0x101b20 });
  for (let i = 0; i < 11; i++) {
    const r = 0.22 + Math.random() * 0.2;
    const bag = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), bagMat);
    bag.scale.set(1.2, 0.7, 0.9);
    bag.position.set(-4.75 + Math.random() * 0.7, r * 0.5, -12 - i * 1.07);
    world.add(bag);
  }

  // ---------- signage ----------
  const addNeon = (text, color, x, y, z, { vertical = false, width = 3.2, side = -1, small = "" } = {}) => {
    const tex = neonTexture(text, `#${new THREE.Color(color).getHexString()}`, { vertical, small });
    const aspect = tex.image.width / tex.image.height;
    const h = width / aspect;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, h), mat);
    plane.position.set(x, y, z);
    plane.rotation.y = side < 0 ? Math.PI / 2 : side > 0 ? -Math.PI / 2 : 0;
    world.add(plane);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex,
      color,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }));
    glow.scale.set(width * 1.5, h * 1.7, 1);
    glow.position.set(x + side * 0.18, y, z);
    world.add(glow);
    neon.push({ plane, glow, mat, base: 0.88, phase: Math.random() * 8 });
    return plane;
  };

  addNeon("MOTEL", 0xf26b3c, -6.01, 5.5, 6.1, { vertical: true, width: 1.9 });
  addNeon("24 HRS", 0x49c8c4, 6.01, 5.1, -2.5, { width: 2.8, side: 1, small: "ABIERTO" });
  addNeon("ALMACÉN", 0xe6a141, 6.01, 4.9, -20.8, { width: 3.7, side: 1 });
  addNeon("EMPEÑO", 0xd95d42, -6.01, 4.7, -35.9, { width: 3.2 });
  addNeon("CERRADO", 0xd8553b, 6.01, 3.5, -55.2, { width: 2.4, side: 1 });
  addNeon("BANCO", 0xf4b942, 0, 10.4, -90.83, { width: 7.8, side: 0, small: "CENTRAL · DISTRITO 9" });
  addNeon("POLICÍA", 0x69b7dd, -6.01, 5.4, -67.1, { width: 3.2 });
  addNeon("NO SALIDA", 0xe55238, 6.01, 3.4, -67.8, { width: 3.4, side: 1 });

  // projecting blade signs catch the eye from the starting rail position
  const addBladeSign = (text, color, side, z, y, width, small = "") => {
    const tex = neonTexture(text, `#${new THREE.Color(color).getHexString()}`, { small });
    const aspect = tex.image.width / tex.image.height;
    const height = width / aspect;
    const group = new THREE.Group();
    group.position.set(side * 5.71, y, z);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    plane.position.z = 0.02;
    group.add(plane);
    addBox(width + 0.16, height + 0.14, 0.08, iron, 0, 0, -0.06, { parent: group });
    addBox(0.42, 0.06, 0.06, iron, side * 0.22, height * 0.46, -0.1, { parent: group });
    addBox(0.42, 0.06, 0.06, iron, side * 0.22, -height * 0.46, -0.1, { parent: group });
    group.position.x += side * 0.12;
    world.add(group);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex,
      color,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }));
    glow.scale.set(width * 1.25, height * 2.2, 1);
    glow.position.set(group.position.x, y, z + 0.05);
    world.add(glow);
    neon.push({ plane, glow, mat, base: 0.93, phase: Math.random() * 8 });
  };
  addBladeSign("MOTEL AZUL", 0xf47042, -1, -0.8, 4.75, 3.4, "ABIERTO 24 H");
  addBladeSign("EMPEÑO", 0xefb144, 1, -10.4, 4.3, 2.8);
  addBladeSign("BANCO", 0x5acacb, 1, -33.8, 4.5, 2.6, "CENTRAL");

  // overhead district marker
  const districtTex = neonTexture("DISTRITO 9", "#e7c483", { small: "ZONA DE ALTO RIESGO" });
  const districtMat = new THREE.MeshBasicMaterial({
    map: districtTex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const districtSign = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.5), districtMat);
  districtSign.position.set(0.2, 5.95, -8.8);
  world.add(districtSign);
  const districtGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xe7c483,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  districtGlow.scale.set(5.8, 2.7, 1);
  districtGlow.position.set(0.2, 5.95, -8.7);
  world.add(districtGlow);
  neon.push({ plane: districtSign, glow: districtGlow, mat: districtMat, base: 0.9, phase: 2 });

  // glowing bank light
  const bankGlow = new THREE.PointLight(0xf2b144, 20, 20, 2);
  bankGlow.position.set(0, 8, -86);
  world.add(bankGlow);

  // graffiti
  const graffiti = (text, x, y, z, side, width = 4.2, color = "#e95b39") => {
    const tex = graffitiTexture(text, color);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.78, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.5), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = side < 0 ? Math.PI / 2 : side > 0 ? -Math.PI / 2 : 0;
    world.add(mesh);
  };
  graffiti("NO SALIDA", -6.0, 2.1, -16.5, -1, 4.4);
  graffiti("D9", 6.0, 2.45, 12.2, 1, 2.2, "#55c7c0");
  graffiti("BANK?", 6.0, 2.15, -41.5, 1, 3.4, "#e8a844");

  // posters
  const poster1 = new THREE.MeshBasicMaterial({ map: posterTexture(["SE BUSCA", "EL BARÓN", "RECOMPENSA · 50.000"], 0xe15b3a) });
  addPlane(0.76, 1.07, poster1, -6.0, 2.35, -21.2, { rotY: Math.PI / 2 });
  const poster2 = new THREE.MeshBasicMaterial({ map: posterTexture(["NO DISPARES", "A LOS REHENES", "DPD · D9"], 0x49bdb8) });
  addPlane(0.76, 1.07, poster2, 6.0, 2.3, -28.5, { rotY: -Math.PI / 2 });

  // ---------- lamps / cables ----------
  const wireMat = new THREE.LineBasicMaterial({ color: 0x121b1e, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 8; i++) {
    const z = 15 - i * 15.5;
    const points = [];
    for (let p = 0; p <= 12; p++) {
      const t = p / 12;
      const x = -6.05 + t * 12.1;
      const y = 6.2 - Math.sin(t * Math.PI) * 0.62;
      points.push(new THREE.Vector3(x, y, z));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), wireMat);
    world.add(line);

    if (i % 2 === 0) {
      const lamp = new THREE.Group();
      lamp.position.set(0, 5.55, z);
      const cable = addBox(0.02, 0.74, 0.02, iron, 0, 0.35, 0, { parent: lamp });
      cable.rotation.z = 0.02;
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.43, 0.25, 8, 1, true), ironLight);
      shade.rotation.x = Math.PI;
      shade.position.y = -0.05;
      lamp.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffca7d }));
      bulb.position.y = -0.18;
      lamp.add(bulb);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffb15f,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      glow.scale.set(2.3, 2.3, 1);
      glow.position.y = -0.2;
      lamp.add(glow);
      lampGroups.push({ group: lamp, phase: Math.random() * 7, z });
      world.add(lamp);
    }
  }

  // actual point lights for the first three light pools (kept low for mobile)
  for (const z of [8.8, -15.6, -46.7]) {
    const light = new THREE.PointLight(0xffa05a, 24, 19, 2);
    light.position.set(0, 5.0, z);
    world.add(light);
    animatedLights.push({ light, base: 24, phase: Math.random() * 5 });
  }

  // light pools on the ground
  for (const z of [8.8, -15.6, -46.7]) {
    const mat = new THREE.MeshBasicMaterial({
      map: lightPoolTex,
      color: 0xffb76c,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 9), mat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, 0.014, z);
    world.add(pool);
    glows.push({ mesh: pool, base: 0.1, speed: 0.16 });
  }

  // ---------- police barricade ----------
  const barricade = new THREE.Group();
  barricade.position.set(0, 0, -47);
  addBox(3.1, 0.22, 0.18, new THREE.MeshLambertMaterial({ color: 0xd9c7a2 }), 0, 0.72, 0, { parent: barricade });
  addBox(3.1, 0.12, 0.2, new THREE.MeshLambertMaterial({ color: 0xd9c7a2 }), 0, 0.38, 0, { parent: barricade });
  for (const x of [-1.25, 0, 1.25]) addBox(0.12, 0.9, 0.12, iron, x, 0.45, 0, { parent: barricade });
  for (let i = 0; i < 5; i++) {
    const stripe = addBox(0.33, 0.23, 0.2, new THREE.MeshLambertMaterial({ color: 0x263b42 }), -1.25 + i * 0.63, 0.72, 0.011, { parent: barricade });
    stripe.rotation.z = -0.45;
  }
  const barLightMat = new THREE.MeshBasicMaterial({ color: 0x63c6e6 });
  const barLight = addBox(0.28, 0.18, 0.2, barLightMat, 0, 1.04, 0, { parent: barricade });
  barLight.position.y = 1.12;
  world.add(barricade);
  policeLights.push({ mat: barLightMat, colors: [0x63c6e6, 0xe94f40], phase: 0 });

  // tape
  const tapeTex = (() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 48;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#dbbd49";
    ctx.fillRect(0, 0, 512, 48);
    ctx.fillStyle = "#152329";
    ctx.font = "800 25px 'Barlow Condensed', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("POLICE LINE   •   NO PASAR   •   POLICE LINE", 256, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(1.2, 1);
    return tex;
  })();
  const tapeMat = new THREE.MeshBasicMaterial({ map: tapeTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  for (const [x1, x2, y1, y2, z] of [[-5.4, 5.4, 2.2, 1.15, -46.1], [-5.4, 5.4, 1.0, 1.85, -46.4]]) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const tape = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.24), tapeMat);
    tape.position.set((x1 + x2) / 2, (y1 + y2) / 2, z);
    tape.rotation.z = Math.atan2(dy, dx);
    world.add(tape);
  }

  // ---------- police cruiser ----------
  const cruiser = new THREE.Group();
  cruiser.position.set(-3.6, 0, -72.2);
  cruiser.rotation.y = 0.18;
  addBox(2.0, 0.58, 4.15, new THREE.MeshLambertMaterial({ color: 0x253942 }), 0, 0.48, 0, { parent: cruiser, hit: true });
  addBox(1.78, 0.48, 1.85, new THREE.MeshLambertMaterial({ color: 0x29343a }), 0, 0.99, -0.2, { parent: cruiser, hit: true });
  addBox(1.66, 0.36, 0.08, glassDark, 0, 1.05, 0.73, { parent: cruiser });
  addBox(1.66, 0.36, 0.08, glassDark, 0, 1.05, -1.16, { parent: cruiser });
  addBox(2.02, 0.16, 0.1, new THREE.MeshBasicMaterial({ color: 0xf1e6c8 }), 0, 0.49, 2.08, { parent: cruiser });
  for (const x of [-1.02, 1.02]) {
    for (const z of [-1.35, 1.35]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.22, 10), iron);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.33, z);
      cruiser.add(wheel);
    }
  }
  const redLightMat = new THREE.MeshBasicMaterial({ color: 0xe54636 });
  const blueLightMat = new THREE.MeshBasicMaterial({ color: 0x62c8e8 });
  addBox(0.36, 0.15, 0.5, redLightMat, -0.36, 1.31, -0.2, { parent: cruiser });
  addBox(0.36, 0.15, 0.5, blueLightMat, 0.36, 1.31, -0.2, { parent: cruiser });
  addBox(0.8, 0.07, 0.14, iron, 0, 1.23, -0.2, { parent: cruiser });
  addBox(1.1, 0.5, 0.12, new THREE.MeshLambertMaterial({ color: 0xd0b64f }), 0, 0.54, 2.15, { parent: cruiser });
  for (let i = 0; i < 6; i++) {
    const s = addBox(0.14, 0.5, 0.13, iron, -0.48 + i * 0.19, 0.55, 2.215, { parent: cruiser });
    s.rotation.z = 0.35;
  }
  addBox(0.37, 0.28, 0.52, redLightMat, 0.68, 0.5, 2.07, { parent: cruiser });
  addBox(0.37, 0.28, 0.52, redLightMat, -0.68, 0.5, 2.07, { parent: cruiser });
  world.add(cruiser);
  policeLights.push({ mat: redLightMat, colors: [0xe54636, 0x441311], phase: 0.5 });
  policeLights.push({ mat: blueLightMat, colors: [0x62c8e8, 0x10262f], phase: 0 });

  // ---------- bank facade ----------
  const bankMat = new THREE.MeshLambertMaterial({ map: concreteTexture("#35464a"), color: 0xb7b7aa });
  const bankTrim = new THREE.MeshLambertMaterial({ color: 0x6d6b5d });
  addBox(20, 15, 1.4, bankMat, 0, 7.5, -92, { hit: true });
  addBox(21, 1.1, 2.3, bankTrim, 0, 0.55, -91.2, { hit: true });
  addBox(16, 0.7, 2.5, bankTrim, 0, 13.9, -90.9);
  addBox(7.2, 4.8, 0.45, new THREE.MeshLambertMaterial({ color: 0x111b20 }), 0, 2.4, -91.26);
  addBox(8.5, 0.52, 1.2, bankTrim, 0, 5.0, -91.1);
  for (const x of [-5.05, 5.05]) {
    addBox(1.15, 10.8, 1.15, new THREE.MeshLambertMaterial({ color: 0x8b8a7c }), x, 5.4, -90.5, { hit: true });
    addBox(1.42, 0.5, 1.42, bankTrim, x, 11, -90.5);
    addBox(1.42, 0.4, 1.42, bankTrim, x, 0.25, -90.5);
  }
  for (let i = 0; i < 3; i++) {
    addBox(14 - i * 2, 0.22, 1.6 + i * 0.55, bankTrim, 0, 0.11 + i * 0.22, -89.2 - i * 0.25, { hit: true });
  }
  addBox(2.6, 2.2, 0.3, new THREE.MeshBasicMaterial({ color: 0xf0b457, transparent: true, opacity: 0.75 }), 0, 3.2, -90.98);
  for (const x of [-1.55, 1.55]) addBox(0.12, 2.5, 0.3, bankTrim, x, 3.2, -90.95);
  addBox(3.2, 0.13, 0.3, bankTrim, 0, 4.42, -90.95);
  addBox(2.8, 0.2, 1.4, new THREE.MeshLambertMaterial({ color: 0xc34433 }), 0, 0.45, -88.8);
  // bank window slits
  for (let i = 0; i < 5; i++) {
    addPlane(1.4, 1.1, new THREE.MeshBasicMaterial({ color: 0x243b40 }), -6.4 + i * 3.2, 8.5, -91.29);
  }

  // armored truck
  const truck = new THREE.Group();
  truck.position.set(4.0, 0, -83.5);
  truck.rotation.y = -0.16;
  addBox(2.5, 2.2, 4.8, new THREE.MeshLambertMaterial({ color: 0x39464a }), 0, 1.4, 0, { parent: truck, hit: true });
  addBox(2.54, 1.1, 1.5, new THREE.MeshLambertMaterial({ color: 0x2f3d42 }), 0, 1.6, 2.8, { parent: truck, hit: true });
  addBox(2.3, 0.6, 0.08, glassDark, 0, 1.8, 3.54, { parent: truck });
  for (const x of [-1.26, 1.26]) {
    for (const z of [-1.4, 1.4]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.3, 10), iron);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.45, z);
      truck.add(wheel);
    }
  }
  addBox(2.2, 0.12, 0.4, new THREE.MeshBasicMaterial({ color: 0xf2b449 }), 0, 2.38, 2.9, { parent: truck });
  world.add(truck);

  // extra road barriers
  const barrier = (x, z, rot = 0) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    addBox(2.2, 0.46, 0.12, new THREE.MeshLambertMaterial({ color: 0xb9ad8e }), 0, 0.78, 0, { parent: g, hit: true });
    addBox(0.12, 0.9, 0.12, iron, -0.85, 0.45, 0, { parent: g });
    addBox(0.12, 0.9, 0.12, iron, 0.85, 0.45, 0, { parent: g });
    for (let i = 0; i < 3; i++) {
      const st = addBox(0.34, 0.48, 0.13, new THREE.MeshLambertMaterial({ color: 0x263c42 }), -0.7 + i * 0.7, 0.78, 0.01, { parent: g });
      st.rotation.z = -0.4;
    }
    world.add(g);
  };
  barrier(-2.8, -79.1, 0.14);
  barrier(2.2, -87.3, -0.1);

  // ---------- wet ground extra glow ----------
  const wetMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: 0x56b9b6,
    transparent: true,
    opacity: 0.065,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const [x, z, w, h] of [[0, 9, 3, 18], [0, -20, 3, 22], [0, -48, 3.2, 25], [0, -76, 4, 20]]) {
    const wet = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wetMat);
    wet.rotation.x = -Math.PI / 2;
    wet.position.set(x, 0.01, z);
    world.add(wet);
  }

  // ---------- rain ----------
  const rainCount = 230;
  const rainData = [];
  const rainPositions = new Float32Array(rainCount * 2 * 3);
  for (let i = 0; i < rainCount; i++) {
    rainData.push({
      x: -12 + Math.random() * 24,
      y: Math.random() * 16,
      z: 23 - Math.random() * 65,
      speed: 13 + Math.random() * 9,
      len: 0.32 + Math.random() * 0.45,
    });
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0x9bc8d1,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  world.add(rain);

  // dust motes in the light shafts
  const dustCount = 90;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustData = [];
  for (let i = 0; i < dustCount; i++) {
    dustData.push({
      x: -5 + Math.random() * 10,
      y: 0.6 + Math.random() * 5.3,
      z: 18 - Math.random() * 84,
      phase: Math.random() * 9,
      speed: 0.08 + Math.random() * 0.2,
    });
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xf4d29e,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  world.add(dust);

  // ambient and key lighting
  const hemi = new THREE.HemisphereLight(0x5a8fa8, 0x2c1a14, 1.9);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0x304853, 0.55);
  scene.add(ambient);
  const moonLight = new THREE.DirectionalLight(0x84aac4, 1.55);
  moonLight.position.set(-9, 18, 12);
  scene.add(moonLight);
  const fill = new THREE.DirectionalLight(0xd06b42, 0.5);
  fill.position.set(4, 4, 18);
  scene.add(fill);

  // glowing accents left after the world pass
  const accent = new THREE.PointLight(0x4acac5, 8, 14, 2);
  accent.position.set(4, 2.8, -53);
  world.add(accent);

  const update = (dt, time, camera) => {
    // neon flicker
    for (const n of neon) {
      const flicker = Math.sin(time * 1.7 + n.phase) * 0.035 + Math.sin(time * 11.3 + n.phase * 2) * 0.012;
      n.mat.opacity = n.base + flicker;
      n.glow.material.opacity = 0.25 + flicker;
    }
    for (const l of animatedLights) {
      l.light.intensity = l.base * (0.96 + Math.sin(time * 2.1 + l.phase) * 0.035);
    }
    for (const l of doorLights) {
      if (l.light) l.light.intensity = 4.5 * (0.92 + Math.sin(time * 3.4 + l.phase) * 0.08);
      l.glow.material.opacity = 0.62 + Math.sin(time * 3.4 + l.phase) * 0.07;
    }
    for (const p of policeLights) {
      const active = Math.sin(time * 7 + p.phase) > 0;
      p.mat.color.setHex(active ? p.colors[0] : p.colors[1]);
    }
    for (const g of glows) {
      g.mesh.material.opacity = g.base * (0.86 + Math.sin(time * g.speed * 2.8) * 0.14);
    }
    for (const lamp of lampGroups) {
      lamp.group.rotation.z = Math.sin(time * 0.46 + lamp.phase) * 0.018;
      lamp.group.rotation.x = Math.cos(time * 0.32 + lamp.phase) * 0.01;
    }

    // rain
    if (camera) {
      const camZ = camera.position.z;
      let ptr = 0;
      for (let i = 0; i < rainCount; i++) {
        const d = rainData[i];
        d.y -= d.speed * dt;
        d.x -= dt * 1.3;
        if (d.y < 0.02 || d.z > camZ + 15 || d.z < camZ - 53) {
          d.y = 10 + Math.random() * 7;
          d.x = -11 + Math.random() * 22;
          d.z = camZ + 9 - Math.random() * 54;
        }
        rainPositions[ptr++] = d.x;
        rainPositions[ptr++] = d.y;
        rainPositions[ptr++] = d.z;
        rainPositions[ptr++] = d.x - 0.065;
        rainPositions[ptr++] = d.y - d.len;
        rainPositions[ptr++] = d.z + 0.02;
      }
      rainGeo.attributes.position.needsUpdate = true;

      for (let i = 0; i < dustCount; i++) {
        const d = dustData[i];
        dustPositions[i * 3] = d.x + Math.sin(time * d.speed + d.phase) * 0.35;
        dustPositions[i * 3 + 1] = d.y + Math.sin(time * d.speed * 0.7 + d.phase) * 0.2;
        dustPositions[i * 3 + 2] = d.z;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }
  };

  // Collapse the static city into one draw call per material. Animated
  // lamp meshes stay separate so they can keep swinging.
  const animatedMeshes = new Set();
  for (const lamp of lampGroups) lamp.group.traverse((obj) => animatedMeshes.add(obj));
  mergeStaticGeometry(world, hittables, (obj) => animatedMeshes.has(obj));

  return { group: world, hittables, update, rain, neon, hittablesCount: hittables.length };
}