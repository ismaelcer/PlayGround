import * as THREE from "three";
import { buildWorld } from "./world.js";
import { Enemy, ENEMY_TYPES } from "./enemy.js";
import { AudioSystem } from "./audio.js";

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (n, len = 6) => String(Math.max(0, Math.floor(n))).padStart(len, "0");
const damp = (a, b, rate, dt) => a + (b - a) * Math.min(1, rate * dt);
const storage = {
  get(key, fallback = "") {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* private mode */ }
  },
};
const url = new URL(location.href);
const isMobile = matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const WAVES = [
  {
    zone: "MOTEL AZUL",
    title: "MOTEL AZUL",
    sub: "LA BANDA ESTÁ DENTRO",
    objective: "APARTA A LA BANDA",
    camZ: 12,
    enemies: [
      { type: "thug", spawn: [4.85, -1.2], mark: [2.25, -2.2], delay: 0 },
      { type: "thug", spawn: [-4.85, 3.1], mark: [-2.05, 2.0], delay: 0.18 },
      { type: "runner", spawn: [0.9, -16.2], mark: [0.1, -6.2], delay: 0.7 },
      { type: "thug", spawn: [-4.85, -8.8], mark: [-2.4, -7.1], delay: 1.15 },
    ],
  },
  {
    zone: "MUELLE 7",
    title: "MUELLE 7",
    sub: "CARGAMENTO SIN DECLARAR",
    objective: "CUBRE EL MUELLE",
    camZ: -11,
    enemies: [
      { type: "thug", spawn: [-4.85, -17.8], mark: [-2.55, -18.4], delay: 0 },
      { type: "runner", spawn: [4.85, -16.3], mark: [3.0, -16.8], delay: 0.6 },
      { type: "heavy", spawn: [4.85, -26.1], mark: [2.15, -23.9], delay: 1.0 },
      { type: "thug", spawn: [-4.85, -28.2], mark: [-2.05, -25.4], delay: 1.45 },
      { type: "thug", spawn: [0.0, -36.5], mark: [0.0, -29.0], delay: 1.95 },
    ],
  },
  {
    zone: "CAJA FUERTE",
    title: "CAJA FUERTE",
    sub: "NO DISPARES AL REHÉN",
    objective: "EVITA DAÑAR AL REHÉN",
    camZ: -37,
    enemies: [
      { type: "thug", spawn: [-4.85, -43.2], mark: [-2.75, -43.3], delay: 0 },
      { type: "runner", spawn: [4.85, -45.0], mark: [3.0, -44.0], delay: 0.65 },
      { type: "heavy", spawn: [4.85, -54.5], mark: [2.1, -50.0], delay: 1.1 },
      { type: "thug", spawn: [-4.85, -55.2], mark: [-2.1, -51.2], delay: 1.5 },
      { type: "hostage", spawn: [-4.3, -57.4], mark: [-1.1, -49.6], delay: 1.85 },
      { type: "thug", spawn: [0.0, -63.0], mark: [0.0, -56.2], delay: 2.3 },
    ],
  },
  {
    zone: "BANCO CENTRAL",
    title: "EL BARÓN",
    sub: "OBJETIVO PRIORITARIO",
    objective: "DERRIBA A EL BARÓN",
    camZ: -62,
    enemies: [
      { type: "boss", spawn: [0.0, -84.0], mark: [0.0, -76.2], delay: 0.15 },
      { type: "thug", spawn: [-4.85, -72.6], mark: [-3.0, -72.2], delay: 0.9 },
      { type: "thug", spawn: [4.85, -75.6], mark: [3.15, -74.8], delay: 1.3 },
      { type: "runner", spawn: [4.85, -80.2], mark: [3.45, -77.7], delay: 1.7 },
    ],
  },
];

const dom = {
  scene: $("scene"),
  boot: $("boot"),
  bootStatus: $("bootStatus"),
  menu: $("menu"),
  hud: $("hud"),
  start: $("startBtn"),
  best: $("bestScore"),
  bestRank: $("bestRank"),
  soundToggle: $("soundToggle"),
  tiltToggle: $("tiltToggle"),
  pause: $("pauseBtn"),
  recenter: $("recenterBtn"),
  tiltStatus: $("tiltStatus"),
  score: $("score"),
  combo: $("combo"),
  healthText: $("healthText"),
  healthBar: $("healthBar"),
  healthState: $("healthState"),
  healthPanel: document.querySelector(".health-panel"),
  zoneLabel: $("zoneLabel"),
  waveLabel: $("waveLabel"),
  wavePips: $("wavePips"),
  objectiveText: $("objectiveText"),
  bossPanel: $("bossPanel"),
  bossBar: $("bossBar"),
  toastStack: $("toastStack"),
  waveBanner: $("waveBanner"),
  bannerKicker: $("bannerKicker"),
  bannerTitle: $("bannerTitle"),
  bannerSub: $("bannerSub"),
  ammoNow: $("ammoNow"),
  ammoPips: $("ammoPips"),
  reload: $("reloadBtn"),
  reloadBar: $("reloadBar"),
  reloadTrack: document.querySelector(".reload-track"),
  fire: $("fireBtn"),
  reticle: $("reticle"),
  hitMarker: $("hitMarker"),
  busted: $("bustedLayer"),
  damageLayer: $("damageLayer"),
  lowAmmo: $("lowAmmo"),
  damageFlash: $("damageFlash"),
  hitFlash: $("hitFlash"),
  controlHint: $("controlHint"),
  pauseScreen: $("pauseScreen"),
  pauseScore: $("pauseScore"),
  pauseAccuracy: $("pauseAccuracy"),
  pauseWave: $("pauseWave"),
  pauseTilt: $("pauseTiltBtn"),
  resume: $("resumeBtn"),
  restartPause: $("restartBtn"),
  quit: $("quitBtn"),
  endScreen: $("endScreen"),
  endKicker: $("endKicker"),
  endTitle: $("endTitle"),
  endText: $("endText"),
  endScore: $("endScore"),
  endAccuracy: $("endAccuracy"),
  endKills: $("endKills"),
  endCombo: $("endCombo"),
  endRank: $("rankLetter"),
  newBest: $("newBest"),
  retry: $("retryBtn"),
  endMenu: $("endMenuBtn"),
  unsupported: $("unsupported"),
};

let renderer;
let scene;
let camera;
let world;
const audio = new AudioSystem();

const state = {
  mode: "boot",
  prevMode: "playing",
  waveIndex: -1,
  waveClock: 0,
  pendingClear: -1,
  transitionTimer: 0,
  nextWave: -1,
  endTimer: -1,
  endShown: false,
  elapsed: 0,
  lastTime: 0,
  score: 0,
  health: 100,
  ammo: 12,
  maxAmmo: 12,
  combo: 0,
  multiplier: 1,
  bestCombo: 1,
  shots: 0,
  hits: 0,
  kills: 0,
  reloading: false,
  reloadTimer: 0,
  reloadDuration: 1.08,
  autoReload: -1,
  fireCooldown: 0,
  damageCooldown: 0,
  firing: false,
  bannerTimer: 0,
  pendingNewBest: false,
  victoryPush: 0,
  deathCam: 0,
  cameraBaseZ: 17.6,
  cameraMove: null,
  controlHintTimer: 8,
  bossEntry: null,
  aimHotTimer: 0,
  gunFlashTimer: 0,
};

const aim = { x: 0, y: 0 };
const aimNDC = new THREE.Vector2(0, 0);
const raycaster = new THREE.Raycaster();
const projectVec = new THREE.Vector3();
const tempVec = new THREE.Vector3();
const tempVec2 = new THREE.Vector3();

let enemies = [];
let waveEntries = [];
let spawnQueue = [];
let gunRoot;
let gunMuzzle;
let gunFlash;
let gunLight;
let recoil = 0;
let muzzles = [];
let tracers = [];
let sparks = [];
let sparkPool = [];
let cameraShake = 0;
let touch = null;
let mouseDown = false;
let lastSoundState = null;
let bannerTimeout = 0;
let hintTimeout = 0;
let pendingStart = false;

// adaptive resolution keeps software renderers and older phones playable
const perf = {
  baseScale: 1,
  scale: 1,
  minScale: 0.4,
  maxScale: 1,
  frameAvg: 16.7,
  sample: 0,
  sinceAdjust: 0,
  fps: 60,
  drawCalls: 0,
  triangles: 0,
  auto: true,
  frames: 0,
};

const tilt = {
  enabled: false,
  supported: typeof window.DeviceOrientationEvent !== "undefined",
  requesting: false,
  awaitingCenter: false,
  baseBeta: 0,
  baseGamma: 0,
  rawBeta: 0,
  rawGamma: 0,
  hasData: false,
  originX: 0,
  originY: 0,
  angle: 0,
  announcements: 0,
};

