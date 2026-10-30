import * as THREE from "three";

export const ENEMY_TYPES = {
  thug: {
    label: "LADRÓN",
    health: 2,
    speed: 1.35,
    windup: 1.55,
    interval: 2.5,
    damage: 11,
    score: 100,
    scale: 1,
  },
  runner: {
    label: "CORREDOR",
    health: 1,
    speed: 2.0,
    windup: 1.15,
    interval: 2.2,
    damage: 8,
    score: 150,
    scale: 0.93,
  },
  heavy: {
    label: "FORZUDO",
    health: 4,
    speed: 1.05,
    windup: 1.95,
    interval: 3.1,
    damage: 17,
    score: 250,
    scale: 1.12,
  },
  boss: {
    label: "EL BARÓN",
    health: 18,
    speed: 0.9,
    windup: 1.7,
    interval: 2.6,
    damage: 19,
    score: 2200,
    scale: 1.45,
  },
  hostage: {
    label: "REHÉN",
    health: 99,
    speed: 1.15,
    windup: 0,
    interval: 99,
    damage: 0,
    score: 0,
    scale: 0.96,
  },
};

const materialCache = new Map();
function mat(color, opts = {}) {
  const key = `${color}-${opts.emissive || 0}-${opts.flat ? 1 : 0}-${opts.opacity || 1}`;
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshLambertMaterial({
      color,
      emissive: opts.emissive || 0x000000,
      flatShading: opts.flat !== false,
      transparent: (opts.opacity || 1) < 1,
      opacity: opts.opacity || 1,
    }));
  }
  return materialCache.get(key);
}

let glowTexture;
function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,.95)");
  g.addColorStop(0.25, "rgba(255,255,255,.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(c);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}

let warningTexture;
function getWarningTexture() {
  if (warningTexture) return warningTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  ctx.translate(64, 64);
  ctx.fillStyle = "rgba(7,16,22,.82)";
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = i % 2 ? 48 : 57;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#ff6b4a";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "#ff7a50";
  ctx.font = "400 82px Anton, Arial Black, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("!", 0, 5);
  warningTexture = new THREE.CanvasTexture(c);
  warningTexture.colorSpace = THREE.SRGBColorSpace;
  return warningTexture;
}

let hostageTexture;
function getHostageTexture() {
  if (hostageTexture) return hostageTexture;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(7,16,22,.8)";
  ctx.fillRect(4, 12, 248, 66);
  ctx.strokeStyle = "#f4b942";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 12, 248, 66);
  ctx.fillStyle = "#f4b942";
  ctx.font = "700 39px 'Barlow Condensed', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("REHÉN · NO DISPARAR", 128, 47);
  hostageTexture = new THREE.CanvasTexture(c);
  hostageTexture.colorSpace = THREE.SRGBColorSpace;
  return hostageTexture;
}

function createLaser(color = 0xff5138) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const line = new THREE.Line(geo, material);
  line.frustumCulled = false;
  return line;
}