// ---------- setup ----------

async function init() {
  const t0 = performance.now();
  const mark = (label) => { if (url.searchParams.has("debug")) console.log(`[init] ${label} ${Math.round(performance.now() - t0)}ms`); };
  try {
    // The menu is revealed under the boot veil right away so a queued tap is
    // never lost while the district is still being built.
    state.mode = "menu";
    dom.menu.classList.remove("hidden");
    bindUI();
    await (document.fonts?.ready || Promise.resolve());
    mark("fonts");
    dom.bootStatus.textContent = "AFINANDO MIRILLAS…";
    renderer = new THREE.WebGLRenderer({
      canvas: dom.scene,
      antialias: false,
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
    });
    renderer.setPixelRatio(1);
    const initialScale = isMobile ? 0.8 : Math.min(0.72, Math.sqrt(620000 / Math.max(1, window.innerWidth * window.innerHeight)));
    renderer.setSize(
      Math.round(window.innerWidth * initialScale),
      Math.round(window.innerHeight * initialScale),
      false
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.55;
    renderer.shadowMap.enabled = false;
    mark("renderer");

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(57, window.innerWidth / window.innerHeight, 0.05, 180);
    camera.position.set(0, 2.38, 17.6);
    scene.add(camera);

    dom.bootStatus.textContent = "CONSTRUYENDO EL DISTRITO…";
    world = buildWorld(scene);
    mark("world");

    setupCameraLight();
    setupWeapon();
    setupEffects();
    setupAmmoPips();
    resize();
    mark("setup");
    renderer.compile(scene, camera);
    mark("compiled");
    renderer.render(scene, camera);
    mark("warm");
    updateBestDisplay();
    updateTiltUI();
    updateSoundUI();

    dom.boot.classList.add("done");
    setTimeout(() => dom.boot.classList.add("hidden"), 500);
    state.lastTime = performance.now();
    requestAnimationFrame(loop);
    mark("menu-shown");
    if (pendingStart) {
      pendingStart = false;
      startRun();
    }

    if (url.searchParams.has("debug")) exposeDebug();
  } catch (error) {
    console.error(error);
    dom.boot.classList.add("hidden");
    dom.unsupported.classList.remove("hidden");
  }
}

function setupCameraLight() {
  const light = new THREE.SpotLight(0xffe3bd, 52, 34, 0.6, 0.7, 1.35);
  light.position.set(0, 0, 0.1);
  const target = new THREE.Object3D();
  target.position.set(0.06, -0.2, -8);
  camera.add(light);
  camera.add(target);
  light.target = target;
}

function setupWeapon() {
  gunRoot = new THREE.Group();
  gunRoot.name = "service-pistol";
  camera.add(gunRoot);

  const dark = new THREE.MeshLambertMaterial({ color: 0x05090b });
  const gunmetal = new THREE.MeshLambertMaterial({ color: 0x0d171b });
  const steel = new THREE.MeshLambertMaterial({ color: 0x222d30 });
  const grip = new THREE.MeshLambertMaterial({ color: 0x120f0d });
  const glove = new THREE.MeshLambertMaterial({ color: 0x0b1315 });
  const skin = new THREE.MeshLambertMaterial({ color: 0x6d4632 });

  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.085, 0.38), gunmetal);
  slide.position.set(0, 0.025, -0.12);
  gunRoot.add(slide);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.025, 0.34), steel);
  top.position.set(0, 0.078, -0.12);
  gunRoot.add(top);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 7), dark);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.026, -0.34);
  gunRoot.add(barrel);
  const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.23, 0.11), grip);
  gripMesh.position.set(0, -0.12, 0.015);
  gripMesh.rotation.x = -0.18;
  gunRoot.add(gripMesh);
  const trigger = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 4, 8), dark);
  trigger.rotation.y = Math.PI / 2;
  trigger.position.set(0, -0.055, -0.06);
  gunRoot.add(trigger);
  const sightFront = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.018, 0.018), steel);
  sightFront.position.set(0, 0.098, -0.29);
  gunRoot.add(sightFront);
  const sightRearL = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.022, 0.018), steel);
  sightRearL.position.set(-0.03, 0.099, -0.04);
  gunRoot.add(sightRearL);
  const sightRearR = sightRearL.clone();
  sightRearR.position.x = 0.03;
  gunRoot.add(sightRearR);
  // extended magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.07, 0.12), dark);
  mag.position.set(0, -0.245, 0.015);
  gunRoot.add(mag);

  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.19, 0.16), glove);
  hand.position.set(0.01, -0.15, 0.08);
  hand.rotation.z = -0.12;
  gunRoot.add(hand);
  const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.12, 0.05), glove);
  fingers.position.set(-0.012, -0.115, -0.045);
  fingers.rotation.x = 0.18;
  gunRoot.add(fingers);
  const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.045), skin);
  thumb.position.set(-0.058, -0.075, 0.055);
  thumb.rotation.z = -0.3;
  gunRoot.add(thumb);
  // bright front bead so the sight picture reads at a glance
  const bead = new THREE.Mesh(
    new THREE.SphereGeometry(0.011, 6, 4),
    new THREE.MeshBasicMaterial({ color: 0xffb45c, toneMapped: false })
  );
  bead.position.set(0, 0.114, -0.292);
  gunRoot.add(bead);
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.22), new THREE.MeshLambertMaterial({ color: 0x1a2b31 }));
  sleeve.position.set(0.065, -0.34, 0.2);
  sleeve.rotation.x = -0.35;
  gunRoot.add(sleeve);

  gunMuzzle = new THREE.Object3D();
  gunMuzzle.position.set(0, 0.026, -0.4);
  gunRoot.add(gunMuzzle);

  const flashMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    color: 0xffb45c,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  gunFlash = new THREE.Sprite(flashMat);
  gunFlash.scale.set(0.48, 0.48, 1);
  gunFlash.position.copy(gunMuzzle.position);
  gunFlash.visible = false;
  gunRoot.add(gunFlash);

  gunLight = new THREE.PointLight(0xffb45c, 0, 7, 2);
  gunLight.position.copy(gunMuzzle.position);
  gunRoot.add(gunLight);

  gunRoot.visible = false;
  layoutWeapon();
}

function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.2, "rgba(255,247,214,.98)");
  g.addColorStop(0.5, "rgba(255,170,62,.48)");
  g.addColorStop(1, "rgba(255,120,20,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function layoutWeapon() {
  if (!gunRoot) return;
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  if (aspect < 0.62) {
    gunRoot.position.set(0.145, -0.34, -0.95);
    gunRoot.rotation.set(0.05, 0.1, -0.02);
    gunRoot.scale.setScalar(0.64);
  } else if (aspect < 0.95) {
    gunRoot.position.set(0.18, -0.34, -0.94);
    gunRoot.rotation.set(0.045, 0.11, -0.018);
    gunRoot.scale.setScalar(0.68);
  } else if (aspect < 1.35) {
    gunRoot.position.set(0.27, -0.35, -0.95);
    gunRoot.rotation.set(0.04, 0.12, -0.015);
    gunRoot.scale.setScalar(0.72);
  } else {
    gunRoot.position.set(0.4, -0.36, -0.98);
    gunRoot.rotation.set(0.035, 0.14, -0.012);
    gunRoot.scale.setScalar(0.74);
  }
}

function setupEffects() {
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xffd09a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    scene.add(line);
    tracers.push({ line, life: 0, maxLife: 0.095 });
  }
  for (let i = 0; i < 48; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color: 0xffc06b,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }));
    sprite.scale.set(0.08, 0.08, 1);
    sprite.visible = false;
    scene.add(sprite);
    sparkPool.push({
      sprite,
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 0.3,
      gravity: 4,
      scale: 0.1,
    });
  }
  for (let i = 0; i < 6; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color: 0xff914d,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }));
    sprite.visible = false;
    scene.add(sprite);
    muzzles.push({ sprite, life: 0 });
  }
}

function setupAmmoPips() {
  dom.ammoPips.innerHTML = "";
  for (let i = 0; i < state.maxAmmo; i++) {
    const pip = document.createElement("i");
    pip.className = "live";
    dom.ammoPips.appendChild(pip);
  }
}

function bindUI() {
  dom.start.addEventListener("click", () => {
    audio.init().catch(() => {});
    startRun();
  });
  dom.soundToggle.addEventListener("click", async () => {
    await audio.init().catch(() => {});
    audio.setEnabled(!audio.enabled);
    updateSoundUI();
  });
  dom.tiltToggle.addEventListener("click", () => toggleTilt());
  dom.pauseTilt.addEventListener("click", () => toggleTilt());
  dom.pause.addEventListener("click", pauseGame);
  dom.recenter.addEventListener("click", () => recenterTilt(true));
  dom.resume.addEventListener("click", resumeGame);
  dom.restartPause.addEventListener("click", startRun);
  dom.quit.addEventListener("click", goMenu);
  dom.retry.addEventListener("click", startRun);
  dom.endMenu.addEventListener("click", goMenu);
  dom.reload.addEventListener("click", reload);
  dom.fire.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (state.mode !== "playing") return;
    state.firing = true;
    shoot();
  });
  const stopFiring = (e) => {
    if (e.target === dom.fire || state.firing) state.firing = false;
  };
  dom.fire.addEventListener("pointerup", stopFiring);
  dom.fire.addEventListener("pointercancel", stopFiring);
  dom.fire.addEventListener("pointerleave", () => { state.firing = false; });

  window.addEventListener("pointerdown", onPointerDown, { passive: false });
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp, { passive: false });
  window.addEventListener("pointercancel", onPointerUp, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 80));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && (state.mode === "playing" || state.mode === "transition")) pauseGame();
  });
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("blur", () => { state.firing = false; });
}

async function toggleTilt() {
  if (tilt.requesting) return;
  if (tilt.enabled) {
    disableTilt();
    return;
  }
  if (!tilt.supported) {
    showToast("INCLINACIÓN NO DISPONIBLE", "bad");
    updateTiltUI();
    return;
  }
  tilt.requesting = true;
  try {
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === "function") {
      const permission = await DOE.requestPermission();
      if (permission !== "granted") {
        showToast("PERMISO DE MOVIMIENTO DENEGADO", "bad");
        tilt.requesting = false;
        updateTiltUI();
        return;
      }
    }
    enableTilt();
  } catch (error) {
    console.warn("Motion permission failed", error);
    showToast("NO SE PUDO ACTIVAR EL TILT", "bad");
  } finally {
    tilt.requesting = false;
    updateTiltUI();
  }
}

function enableTilt() {
  tilt.enabled = true;
  tilt.awaitingCenter = true;
  tilt.hasData = false;
  tilt.originX = 0;
  tilt.originY = 0;
  window.addEventListener("deviceorientation", onOrientation, true);
  showToast("INCLINA EL MÓVIL PARA APUNTAR");
  audio.init().catch(() => {});
  updateTiltUI();
  if (state.mode === "menu") state.aimSeenTilt = true;
}

function disableTilt() {
  tilt.enabled = false;
  tilt.awaitingCenter = false;
  window.removeEventListener("deviceorientation", onOrientation, true);
  showToast("CONTROL POR TILT DESACTIVADO");
  updateTiltUI();
}

function onOrientation(event) {
  if (event.gamma == null && event.beta == null) return;
  tilt.rawBeta = event.beta || 0;
  tilt.rawGamma = event.gamma || 0;
  tilt.hasData = true;
  const angle = (screen.orientation && screen.orientation.angle != null)
    ? screen.orientation.angle
    : (window.orientation || 0);
  tilt.angle = Number(angle) || 0;
  if (tilt.awaitingCenter) {
    tilt.baseBeta = tilt.rawBeta;
    tilt.baseGamma = tilt.rawGamma;
    tilt.originX = 0;
    tilt.originY = 0;
    tilt.awaitingCenter = false;
    if (state.mode === "playing") showToast("TILT CALIBRADO", "gold");
  }
}

function recenterTilt(announce = false) {
  if (!tilt.enabled) return;
  if (!tilt.hasData) {
    if (announce) showToast("MUEVE EL MÓVIL PARA CALIBRAR", "bad");
    return;
  }
  tilt.baseBeta = tilt.rawBeta;
  tilt.baseGamma = tilt.rawGamma;
  tilt.originX = 0;
  tilt.originY = 0;
  tilt.awaitingCenter = false;
  aim.x = 0;
  aim.y = 0;
  if (announce) showToast("PUNTO DE MIRA CENTRADO", "gold");
}

// ---------- run lifecycle ----------

function startRun() {
  if (!renderer || !world || !gunRoot) {
    pendingStart = true;
    return;
  }
  pendingStart = false;
  cleanupEnemies();
  resetRun();
  state.mode = "playing";
  state.cameraBaseZ = 17.6;
  state.cameraMove = { from: 17.6, to: WAVES[0].camZ, t: 0, dur: 1.35 };
  state.endTimer = -1;
  state.endShown = false;
  state.victoryPush = 0;
  state.deathCam = 0;
  aim.x = 0;
  aim.y = 0;
  cameraShake = 0;
  recoil = 0;
  state.controlHintTimer = 7;
  dom.controlHint.style.opacity = "1";
  dom.menu.classList.add("hidden");
  dom.pauseScreen.classList.add("hidden");
  dom.endScreen.classList.add("hidden");
  dom.hud.classList.remove("hidden");
  dom.reticle.style.opacity = "1";
  document.body.classList.add("playing");
  gunRoot.visible = true;
  audio.setIntensity(0.45);
  if (audio.ctx?.state === "suspended") audio.ctx.resume();
  beginWave(0);
  updateHud(true);
}

function resetRun() {
  state.waveIndex = -1;
  state.waveClock = 0;
  state.pendingClear = -1;
  state.transitionTimer = 0;
  state.nextWave = -1;
  state.score = 0;
  state.health = 100;
  state.ammo = state.maxAmmo;
  state.combo = 0;
  state.multiplier = 1;
  state.bestCombo = 1;
  state.shots = 0;
  state.hits = 0;
  state.kills = 0;
  state.reloading = false;
  state.reloadTimer = 0;
  state.autoReload = -1;
  state.fireCooldown = 0;
  state.damageCooldown = 0;
  state.firing = false;
  state.bossEntry = null;
  state.bannerTimer = 0;
  state.pendingNewBest = false;
  state.hostageWarned = false;
  dom.bossPanel.classList.add("hidden");
  dom.waveBanner.classList.remove("on");
  dom.reticle.classList.remove("hot", "head", "civil", "reloading", "shoot");
  dom.lowAmmo.classList.remove("on");
  dom.healthPanel.classList.remove("low");
  dom.toastStack.innerHTML = "";
  dom.busted.innerHTML = "";
  dom.damageLayer.innerHTML = "";
  dom.damageFlash.classList.remove("on");
  dom.hitFlash.classList.remove("on");
  updateAmmoUI();
  updateHealthUI();
}

function goMenu() {
  cleanupEnemies();
  state.mode = "menu";
  state.firing = false;
  state.reloading = false;
  state.firing = false;
  state.cameraMove = null;
  state.cameraBaseZ = 17.6;
  state.bannerTimer = 0;
  state.pendingClear = -1;
  dom.menu.classList.remove("hidden");
  dom.hud.classList.add("hidden");
  dom.pauseScreen.classList.add("hidden");
  dom.endScreen.classList.add("hidden");
  dom.waveBanner.classList.remove("on");
  dom.bossPanel.classList.add("hidden");
  dom.toastStack.innerHTML = "";
  document.body.classList.remove("playing");
  gunRoot.visible = false;
  cameraShake = 0;
  recoil = 0;
  aim.x = 0;
  aim.y = 0;
  state.firing = false;
  updateBestDisplay();
  audio.setIntensity(0.2);
}

function pauseGame() {
  if (state.mode !== "playing" && state.mode !== "transition") return;
  state.prevMode = state.mode;
  state.mode = "paused";
  state.firing = false;
  dom.pause.classList.remove("hidden");
  dom.pauseScreen.classList.remove("hidden");
  document.body.classList.remove("playing");
  dom.pauseScore.textContent = pad(state.score);
  dom.pauseAccuracy.textContent = accuracy() + "%";
  dom.pauseWave.textContent = `${Math.max(1, state.waveIndex + 1)}/${WAVES.length}`;
  updateTiltUI();
  audio.ui();
}

function resumeGame() {
  if (state.mode !== "paused") return;
  state.mode = state.prevMode;
  dom.pauseScreen.classList.add("hidden");
  dom.pause.classList.remove("hidden");
  document.body.classList.add("playing");
  state.lastTime = performance.now();
  audio.ui();
}

function cleanupEnemies() {
  for (const enemy of enemies) enemy.dispose();
  enemies = [];
  waveEntries = [];
  spawnQueue = [];
  state.bossEntry = null;
  dom.bossPanel.classList.add("hidden");
}