export class Enemy {
  constructor({ scene, camera, type = "thug", spawn, mark, index = 0, onFire, onCivilianHit }) {
    this.scene = scene;
    this.camera = camera;
    this.type = type;
    this.data = ENEMY_TYPES[type] || ENEMY_TYPES.thug;
    this.onFire = onFire;
    this.onCivilianHit = onCivilianHit;
    this.index = index;
    this.isBoss = type === "boss";
    this.isHostage = type === "hostage";
    this.maxHealth = this.data.health;
    this.health = this.maxHealth;
    this.dead = false;
    this.removed = false;
    this.state = "enter";
    this.windup = this.data.windup;
    this.attackInterval = this.data.interval * (0.92 + Math.random() * 0.18);
    this.cooldown = 0.7 + Math.random() * 0.9;
    this.threat = false;
    this.threatTimer = 0;
    this.phase = Math.random() * 10;
    this.walkPhase = Math.random() * 7;
    this.deathTimer = 0;
    this.hitFlash = 0;
    this.hostageHitOnce = false;
    this.enterDuration = Math.max(0.55, Math.min(1.7, 5.2 / this.data.speed));
    this.enterTime = 0;
    this.spawnPos = new THREE.Vector3(spawn[0], 0, spawn[1]);
    this.markPos = new THREE.Vector3(mark[0], 0, mark[1]);
    this.position = this.spawnPos.clone();
    this.hitMeshes = [];
    this.root = new THREE.Group();
    this.root.name = `enemy-${type}-${index}`;
    this.root.position.copy(this.spawnPos);
    this.root.scale.setScalar(this.data.scale);
    this.root.lookAt(camera.position.x, 2.1, camera.position.z);
    this.root.rotation.x = 0;
    this.root.rotation.z = 0;
    this.root.userData.enemy = this;

    this.build();
    scene.add(this.root);

    this.laser = createLaser(this.isBoss ? 0xffb03a : 0xff5138);
    this.laser.visible = false;
    scene.add(this.laser);

    this.tracer = createLaser(0xffc08a);
    this.tracer.material.opacity = 0.85;
    this.tracer.visible = false;
    scene.add(this.tracer);
    this.tracerLife = 0;
  }

  build() {
    const variant = this.type;
    const jacketColors = {
      thug: 0x263d42,
      runner: 0x572f31,
      heavy: 0x303c3e,
      boss: 0x393939,
      hostage: 0x3b4e52,
    };
    const accentColors = {
      thug: 0xe05a37,
      runner: 0xf0a341,
      heavy: 0xcf402e,
      boss: 0xe2a63b,
      hostage: 0xe7b63e,
    };
    const jacket = mat(jacketColors[variant]);
    const accent = mat(accentColors[variant], { emissive: variant === "boss" ? 0x1a0e00 : 0x000000 });
    const pants = mat(0x172228);
    const boots = mat(0x0c1215);
    const mask = mat(variant === "boss" ? 0x141311 : 0x0a1014);
    const skin = mat(0xa66f4d);
    const cream = mat(0xe9ddc2);
    const metal = mat(0x192227);

    const body = new THREE.Group();
    this.body = body;
    this.root.add(body);

    // shadow
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.58, 14), shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.015;
    this.root.add(this.shadow);