function beginWave(index) {
  if (index >= WAVES.length) {
    triggerVictory();
    return;
  }
  cleanupEnemies();
  const wave = WAVES[index];
  state.mode = "playing";
  state.waveIndex = index;
  state.waveClock = 0;
  state.pendingClear = -1;
  state.nextWave = -1;
  state.transitionTimer = 0;
  state.bossEntry = null;
  dom.zoneLabel.textContent = wave.zone;
  dom.waveLabel.textContent = `OLEADA ${String(index + 1).padStart(2, "0")} / 04`;
  dom.objectiveText.textContent = wave.objective;
  dom.bossPanel.classList.add("hidden");
  waveEntries = wave.enemies.map((spec, i) => ({ spec, enemy: null, index: i }));
  spawnQueue = wave.enemies.map((spec, i) => ({ spec, index: i, delay: spec.delay }));
  buildWavePips();
  showBanner(`OLEADA ${String(index + 1).padStart(2, "0")}`, wave.title, wave.sub, 1900);
  audio.waveStart();
  audio.setIntensity(index === WAVES.length - 1 ? 1 : 0.45 + index * 0.12);
  updateHud(true);
}

function buildWavePips() {
  dom.wavePips.innerHTML = "";
  for (const entry of waveEntries) {
    const pip = document.createElement("i");
    pip.className = "alive";
    if (entry.spec.type === "boss") pip.classList.add("boss");
    if (entry.spec.type === "hostage") pip.classList.add("hostage");
    dom.wavePips.appendChild(pip);
    entry.pip = pip;
  }
}

function updateWavePips() {
  for (const entry of waveEntries) {
    if (!entry.pip) continue;
    const enemy = entry.enemy;
    const alive = !enemy || (!enemy.dead && !enemy.isHostage);
    entry.pip.classList.toggle("alive", alive);
    if (entry.spec.type === "hostage") {
      entry.pip.classList.toggle("alive", !!enemy && !enemy.hostageHitOnce);
    }
  }
}

function spawnEnemy(item) {
  const wave = WAVES[state.waveIndex];
  const spec = item.spec;
  const entry = waveEntries[item.index];
  if (!spec || !entry) return;
  const enemy = new Enemy({
    scene,
    camera,
    type: spec.type,
    spawn: spec.spawn,
    mark: spec.mark,
    index: item.index,
    onFire: handleEnemyFire,
  });
  entry.enemy = enemy;
  enemies.push(enemy);
  if (spec.type === "boss") {
    state.bossEntry = entry;
    showToast("OBJETIVO A LA VISTA: EL BARÓN", "gold");
  }
  if (spec.type === "hostage" && !state.hostageWarned) {
    state.hostageWarned = true;
    showToast("REHÉN EN LA LÍNEA DE FUEGO", "bad");
  }
  updateWavePips();
}

function checkWaveClear() {
  if (state.mode !== "playing") return;
  if (spawnQueue.length > 0) return;
  const alive = enemies.filter((e) => !e.isHostage && !e.dead).length;
  if (alive > 0) {
    state.pendingClear = -1;
    return;
  }
  if (state.pendingClear < 0) state.pendingClear = 0.65;
}

function completeWave() {
  const wave = WAVES[state.waveIndex];
  state.pendingClear = -1;
  state.firing = false;
  let bonus = 500;
  const hostage = enemies.find((e) => e.isHostage);
  if (hostage && !hostage.hostageHitOnce) {
    bonus += 250;
    showToast("REHÉN A SALVO  +250", "gold");
  }
  state.score += bonus;
  state.mode = "transition";
  state.transitionTimer = 0;
  state.nextWave = state.waveIndex + 1;
  state.defused = false;
  for (const enemy of enemies) {
    enemy.cooldown = 999;
    enemy.threat = false;
    enemy.warning.visible = false;
    enemy.laser.visible = false;
  }
  updateHud(true);
  if (state.waveIndex >= WAVES.length - 1) {
    triggerVictory();
    return;
  }
  const next = WAVES[state.nextWave];
  state.cameraMove = { from: state.cameraBaseZ, to: next.camZ, t: 0, dur: 2.25 };
  showBanner("ZONA LIMPIA", wave.title, `+${bonus} · AVANZANDO`, 1900);
  audio.waveClear();
  updateHud(true);
}

function triggerVictory() {
  if (state.mode === "victory") return;
  state.mode = "victory";
  state.firing = false;
  state.victoryPush = 0;
  state.endTimer = 2.25;
  state.endShown = false;
  state.pendingNewBest = false;
  dom.bossPanel.classList.add("hidden");
  dom.waveBanner.classList.remove("on");
  showBanner("DISTRITO 9", "BANCO ASEGURADO", "EL BARÓN ESTÁ FUERA DE COMBATE", 2300);
  for (const enemy of enemies) {
    enemy.cooldown = 999;
    enemy.threat = false;
    enemy.laser.visible = false;
    enemy.warning.visible = false;
  }
  audio.victory();
  audio.setIntensity(0.2);
}

function triggerGameOver() {
  if (state.mode === "gameover") return;
  state.mode = "gameover";
  state.firing = false;
  state.reloading = false;
  state.endTimer = 1.55;
  state.endShown = false;
  state.deathCam = 0;
  for (const enemy of enemies) {
    enemy.cooldown = 999;
    enemy.threat = false;
    enemy.laser.visible = false;
    enemy.warning.visible = false;
  }
  dom.bossPanel.classList.add("hidden");
  dom.reticle.style.opacity = "0";
  dom.waveBanner.classList.remove("on");
  showBanner("OFICIAL CAÍDO", "SERVICIO INTERRUMPIDO", "LA BANDA SIGUE DENTRO", 2000);
  audio.gameOver();
}

function showEndScreen(win) {
  if (state.endShown) return;
  state.endShown = true;
  state.firing = false;
  const acc = accuracy();
  const previousBest = Number(storage.get("cdl-best-score", "0")) || 0;
  const isBest = state.score > previousBest;
  if (isBest) storage.set("cdl-best-score", String(state.score));
  updateBestDisplay();
  const rank = rankFor(state.score, acc, win);
  dom.endKicker.textContent = win ? "PARTE FINAL" : "PARTE DE INCIDENCIAS";
  dom.endTitle.textContent = win ? "BANCO ASEGURADO" : "TE HAN TUMBADO";
  dom.endTitle.className = win ? "win" : "fail";
  dom.endText.textContent = win
    ? "El Distrito 9 respira. El Barón y su banda ya no van a ninguna parte."
    : "La banda sigue dentro. El Distrito 9 necesita otra ronda.";
  dom.endScore.textContent = pad(state.score);
  dom.endAccuracy.textContent = acc + "%";
  dom.endKills.textContent = String(state.kills);
  dom.endCombo.textContent = `x${state.bestCombo}`;
  dom.endRank.textContent = rank;
  dom.newBest.classList.toggle("hidden", !isBest);
  dom.endScreen.classList.remove("hidden");
  dom.pause.classList.add("hidden");
  dom.reticle.style.opacity = "0";
  document.body.classList.remove("playing");
  audio.ui();
}

function rankFor(score, acc, win) {
  if (score >= 12000 && acc >= 58) return "S";
  if (score >= 8500 || (win && acc >= 62)) return "A";
  if (score >= 5500 || win) return "B";
  if (score >= 3000 || acc >= 45) return "C";
  return "D";
}

function accuracy() {
  if (!state.shots) return 0;
  return Math.round((state.hits / state.shots) * 100);
}

function updateBestDisplay() {
  const best = Number(storage.get("cdl-best-score", "0")) || 0;
  dom.best.textContent = pad(best);
  const rank = best >= 12000 ? "S" : best >= 8500 ? "A" : best >= 5500 ? "B" : best >= 3000 ? "C" : "CADETE";
  dom.bestRank.textContent = rank === "CADETE" ? rank : `RANGO ${rank}`;
}

// ---------- main loop ----------

function loop(now) {
  requestAnimationFrame(loop);
  const rawDt = (now - state.lastTime) / 1000;
  state.lastTime = now;
  const dt = clamp(Number.isFinite(rawDt) ? rawDt : 0.016, 0, 0.1);
  trackFrame(rawDt, now);
  if (state.mode !== "paused") {
    state.elapsed += dt;
    updateCamera(dt, state.elapsed);
    world.update(dt, state.elapsed, camera);
    updateGame(dt, state.elapsed);
    updateWeapon(dt, state.elapsed);
    updateEffects(dt);
  }
  updateReticle();
  const renderStart = performance.now();
  renderer?.render(scene, camera);
  if (url.searchParams.has("debug") && perf.frames < 4) {
    perf.frames++;
    console.log(`[render] frame ${perf.frames} ${Math.round(performance.now() - renderStart)}ms`);
  }
}

function trackFrame(rawDt, now) {
  if (!renderer) return;
  const ms = Math.min(120, (Number.isFinite(rawDt) ? rawDt : 0.016) * 1000);
  perf.frameAvg += (ms - perf.frameAvg) * (ms > 250 ? 0.2 : 0.08);
  perf.fps = 1000 / Math.max(1, perf.frameAvg);
  perf.sinceAdjust += ms / 1000;
  if (perf.sinceAdjust < 1.4) return;
  perf.sinceAdjust = 0;
  if (!perf.auto) return;
  let next = perf.scale;
  if (perf.frameAvg > 30 && perf.scale > perf.minScale) {
    next = Math.max(perf.minScale, perf.scale * (perf.frameAvg > 70 ? 0.72 : 0.88));
  } else if (perf.frameAvg < 20 && perf.scale < perf.baseScale) {
    next = Math.min(perf.baseScale, perf.scale * 1.07);
  }
  if (Math.abs(next - perf.scale) > 0.01) {
    perf.scale = next;
    applyRenderSize();
  }
  perf.drawCalls = renderer.info.render.calls;
  perf.triangles = renderer.info.render.triangles;
}

function updateCamera(dt, time) {
  if (!camera) return;
  let z = state.cameraBaseZ;
  if (state.cameraMove) {
    const move = state.cameraMove;
    move.t += dt / move.dur;
    const t = clamp(move.t, 0, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    z = THREE.MathUtils.lerp(move.from, move.to, eased);
    if (t >= 1) {
      state.cameraBaseZ = move.to;
      state.cameraMove = null;
    }
  }

  cameraShake *= Math.exp(-dt * 7.5);
  const shake = cameraShake;
  let x = 0;
  let y = 2.38;
  let lookY = 2.06;
  let roll = 0;
  let menuBob = 0;

  if (state.mode === "menu" || state.mode === "boot") {
    z = 17.6 + Math.sin(time * 0.14) * 0.5;
    x = Math.sin(time * 0.19) * 0.13;
    y = 2.35 + Math.sin(time * 0.31) * 0.025;
    lookY = 3.0;
  } else if (state.mode === "gameover") {
    state.deathCam = Math.min(1, state.deathCam + dt * 0.9);
    y = THREE.MathUtils.lerp(2.38, 1.12, state.deathCam);
    lookY = THREE.MathUtils.lerp(2.06, 1.15, state.deathCam);
    roll = state.deathCam * 0.18;
  } else if (state.mode === "victory") {
    state.victoryPush += dt;
    z -= Math.min(3.2, state.victoryPush * 0.22);
    y = 2.38;
    lookY = 2.35;
  } else if (state.mode === "paused") {
    y = 2.38;
  } else {
    menuBob = Math.sin(time * 0.8) * 0.018;
    x = Math.sin(time * 0.46) * 0.022;
    y = 2.38 + menuBob;
    lookY = 2.06;
  }

  if (shake > 0.0001) {
    x += (Math.random() - 0.5) * shake;
    y += (Math.random() - 0.5) * shake * 0.7;
    roll += (Math.random() - 0.5) * shake * 0.5;
  }

  camera.position.set(x, y, z);
  camera.lookAt(x * 0.25, lookY + recoil * 0.006, z - 18);
  camera.rotation.z += roll;
  camera.updateMatrixWorld(true);
}

function updateWeapon(dt, time) {
  if (!gunRoot || !gunRoot.visible) return;
  recoil = Math.max(0, recoil - dt * 7.6);
  const breatheX = Math.sin(time * 1.55) * 0.0025;
  const breatheY = Math.cos(time * 1.25) * 0.002;
  gunRoot.position.x += (layoutX() + breatheX + (aim.x * 0.012) - gunRoot.position.x) * Math.min(1, dt * 7);
  gunRoot.position.y += (layoutY() + breatheY - recoil * 0.012 + aim.y * 0.006 - gunRoot.position.y) * Math.min(1, dt * 7);
  gunRoot.position.z = layoutZ() + recoil * 0.018;
  gunRoot.rotation.x = layoutRX() - recoil * 0.07;
  gunRoot.rotation.y = layoutRY() - aim.x * 0.018;
  gunRoot.rotation.z = layoutRZ() + aim.x * 0.008;
  if (gunLight) gunLight.intensity = Math.max(0, gunLight.intensity - dt * 520);
  if (gunFlash && gunFlash.visible) {
    state.gunFlashTimer -= dt;
    gunFlash.scale.x = 0.4 + Math.random() * 0.18;
    gunFlash.scale.y = 0.4 + Math.random() * 0.18;
    if (state.gunFlashTimer <= 0) gunFlash.visible = false;
  }
}

function layoutX() {
  const a = window.innerWidth / Math.max(1, window.innerHeight);
  return a < 0.62 ? 0.135 : a < 0.95 ? 0.175 : a < 1.35 ? 0.27 : 0.4;
}
function layoutY() {
  const a = window.innerWidth / Math.max(1, window.innerHeight);
  return a < 0.95 ? -0.34 : -0.36;
}
function layoutZ() {
  const a = window.innerWidth / Math.max(1, window.innerHeight);
  return a < 0.95 ? -0.94 : -0.98;
}
function layoutRX() {
  return 0.03;
}
function layoutRY() {
  const a = window.innerWidth / Math.max(1, window.innerHeight);
  return a < 0.62 ? 0.1 : a < 0.95 ? 0.11 : a < 1.35 ? 0.12 : 0.14;
}
function layoutRZ() {
  return -0.02;
}

function updateEffects(dt) {
  for (const tr of tracers) {
    if (tr.life > 0) {
      tr.life -= dt;
      tr.line.material.opacity = Math.max(0, tr.life / tr.maxLife) * 0.85;
      if (tr.life <= 0) tr.line.visible = false;
    }
  }
  for (const p of sparkPool) {
    if (p.life > 0) {
      p.life -= dt;
      p.sprite.position.addScaledVector(p.vel, dt);
      p.vel.y -= p.gravity * dt;
      p.sprite.material.opacity = Math.max(0, p.life / p.maxLife);
      const s = p.scale * (0.5 + p.life / p.maxLife);
      p.sprite.scale.set(s, s, 1);
      if (p.life <= 0) p.sprite.visible = false;
    }
  }
  for (const m of muzzles) {
    if (m.life > 0) {
      m.life -= dt;
      m.sprite.material.opacity = Math.max(0, m.life / 0.09);
      if (m.life <= 0) m.sprite.visible = false;
    }
  }
  if (dom.hitFlash.classList.contains("on")) {
    // handled by timeout, class remains until CSS transition only
  }
}

function updateGame(dt, time) {
  if (state.mode === "paused" || state.mode === "menu" || state.mode === "boot") return;
  state.fireCooldown = Math.max(0, state.fireCooldown - dt);
  state.damageCooldown = Math.max(0, state.damageCooldown - dt);
  state.bannerTimer = Math.max(0, state.bannerTimer - dt);
  if (state.bannerTimer === 0) dom.waveBanner.classList.remove("on");

  if (state.mode === "playing" || state.mode === "transition" || state.mode === "gameover" || state.mode === "victory") {
    if (state.controlHintTimer > 0) {
      state.controlHintTimer -= dt;
      if (state.controlHintTimer <= 0) dom.controlHint.style.opacity = "0";
    }
    updateAimFromTilt(dt);
    updateEnemies(dt, time);
    updateBossUI();
  }

  if (state.mode === "playing") {
    state.waveClock += dt;
    while (spawnQueue.length && spawnQueue[0].delay <= state.waveClock) {
      const item = spawnQueue.shift();
      spawnEnemy(item);
    }

    if (state.reloading) {
      state.reloadTimer += dt;
      const progress = clamp(state.reloadTimer / state.reloadDuration, 0, 1);
      dom.reloadBar.style.width = `${progress * 100}%`;
      dom.reticle.classList.add("reloading");
      dom.fire.classList.add("reloading");
      if (state.reloadTimer >= state.reloadDuration) finishReload();
    } else {
      dom.reticle.classList.remove("reloading");
      dom.fire.classList.remove("reloading");
      state.autoReload -= dt;
      if (state.autoReload <= 0 && state.ammo <= 0) {
        state.autoReload = -1;
        reload();
      }
    }

    if (state.firing) shoot();

    if (state.pendingClear > 0) {
      state.pendingClear = Math.max(0, state.pendingClear - dt);
      if (state.pendingClear === 0) completeWave();
    } else {
      checkWaveClear();
    }
    updateHud();
    updateReticleTarget(dt);
  } else if (state.mode === "transition") {
    state.transitionTimer += dt;
    if (state.transitionTimer > 2.15 && state.nextWave >= 0) {
      const next = state.nextWave;
      state.nextWave = -1;
      beginWave(next);
    }
    updateHud();
  } else if (state.mode === "gameover" || state.mode === "victory") {
    updateHud();
    if (state.endTimer > 0) {
      state.endTimer -= dt;
      if (state.endTimer <= 0) {
        const win = state.mode === "victory";
        showEndScreen(win);
      }
    }
  }
}

function updateAimFromTilt(dt) {
  if (!tilt.enabled || !tilt.hasData) return;
  if (state.mode !== "playing" && state.mode !== "transition") return;
  const a = tilt.angle || 0;
  let dh = tilt.rawGamma - tilt.baseGamma;
  let dv = tilt.rawBeta - tilt.baseBeta;
  if (a === 90) {
    dh = tilt.rawBeta - tilt.baseBeta;
    dv = -(tilt.rawGamma - tilt.baseGamma);
  } else if (a === -90 || a === 270) {
    dh = -(tilt.rawBeta - tilt.baseBeta);
    dv = tilt.rawGamma - tilt.baseGamma;
  } else if (Math.abs(a) === 180) {
    dh = -(tilt.rawGamma - tilt.baseGamma);
    dv = -(tilt.rawBeta - tilt.baseBeta);
  }
  const targetX = clamp(tilt.originX + dh / 23, -0.94, 0.94);
  const targetY = clamp(tilt.originY + dv / 23, -0.84, 0.88);
  if (!touch) {
    aim.x = damp(aim.x, targetX, 8, dt);
    aim.y = damp(aim.y, targetY, 8, dt);
  }
}

function updateEnemies(dt, time) {
  for (const enemy of enemies) {
    enemy.update(dt, time);
    enemy.updateEffects(dt);
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].removed) {
      enemies[i].dispose();
      enemies.splice(i, 1);
    }
  }
  updateWavePips();
}