    // legs
    const makeLeg = (x) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.92, 0);
      const leg = this.mesh(new THREE.BoxGeometry(0.25, 0.83, 0.28), pants, 0, -0.4, 0);
      const boot = this.mesh(new THREE.BoxGeometry(0.27, 0.2, 0.42), boots, 0, -0.82, 0.08);
      pivot.add(leg, boot);
      this.markHit(leg, "leg");
      body.add(pivot);
      return pivot;
    };
    this.legL = makeLeg(-0.17);
    this.legR = makeLeg(0.17);

    // torso
    const torso = this.mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.92, 6), jacket, 0, 1.35, 0);
    torso.scale.z = 0.72;
    this.markHit(torso, "body");
    body.add(torso);

    const chest = this.mesh(new THREE.BoxGeometry(0.57, 0.3, 0.39), accent, 0, 1.55, 0.12);
    chest.rotation.z = -0.09;
    body.add(chest);
    this.markHit(chest, "body");

    const belt = this.mesh(new THREE.BoxGeometry(0.64, 0.1, 0.32), mat(0x0b1114), 0, 1.0, 0.02);
    body.add(belt);
    const buckle = this.mesh(new THREE.BoxGeometry(0.1, 0.1, 0.04), accent, 0, 1.0, 0.19);
    body.add(buckle);

    // hoodie collar
    const collar = this.mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.16, 6), jacket, 0, 1.87, 0);
    body.add(collar);

    // arms
    const makeArm = (x, side) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.73, 0);
      const arm = this.mesh(new THREE.BoxGeometry(0.21, 0.63, 0.22), jacket, 0, -0.3, 0);
      const hand = this.mesh(new THREE.BoxGeometry(0.2, 0.15, 0.22), variant === "hostage" ? skin : mat(0x17191b), 0, -0.66, 0.03);
      pivot.add(arm, hand);
      this.markHit(arm, "arm");
      body.add(pivot);
      return { pivot, hand, side };
    };
    this.armL = makeArm(-0.48, -1);
    this.armR = makeArm(0.48, 1);

    // head group
    const head = new THREE.Group();
    head.position.set(0, 2.1, 0);
    this.head = head;
    body.add(head);

    if (this.isHostage) {
      const skull = this.mesh(new THREE.IcosahedronGeometry(0.24, 1), skin, 0, 0, 0);
      skull.scale.set(0.93, 1.05, 0.95);
      this.markHit(skull, "head");
      head.add(skull);
      const hair = this.mesh(new THREE.BoxGeometry(0.43, 0.16, 0.34), mat(0x211812), 0, 0.14, -0.03);
      head.add(hair);
      const eyeL = this.mesh(new THREE.BoxGeometry(0.045, 0.03, 0.02), mat(0x1a1613), -0.08, 0.02, 0.225);
      const eyeR = this.mesh(new THREE.BoxGeometry(0.045, 0.03, 0.02), mat(0x1a1613), 0.08, 0.02, 0.225);
      head.add(eyeL, eyeR);
      const mouth = this.mesh(new THREE.BoxGeometry(0.08, 0.018, 0.02), mat(0x6e3a31), 0, -0.09, 0.228);
      head.add(mouth);
    } else {
      const skull = this.mesh(new THREE.IcosahedronGeometry(0.245, 1), mask, 0, 0, 0);
      skull.scale.set(0.94, 1.06, 0.94);
      this.markHit(skull, "head");
      head.add(skull);
      const eyeBand = this.mesh(new THREE.BoxGeometry(0.38, 0.095, 0.035), variant === "boss" ? mat(0x2a2116) : cream, 0, 0.035, 0.215);
      head.add(eyeBand);
      const eyeMat = mat(variant === "boss" ? 0xff3b2c : 0x161d20, { emissive: variant === "boss" ? 0x9e130c : 0x000000 });
      const eyeL = this.mesh(new THREE.BoxGeometry(0.062, 0.038, 0.025), eyeMat, -0.09, 0.036, 0.24);
      const eyeR = this.mesh(new THREE.BoxGeometry(0.062, 0.038, 0.025), eyeMat, 0.09, 0.036, 0.24);
      head.add(eyeL, eyeR);
      if (variant === "boss") {
        const brow = this.mesh(new THREE.BoxGeometry(0.4, 0.06, 0.04), mat(0x8f1f18, { emissive: 0x360400 }), 0, 0.1, 0.23);
        head.add(brow);
      }
      if (variant === "thug" || variant === "heavy") {
        const beanie = this.mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.15, 7), accent, 0, 0.19, 0);
        head.add(beanie);
        const fold = this.mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.055, 7), mat(0x11181b), 0, 0.13, 0);
        head.add(fold);
      } else if (variant === "runner") {
        const band = this.mesh(new THREE.BoxGeometry(0.5, 0.08, 0.06), accent, 0, 0.08, -0.18);
        head.add(band);
      }
    }

    // shoulder armor for heavy and boss
    if (variant === "heavy" || variant === "boss") {
      for (const x of [-0.48, 0.48]) {
        const pad = this.mesh(new THREE.BoxGeometry(0.26, 0.16, 0.35), variant === "boss" ? accent : mat(0x182225), x, 1.86, 0);
        pad.rotation.z = x < 0 ? 0.18 : -0.18;
        body.add(pad);
      }
    }
    if (variant === "heavy") {
      const vest = this.mesh(new THREE.BoxGeometry(0.63, 0.55, 0.44), mat(0x121a1d), 0, 1.34, 0.03);
      body.add(vest);
      this.markHit(vest, "body");
      for (let i = 0; i < 3; i++) {
        const pouch = this.mesh(new THREE.BoxGeometry(0.15, 0.18, 0.08), mat(0x2f3a37), -0.19 + i * 0.19, 1.23, 0.27);
        body.add(pouch);
      }
    }
    if (variant === "boss") {
      const scarf = this.mesh(new THREE.BoxGeometry(0.62, 0.16, 0.4), accent, 0, 1.82, 0.01);
      body.add(scarf);
      const bag = this.mesh(new THREE.BoxGeometry(0.5, 0.58, 0.32), mat(0x4c3a27), 0, 1.25, -0.35);
      body.add(bag);
      const strap = this.mesh(new THREE.BoxGeometry(0.07, 0.9, 0.04), mat(0x121416), -0.19, 1.52, 0.17);
      strap.rotation.z = 0.37;
      body.add(strap);
    }

    // gun
    const gun = new THREE.Group();
    this.gun = gun;
    gun.position.set(0, -0.64, 0.03);
    const barrel = this.mesh(new THREE.BoxGeometry(0.085, 0.1, 0.4), metal, 0, 0.02, 0.19);
    const slide = this.mesh(new THREE.BoxGeometry(0.11, 0.12, 0.32), mat(0x29343a), 0, 0.075, 0.12);
    const grip = this.mesh(new THREE.BoxGeometry(0.09, 0.24, 0.1), mat(0x34261f), 0, -0.12, 0.02);
    grip.rotation.x = -0.18;
    gun.add(barrel, slide, grip);
    if (variant === "heavy" || variant === "boss") {
      const mag = this.mesh(new THREE.BoxGeometry(0.12, 0.25, 0.13), metal, 0, -0.18, 0.08);
      gun.add(mag);
      const stock = this.mesh(new THREE.BoxGeometry(0.13, 0.35, 0.16), mat(0x1b2326), 0, -0.12, -0.21);
      gun.add(stock);
    }
    this.armR.pivot.add(gun);
    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0, 0.03, 0.41);
    gun.add(this.muzzle);

    this.flash = new THREE.Sprite(new THREE.SpriteMaterial({
      map: getGlowTexture(),
      color: 0xffa347,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }));
    this.flash.scale.set(0.65, 0.65, 1);
    this.flash.position.copy(this.muzzle.position);
    this.flash.visible = false;
    gun.add(this.flash);
    this.flashTimer = 0;

    // threat indicator
    this.warning = new THREE.Sprite(new THREE.SpriteMaterial({
      map: getWarningTexture(),
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }));
    this.warning.scale.set(0.58, 0.58, 1);
    this.warning.position.set(0, 2.75, 0);
    this.warning.visible = false;
    this.warning.renderOrder = 20;
    this.root.add(this.warning);

    if (this.isHostage) {
      this.hostageLabel = new THREE.Sprite(new THREE.SpriteMaterial({
        map: getHostageTexture(),
        transparent: true,
        opacity: 0.9,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }));
      this.hostageLabel.scale.set(1.65, 0.62, 1);
      this.hostageLabel.position.set(0, 2.72, 0);
      this.hostageLabel.renderOrder = 19;
      this.root.add(this.hostageLabel);
    }
  }

  mesh(geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.userData.enemy = this;
    return mesh;
  }

  markHit(mesh, part) {
    mesh.userData.enemy = this;
    mesh.userData.part = part;
    this.hitMeshes.push(mesh);
  }

  get muzzleWorld() {
    const pos = new THREE.Vector3();
    this.muzzle.getWorldPosition(pos);
    return pos;
  }

  update(dt, time) {
    if (this.removed) return;
    if (this.dead) {
      this.deathTimer += dt;
      const k = Math.min(1, this.deathTimer / 0.7);
      this.root.rotation.x = THREE.MathUtils.lerp(this.root.rotation.x, -1.42, k * 0.18);
      this.root.rotation.z = THREE.MathUtils.lerp(this.root.rotation.z, this.deathTilt, k * 0.14);
      this.shadow.material.opacity = Math.max(0, 0.36 * (1 - this.deathTimer / 1.2));
      if (this.deathTimer > 1.3) {
        this.root.position.y -= dt * 1.9;
      }
      if (this.deathTimer > 2.2) this.removed = true;
      return;
    }

    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      this.body.rotation.z = Math.sin(this.hitFlash * 70) * this.hitFlash * 0.32;
    } else {
      this.body.rotation.z *= 0.86;
    }

    if (this.state === "enter") {
      this.enterTime += dt;
      const t = Math.min(1, this.enterTime / this.enterDuration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.root.position.lerpVectors(this.spawnPos, this.markPos, eased);
      this.root.position.y = 0;
      this.animateWalk(time, 9.5);
      this.aimArm(-0.2, -0.1);
      if (t >= 1) {
        this.state = "combat";
        this.cooldown = 0.8 + Math.random() * 0.7;
      }
      return;
    }

    this.root.position.y = 0;
    if (this.isHostage) {
      this.updateHostage(time);
      return;
    }

    // idle sway / breathing
    const sway = Math.sin(time * 1.8 + this.phase) * 0.035;
    this.root.position.x = this.markPos.x + sway;
    this.root.position.z = this.markPos.z + Math.cos(time * 1.4 + this.phase) * 0.025;
    this.legL.rotation.x *= 0.85;
    this.legR.rotation.x *= 0.85;

    if (this.threat) {
      this.threatTimer -= dt;
      const pulse = 0.5 + Math.sin(time * 12 + this.phase) * 0.5;
      this.warning.visible = true;
      this.warning.material.opacity = 0.72 + pulse * 0.28;
      this.warning.scale.setScalar(0.55 + pulse * 0.08);
      this.aimArm(-1.24, -1.07);
      this.gun.rotation.x = 1.16;
      this.laser.visible = true;
      this.updateLaser(time, pulse);
      if (this.threatTimer <= 0) {
        this.threat = false;
        this.warning.visible = false;
        this.laser.visible = false;
        this.fire();
        this.cooldown = this.attackInterval;
        this.gun.rotation.x = 0.4;
      }
    } else {
      this.warning.visible = false;
      this.laser.visible = false;
      this.cooldown -= dt;
      this.aimArm(-0.16 + Math.sin(time * 1.8 + this.phase) * 0.03, -0.09);
      this.gun.rotation.x = 0.08;
      if (this.cooldown <= 0) {
        this.threat = true;
        this.threatTimer = this.windup;
      }
    }

    // boss has a glow under the bag
    if (this.isBoss) {
      this.shadow.material.opacity = 0.3 + Math.sin(time * 3) * 0.04;
    }
  }

  updateHostage(time) {
    const pulse = 0.86 + Math.sin(time * 2 + this.phase) * 0.08;
    this.body.position.y = Math.sin(time * 1.7 + this.phase) * 0.012;
    if (!this.hostageHitOnce) {
      this.armL.pivot.rotation.x = -2.55 + Math.sin(time * 1.6 + this.phase) * 0.06;
      this.armR.pivot.rotation.x = -2.55 + Math.cos(time * 1.5 + this.phase) * 0.06;
      this.armL.pivot.rotation.z = 0.16;
      this.armR.pivot.rotation.z = -0.16;
      this.hostageLabel.material.opacity = pulse;
      this.hostageLabel.scale.set(1.65, 0.62, 1);
    } else {
      this.armL.pivot.rotation.x = -0.2;
      this.armR.pivot.rotation.x = -0.2;
      this.body.rotation.x = 0.2;
      this.root.position.y = -0.18;
      this.hostageLabel.visible = false;
    }
  }

  animateWalk(time, speed = 8) {
    const s = Math.sin(time * speed + this.walkPhase);
    const c = Math.cos(time * speed + this.walkPhase);
    this.legL.rotation.x = s * 0.52;
    this.legR.rotation.x = -s * 0.52;
    this.armL.pivot.rotation.x = -s * 0.32 - 0.1;
    this.armR.pivot.rotation.x = s * 0.23 - 0.15;
    this.body.position.y = Math.abs(c) * 0.035;
    this.body.rotation.z = s * 0.018;
    this.gun.rotation.x = 0.05;
  }

  aimArm(left, right) {
    this.armL.pivot.rotation.x = THREE.MathUtils.lerp(this.armL.pivot.rotation.x, left, 0.22);
    this.armR.pivot.rotation.x = THREE.MathUtils.lerp(this.armR.pivot.rotation.x, right, 0.22);
    this.armL.pivot.rotation.z = THREE.MathUtils.lerp(this.armL.pivot.rotation.z, 0.08, 0.2);
    this.armR.pivot.rotation.z = THREE.MathUtils.lerp(this.armR.pivot.rotation.z, -0.06, 0.2);
    this.body.position.y = THREE.MathUtils.lerp(this.body.position.y, 0, 0.2);
  }

  updateLaser(time, pulse) {
    const start = this.muzzleWorld;
    const end = this.camera.position.clone();
    end.x += Math.sin(time * 8 + this.phase) * 0.11;
    end.y += Math.cos(time * 7 + this.phase) * 0.08;
    end.z -= 0.15;
    const attr = this.laser.geometry.attributes.position;
    attr.setXYZ(0, start.x, start.y, start.z);
    attr.setXYZ(1, end.x, end.y, end.z);
    attr.needsUpdate = true;
    this.laser.material.opacity = 0.35 + pulse * 0.32;
  }

  fire() {
    this.flash.visible = true;
    this.flashTimer = 0.075;
    const start = this.muzzleWorld;
    const end = this.camera.position.clone();
    end.x += (Math.random() - 0.5) * 1.5;
    end.y += (Math.random() - 0.5) * 0.8;
    end.z -= 0.3;
    const attr = this.tracer.geometry.attributes.position;
    attr.setXYZ(0, start.x, start.y, start.z);
    attr.setXYZ(1, end.x, end.y, end.z);
    attr.needsUpdate = true;
    this.tracer.visible = true;
    this.tracerLife = 0.09;
    this.onFire?.(this);
  }

  updateEffects(dt) {
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) this.flash.visible = false;
    }
    if (this.tracerLife > 0) {
      this.tracerLife -= dt;
      if (this.tracerLife <= 0) this.tracer.visible = false;
    }
  }

  hit(damage, part = "body") {
    if (this.dead || this.removed) return { killed: false, hostage: this.isHostage };
    if (this.isHostage) {
      if (!this.hostageHitOnce) {
        this.hostageHitOnce = true;
        this.onCivilianHit?.(this);
      }
      this.hitFlash = 0.14;
      return { killed: false, hostage: true, already: this.hostageHitOnce };
    }
    this.health -= damage;
    this.hitFlash = 0.16;
    if (this.health <= 0) {
      this.die(part);
      return { killed: true, hostage: false, headshot: part === "head" };
    }
    return { killed: false, hostage: false, headshot: part === "head" };
  }

  die(part) {
    if (this.dead) return;
    this.dead = true;
    this.state = "dead";
    this.warning.visible = false;
    this.laser.visible = false;
    this.tracer.visible = false;
    this.gun.rotation.x = 0.2;
    this.deathTilt = (Math.random() - 0.5) * 0.7;
    this.deathTimer = 0;
    this.hitFlash = 0;
    this.deadByHead = part === "head";
  }

  threatProgress() {
    if (!this.threat) return 0;
    return 1 - this.threatTimer / this.windup;
  }

  dispose() {
    this.scene.remove(this.root);
    this.scene.remove(this.laser);
    this.scene.remove(this.tracer);
    this.laser.geometry.dispose();
    this.tracer.geometry.dispose();
    this.removed = true;
  }
}