function updateBossUI() {
  const boss = enemies.find((e) => e.isBoss && !e.dead);
  if (!boss) {
    dom.bossPanel.classList.add("hidden");
    return;
  }
  dom.bossPanel.classList.remove("hidden");
  dom.bossBar.style.width = `${clamp(boss.health / boss.maxHealth, 0, 1) * 100}%`;
}

// ---------- input ----------

function onPointerDown(event) {
  if (state.mode !== "playing") return;
  if (event.target.closest?.("button, .overlay, .menu")) return;
  if (event.pointerType === "mouse") {
    if (event.button !== 0) return;
    mouseDown = true;
    aimAtClient(event.clientX, event.clientY);
    state.firing = true;
    shoot();
    event.preventDefault();
  } else if (event.pointerType === "touch" || event.pointerType === "pen") {
    if (touch) return;
    touch = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      startAimX: aim.x,
      startAimY: aim.y,
      moved: 0,
      startTime: performance.now(),
    };
    event.preventDefault();
  }
}

function onPointerMove(event) {
  if (state.mode !== "playing") return;
  if (event.pointerType === "mouse") {
    if (event.target.closest?.("button")) return;
    aimAtClient(event.clientX, event.clientY);
    return;
  }
  if (!touch || event.pointerId !== touch.id) return;
  const dx = event.clientX - touch.lastX;
  const dy = event.clientY - touch.lastY;
  touch.lastX = event.clientX;
  touch.lastY = event.clientY;
  touch.moved += Math.hypot(dx, dy);
  if (touch.moved < 2) return;
  if (tilt.enabled && tilt.hasData) {
    tilt.originX = clamp(tilt.originX + dx / (window.innerWidth * 0.34), -1.05, 1.05);
    tilt.originY = clamp(tilt.originY - dy / (window.innerHeight * 0.34), -1.05, 1.05);
  } else {
    aim.x = clamp(aim.x + dx / (window.innerWidth * 0.34), -0.94, 0.94);
    aim.y = clamp(aim.y - dy / (window.innerHeight * 0.34), -0.84, 0.88);
  }
  event.preventDefault();
}

function onPointerUp(event) {
  if (event.pointerType === "mouse") {
    mouseDown = false;
    state.firing = false;
    return;
  }
  if (!touch || event.pointerId !== touch.id) {
    if (state.mode === "playing") state.firing = false;
    return;
  }
  const dx = event.clientX - touch.startX;
  const dy = event.clientY - touch.startY;
  const duration = performance.now() - touch.startTime;
  const tap = Math.hypot(dx, dy) < 10 && touch.moved < 12 && duration < 280;
  if (tap && state.mode === "playing") {
    if (!tilt.enabled || !tilt.hasData) aimAtClient(event.clientX, event.clientY);
    shoot();
  }
  touch = null;
  state.firing = false;
}

function aimAtClient(clientX, clientY) {
  aim.x = clamp((clientX / window.innerWidth) * 2 - 1, -0.94, 0.94);
  aim.y = clamp(-(clientY / window.innerHeight) * 2 + 1, -0.84, 0.88);
}

function onKeyDown(event) {
  if (event.code === "Escape" || event.code === "KeyP") {
    if (state.mode === "playing" || state.mode === "transition") {
      pauseGame();
      event.preventDefault();
    } else if (state.mode === "paused") {
      resumeGame();
      event.preventDefault();
    }
  }
  if (event.code === "KeyR" && state.mode === "playing") {
    reload();
    event.preventDefault();
  }
  if (event.code === "Space" && state.mode === "playing") {
    state.firing = true;
    shoot();
    event.preventDefault();
  }
}

function onKeyUp(event) {
  if (event.code === "Space") state.firing = false;
}

// ---------- shooting ----------

function shoot() {
  if (state.mode !== "playing" || state.reloading) return;
  if (state.fireCooldown > 0) return;
  if (state.ammo <= 0) {
    audio.dry();
    if (state.autoReload < 0) state.autoReload = 0.28;
    return;
  }
  state.ammo--;
  state.shots++;
  state.fireCooldown = 0.185;
  recoil = 1;
  cameraShake = Math.max(cameraShake, 0.055);
  state.damageCooldown = Math.max(0, state.damageCooldown);
  audio.shot();
  if (navigator.vibrate) navigator.vibrate(8);
  gunFlash.visible = true;
  state.gunFlashTimer = 0.055;
  gunFlash.material.rotation = Math.random() * Math.PI;
  gunFlash.scale.set(0.4 + Math.random() * 0.14, 0.4 + Math.random() * 0.14, 1);
  gunLight.intensity = 26;
  dom.fire.classList.remove("firing");
  void dom.fire.offsetWidth;
  dom.fire.classList.add("firing");
  setTimeout(() => dom.fire.classList.remove("firing"), 95);
  dom.reticle.classList.remove("shoot");
  void dom.reticle.offsetWidth;
  dom.reticle.classList.add("shoot");
  updateAmmoUI();
  if (state.ammo <= 0) state.autoReload = 0.42;

  raycastShot();
}

function raycastShot() {
  aimNDC.set(aim.x, aim.y);
  raycaster.setFromCamera(aimNDC, camera);
  raycaster.far = 100;
  const enemyMeshes = [];
  for (const enemy of enemies) {
    if (!enemy.dead) enemyMeshes.push(...enemy.hitMeshes);
  }
  const enemyHits = raycaster.intersectObjects(enemyMeshes, false);
  const worldHits = raycaster.intersectObjects(world.hittables, false);
  const enemyHit = enemyHits[0];
  const worldHit = worldHits[0];
  const enemyFirst = enemyHit && (!worldHit || enemyHit.distance < worldHit.distance);
  const hitPoint = enemyFirst ? enemyHit.point : worldHit?.point;
  const endPoint = hitPoint ? hitPoint.clone() : raycaster.ray.at(70, new THREE.Vector3());
  spawnTracer(endPoint);
  spawnMuzzlePuff();

  if (enemyFirst) {
    const enemy = enemyHit.object.userData.enemy;
    const part = enemyHit.object.userData.part || "body";
    if (!enemy || enemy.dead) return;
    state.hits++;
    const isHead = part === "head";
    if (enemy.isHostage) {
      const alreadyHit = enemy.hostageHitOnce;
      enemy.hit(1, part);
      spawnSparks(enemyHit.point, 0xffcc66, 7, 0.11);
      if (!alreadyHit) {
        handleCivilianHit(enemy);
      } else {
        state.combo = 0;
        addFloat(enemyHit.point, "YA HERIDO", "bad", 0.55);
      }
      return;
    }
    const damage = isHead ? 2 : 1;
    const result = enemy.hit(damage, part);
    if (enemy.threat) enemy.threatTimer += 0.12;
    const mult = multiplier();
    state.combo++;
    state.bestCombo = Math.max(state.bestCombo, mult);
    state.score += 10 * mult;
    if (isHead) state.score += 25 * mult;
    spawnSparks(enemyHit.point, isHead ? 0xffcf6b : 0xff9d55, isHead ? 11 : 7, isHead ? 0.15 : 0.1);
    audio.hit(isHead);
    flashHit();
    showHitMarker(isHead);
    if (navigator.vibrate) navigator.vibrate(isHead ? 22 : 12);
    addFloat(enemyHit.point, `+${(isHead ? 35 : 10) * mult}`, isHead ? "head" : "");

    if (result.killed) {
      state.kills++;
      const killScore = Math.round(enemy.data.score * mult);
      state.score += killScore;
      audio.kill();
      stampBusted(enemy);
      if (enemy.isBoss) {
        showToast("EL BARÓN CAÍDO", "gold");
        cameraShake = Math.max(cameraShake, 0.18);
      } else {
        showToast(`+${killScore}  ${ENEMY_TYPES[enemy.type]?.label || "BAJA"}`, isHead ? "gold" : "");
      }
      if (navigator.vibrate) navigator.vibrate([14, 20, 20]);
      state.pendingClear = state.pendingClear < 0 ? 0.65 : state.pendingClear;
    } else {
      addFloat(enemyHit.point, isHead ? "CABEZA" : "IMPACTO", isHead ? "head" : "", 0.55);
    }
    updateHud(true);
  } else {
    if (worldHit) {
      spawnSparks(worldHit.point, 0xffd19a, 5, 0.07);
      const worldNormal = worldHit.face?.normal
        ? worldHit.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(worldHit.object.matrixWorld)).normalize()
        : new THREE.Vector3(0, 0, 1);
      spawnImpactDisc(worldHit.point, worldNormal);
    }
    state.combo = 0;
    updateHud(true);
  }
}

function multiplier() {
  return clamp(1 + Math.floor(state.combo / 4), 1, 8);
}

function updateReticleTarget(dt = 0.016) {
  state.aimHotTimer -= dt;
  if (state.aimHotTimer > 0) return;
  state.aimHotTimer = 0.1;
  aimNDC.set(aim.x, aim.y);
  raycaster.setFromCamera(aimNDC, camera);
  raycaster.far = 75;
  const enemyMeshes = [];
  for (const enemy of enemies) {
    if (!enemy.dead) enemyMeshes.push(...enemy.hitMeshes);
  }
  const enemyHits = enemyMeshes.length ? raycaster.intersectObjects(enemyMeshes, false) : [];
  let target = null;
  if (enemyHits.length) {
    const worldHits = raycaster.intersectObjects(world.hittables, false);
    target = !worldHits[0] || enemyHits[0].distance < worldHits[0].distance ? enemyHits[0].object : null;
  }
  const hostage = target?.userData.enemy?.isHostage;
  const head = target?.userData.part === "head";
  dom.reticle.classList.toggle("hot", !!target && !hostage);
  dom.reticle.classList.toggle("head", head && !hostage);
  dom.reticle.classList.toggle("civil", !!hostage);
}

function spawnTracer(end) {
  const tr = tracers.find((t) => t.life <= 0);
  if (!tr) return;
  camera.updateMatrixWorld(true);
  const start = new THREE.Vector3();
  gunMuzzle.getWorldPosition(start);
  const attr = tr.line.geometry.attributes.position;
  attr.setXYZ(0, start.x, start.y, start.z);
  attr.setXYZ(1, end.x, end.y, end.z);
  attr.needsUpdate = true;
  tr.line.visible = true;
  tr.life = tr.maxLife;
  tr.line.material.opacity = 0.85;
}

function spawnMuzzlePuff() {
  const m = muzzles.find((x) => x.life <= 0);
  if (!m) return;
  camera.updateMatrixWorld(true);
  const start = new THREE.Vector3();
  gunMuzzle.getWorldPosition(start);
  m.sprite.position.copy(start);
  m.sprite.visible = true;
  m.sprite.material.opacity = 0.8;
  m.sprite.scale.set(0.2, 0.2, 1);
  m.life = 0.09;
}

function spawnSparks(point, color, count = 6, spread = 0.08) {
  for (let i = 0; i < count; i++) {
    const spark = sparkPool.find((s) => s.life <= 0);
    if (!spark) break;
    spark.sprite.position.copy(point);
    spark.sprite.position.x += (Math.random() - 0.5) * 0.1;
    spark.sprite.position.y += (Math.random() - 0.5) * 0.1;
    spark.sprite.position.z += (Math.random() - 0.5) * 0.1;
    spark.sprite.material.color.setHex(color);
    spark.sprite.material.opacity = 1;
    spark.sprite.visible = true;
    spark.scale = 0.045 + Math.random() * spread;
    spark.sprite.scale.set(spark.scale, spark.scale, 1);
    spark.vel.set((Math.random() - 0.5) * 2.6, Math.random() * 2.2 + 0.3, (Math.random() - 0.5) * 2.6);
    spark.life = 0.22 + Math.random() * 0.24;
    spark.maxLife = spark.life;
  }
}

const impactDiscs = [];
function spawnImpactDisc(point, normal) {
  const geo = new THREE.CircleGeometry(0.035, 6);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x03080a,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const disc = new THREE.Mesh(geo, mat);
  disc.position.copy(point).addScaledVector(normal || new THREE.Vector3(0, 0, 1), 0.004);
  disc.lookAt(point.clone().add(normal || new THREE.Vector3(0, 0, 1)));
  scene.add(disc);
  impactDiscs.push(disc);
  if (impactDiscs.length > 24) {
    const old = impactDiscs.shift();
    scene.remove(old);
    old.geometry.dispose();
    old.material.dispose();
  }
}

function handleCivilianHit(enemy) {
  state.combo = 0;
  state.score = Math.max(0, state.score - 250);
  audio.civilian();
  flashDamage(0.55);
  showToast("¡CIVIL!  NO DISPARAR  −250", "bad");
  if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
  applyHealthLoss(18, true);
}

function applyHealthLoss(amount, force = false) {
  if (!force && state.damageCooldown > 0) return;
  state.health = Math.max(0, state.health - amount);
  state.damageCooldown = 0.32;
  updateHealthUI();
  if (state.health <= 0) triggerGameOver();
}

function handleEnemyFire(enemy) {
  if (state.mode !== "playing") return;
  audio.enemyShot();
  cameraShake = Math.max(cameraShake, 0.09);
  const accuracyByType = { thug: 0.58, runner: 0.48, heavy: 0.72, boss: 0.8 };
  const chance = accuracyByType[enemy.type] ?? 0.6;
  if (Math.random() < chance) {
    if (state.damageCooldown <= 0) {
      const dmg = enemy.data.damage;
      state.health = Math.max(0, state.health - dmg);
      state.damageCooldown = 0.4;
      state.combo = 0;
      audio.hurt();
      flashDamage(1);
      if (navigator.vibrate) navigator.vibrate([30, 30, 60]);
      updateHealthUI();
      updateHud(true);
      if (state.health <= 0) triggerGameOver();
    }
  } else {
    flashDamage(0.32);
  }
}

function reload() {
  if (state.mode !== "playing" || state.reloading) return;
  if (state.ammo >= state.maxAmmo) return;
  state.reloading = true;
  state.reloadTimer = 0;
  state.autoReload = -1;
  audio.reloadStart();
  dom.reloadTrack.classList.add("on");
  dom.reloadBar.style.width = "0%";
  dom.lowAmmo.classList.remove("on");
}

function finishReload() {
  state.reloading = false;
  state.ammo = state.maxAmmo;
  state.reloadTimer = 0;
  state.autoReload = -1;
  audio.reloadEnd();
  dom.reloadTrack.classList.remove("on");
  dom.reloadBar.style.width = "0%";
  dom.reticle.classList.remove("reloading");
  dom.fire.classList.remove("reloading");
  updateAmmoUI();
}

// ---------- HUD ----------

function updateHud(force = false) {
  dom.score.textContent = pad(state.score);
  const mult = multiplier();
  state.multiplier = mult;
  dom.combo.classList.toggle("on", state.combo >= 4);
  if (state.combo >= 4) dom.combo.querySelector("i").textContent = `x${mult}`;
}

function updateAmmoUI() {
  dom.ammoNow.textContent = String(state.ammo);
  const pips = dom.ammoPips.children;
  for (let i = 0; i < pips.length; i++) {
    pips[i].classList.toggle("live", i < state.ammo);
    pips[i].classList.toggle("empty", i >= state.ammo);
  }
  dom.lowAmmo.classList.toggle("on", state.ammo <= 3 && !state.reloading && state.mode === "playing");
}

function updateHealthUI() {
  dom.healthText.textContent = String(Math.ceil(state.health));
  dom.healthBar.style.width = `${state.health}%`;
  const low = state.health <= 32;
  dom.healthPanel.classList.toggle("low", low);
  dom.healthState.textContent = state.health > 62 ? "ESTABLE" : state.health > 32 ? "HERIDO" : "CRÍTICO";
  if (low) dom.healthBar.style.width = `${state.health}%`;
}

function updateReticle() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const px = (aim.x * 0.5 + 0.5) * w;
  const py = (-aim.y * 0.5 + 0.5) * h;
  dom.reticle.style.transform = `translate(calc(-50% + ${px - w / 2}px), calc(-50% + ${py - h / 2}px))`;
  if (dom.hitMarker.classList.contains("show")) {
    dom.hitMarker.style.left = `${px}px`;
    dom.hitMarker.style.top = `${py}px`;
  }
}

function showHitMarker(head) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  dom.hitMarker.style.left = `${(aim.x * 0.5 + 0.5) * w}px`;
  dom.hitMarker.style.top = `${(-aim.y * 0.5 + 0.5) * h}px`;
  dom.hitMarker.classList.toggle("head", head);
  dom.hitMarker.classList.remove("show");
  void dom.hitMarker.offsetWidth;
  dom.hitMarker.classList.add("show");
}

function flashHit() {
  dom.hitFlash.classList.add("on");
  setTimeout(() => dom.hitFlash.classList.remove("on"), 38);
}

function flashDamage(strength = 1) {
  dom.damageFlash.style.opacity = String(clamp(strength, 0, 1));
  dom.damageFlash.classList.add("on");
  setTimeout(() => {
    dom.damageFlash.classList.remove("on");
    dom.damageFlash.style.opacity = "";
  }, strength > 0.6 ? 110 : 55);
}

function addFloat(worldPoint, text, className = "", lifetime = 0.8) {
  if (!worldPoint) return;
  const screen = projectPoint(worldPoint);
  if (!screen) return;
  const el = document.createElement("div");
  el.className = `float-points ${className}`;
  el.textContent = text;
  el.style.left = `${screen.x}px`;
  el.style.top = `${screen.y}px`;
  el.style.animationDuration = `${lifetime}s`;
  dom.damageLayer.appendChild(el);
  setTimeout(() => el.remove(), lifetime * 1000 + 80);
}

function stampBusted(enemy) {
  const p = new THREE.Vector3();
  enemy.head.getWorldPosition(p);
  p.y += 0.5;
  const screen = projectPoint(p);
  if (!screen) return;
  const el = document.createElement("div");
  el.className = "busted";
  el.textContent = enemy.isBoss ? "BARÓN CAÍDO" : "BUSTED";
  el.style.left = `${screen.x}px`;
  el.style.top = `${screen.y}px`;
  dom.busted.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

function projectPoint(point) {
  projectVec.copy(point).project(camera);
  if (projectVec.z > 1 || projectVec.z < -1) return null;
  return {
    x: (projectVec.x * 0.5 + 0.5) * window.innerWidth,
    y: (-projectVec.y * 0.5 + 0.5) * window.innerHeight,
  };
}

function showToast(text, type = "") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = text;
  dom.toastStack.appendChild(el);
  while (dom.toastStack.children.length > 3) dom.toastStack.firstElementChild.remove();
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 300);
  }, 1700);
}

function showBanner(kicker, title, sub, duration = 1900) {
  dom.bannerKicker.textContent = kicker;
  dom.bannerTitle.textContent = title;
  dom.bannerSub.textContent = sub;
  dom.waveBanner.classList.add("on");
  state.bannerTimer = duration / 1000;
}

function updateTiltUI() {
  const label = tilt.enabled ? "ON" : "OFF";
  const menuLabel = dom.tiltToggle.querySelector("b");
  if (menuLabel) menuLabel.textContent = tilt.supported ? label : "N/D";
  dom.tiltToggle.setAttribute("aria-pressed", String(tilt.enabled));
  dom.pauseTilt.textContent = `INCLINACIÓN: ${tilt.enabled ? "ON" : "OFF"}`;
  const statusText = dom.tiltStatus.querySelector("span");
  if (statusText) statusText.textContent = `TILT ${tilt.enabled ? "ON" : "OFF"}`;
  dom.tiltStatus.classList.toggle("on", tilt.enabled);
  dom.recenter.classList.toggle("hidden", !tilt.enabled);
}

function updateSoundUI() {
  dom.soundToggle.setAttribute("aria-pressed", String(audio.enabled));
  const label = dom.soundToggle.querySelector("b");
  if (label) label.textContent = audio.enabled ? "ON" : "OFF";
  dom.soundToggle.classList.toggle("muted", !audio.enabled);
}

// ---------- resize / debug ----------

function resize() {
  if (!renderer || !camera) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const base = isMobile ? 0.8 : Math.sqrt(720000 / Math.max(1, w * h));
  perf.baseScale = clamp(base, 0.52, 0.85);
  perf.minScale = Math.min(0.4, perf.baseScale);
  perf.scale = perf.baseScale;
  applyRenderSize();
  const aspect = w / Math.max(1, h);
  camera.aspect = aspect;
  camera.fov = aspect < 0.62 ? 79 : aspect < 0.85 ? 71 : aspect < 1.12 ? 63 : 57;
  camera.updateProjectionMatrix();
  layoutWeapon();
}

function applyRenderSize() {
  if (!renderer) return;
  const scale = clamp(perf.scale, perf.minScale, perf.baseScale);
  perf.scale = scale;
  renderer.setSize(
    Math.round(window.innerWidth * scale),
    Math.round(window.innerHeight * scale),
    false
  );
}

function exposeDebug() {
  const api = {
    state: () => state.mode,
    wave: () => state.waveIndex,
    score: () => state.score,
    start: () => startRun(),
    shoot: () => shoot(),
    aim: (x, y) => { aim.x = clamp(x, -0.94, 0.94); aim.y = clamp(y, -0.84, 0.88); },
    fireAt: (x, y) => { aim.x = clamp(x, -0.94, 0.94); aim.y = clamp(y, -0.84, 0.88); shoot(); },
    killEnemies: () => {
      for (const e of enemies) {
        if (!e.isHostage) e.hit(99, "body");
      }
    },
    enemyCount: () => enemies.filter((e) => !e.isHostage && !e.dead).length,
    waveInfo: () => waveEntries.map((e) => ({ type: e.spec.type, dead: e.enemy?.dead ?? false })),
    enemyScreens: () => enemies.filter((e) => !e.dead && !e.isHostage).map((e) => {
      const p = new THREE.Vector3();
      e.head.getWorldPosition(p);
      p.project(camera);
      return { type: e.type, x: p.x, y: p.y };
    }),
    aimNow: () => ({ x: aim.x, y: aim.y, tilt: tilt.enabled, hasData: tilt.hasData }),
    ammo: () => ({ ammo: state.ammo, reloading: state.reloading }),
    reload: () => reload(),
    health: () => state.health,
    hurt: (n = 20) => applyHealthLoss(Number(n) || 20, true),
    waveDebug: () => ({
      mode: state.mode,
      waveClock: Math.round(state.waveClock * 100) / 100,
      pendingClear: Math.round(state.pendingClear * 100) / 100,
      queue: spawnQueue.map((q) => Math.round((q.delay - state.waveClock) * 100) / 100),
      transitionTimer: Math.round(state.transitionTimer * 100) / 100,
      nextWave: state.nextWave,
      entries: waveEntries.map((e) => ({ type: e.spec.type, has: !!e.enemy, dead: e.enemy?.dead, removed: e.enemy?.removed })),
      timeScaleFps: Math.round(perf.fps * 10) / 10,
    }),
    metrics: () => ({
      fps: Math.round(perf.fps * 10) / 10,
      frameMs: Math.round(perf.frameAvg * 10) / 10,
      scale: Math.round(perf.scale * 100) / 100,
      baseScale: Math.round(perf.baseScale * 100) / 100,
      buffer: [renderer.domElement.width, renderer.domElement.height],
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      enemyCount: enemies.length,
    }),
    setScale: (s) => {
      perf.scale = clamp(Number(s) || perf.scale, perf.minScale, perf.baseScale);
      applyRenderSize();
    },
    auto: (on) => { perf.auto = !!on; },
    scene: () => scene,
    world: () => world?.group,
    renderer: () => renderer,
  };
  window.__CDL__ = api;
}

init();

