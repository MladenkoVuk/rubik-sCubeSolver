// Cube.js — 3D Logic, Mesh Generation & Math.round Correction
// Uses Three.js (imported externally or via CDN)

import * as THREE from 'three';

// ─── COLOR PALETTE ─────────────────────────────────────────────────────────────
// Standard Western color scheme:
//   White ↔ Yellow  (top/bottom)
//   Green ↔ Blue    (left/right)
//   Red   ↔ Orange  (front/back)

export const COLORS = {
  white:  0xffffff,
  yellow: 0xffd500,
  green:  0x009b48,
  blue:   0x0046ad,
  red:    0xb71234,
  orange: 0xff5800,
  black:  0x111118,   // inner faces (hidden)
};

// ─── MOVE DEFINITIONS ──────────────────────────────────────────────────────────
// axis  : which world axis the layer rotates around ('x' | 'y' | 'z')
// layer : coordinate of cubies in that layer (-1, 0, or 1)
// dir   : +1 = clockwise (right-hand rule), -1 = counter-clockwise

export const MOVES = {
  // R: Desno (x: 1) - R ide gore, R' ide dole
  'R':  { axis: 'x', layer:  1, dir: -1 }, 
  "R'": { axis: 'x', layer:  1, dir:  1 },

  // L: Levo (x: -1) - L ide dole, L' ide gore
  'L':  { axis: 'x', layer: -1, dir:  1 },
  "L'": { axis: 'x', layer: -1, dir: -1 },

  // U: Gore (y: 1) - U ide ulevo, U' udesno
  'U':  { axis: 'y', layer:  1, dir: -1 },
  "U'": { axis: 'y', layer:  1, dir:  1 },

  // D: Dole (y: -1) - D ide udesno, D' ulevo
  'D':  { axis: 'y', layer: -1, dir:  1 },
  "D'": { axis: 'y', layer: -1, dir: -1 },

  // F: Napred (z: 1) - F ide u smeru kazaljke
  'F':  { axis: 'z', layer:  1, dir: -1 },
  "F'": { axis: 'z', layer:  1, dir:  1 },

  // B: Pozadi (z: -1) - B ide u smeru kazaljke (gledano od pozadi)
  'B':  { axis: 'z', layer: -1, dir:  1 },
  "B'": { axis: 'z', layer: -1, dir: -1 },
};

// ─── MESH GENERATION ───────────────────────────────────────────────────────────

/**
 * createCubies(scene)
 * Instantiates 27 cubie meshes (3×3×3 grid) and adds them to the scene.
 * Each cubie uses a MeshStandardMaterial array — one material per BoxGeometry face.
 * Face order in Three.js BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
 *
 * Color assignment:
 *   +X (right)  → Blue    if x = +1, else Black
 *   -X (left)   → Green   if x = -1, else Black
 *   +Y (top)    → White   if y = +1, else Black
 *   -Y (bottom) → Yellow  if y = -1, else Black
 *   +Z (front)  → Orange  if z = +1, else Black
 *   -Z (back)   → Red     if z = -1, else Black
 */
export function createCubies(scene) {
  const cubies = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const geometry = new THREE.BoxGeometry(0.93, 0.93, 0.93);

        // Determine face colors based on grid position
       const faceColors = [
  x ===  1 ? COLORS.red    : COLORS.black,   // +X (Desno - Red)
  x === -1 ? COLORS.orange : COLORS.black,   // -X (Levo - Orange)
  y ===  1 ? COLORS.white  : COLORS.black,   // +Y (Gore - White)
  y === -1 ? COLORS.yellow : COLORS.black,   // -Y (Dole - Yellow)
  z ===  1 ? COLORS.green  : COLORS.black,   // +Z (Napred - Green)
  z === -1 ? COLORS.blue   : COLORS.black,   // -Z (Pozadi - Blue)
];
        const materials = faceColors.map(hex =>
          new THREE.MeshStandardMaterial({
            color:     hex,
            roughness: hex === COLORS.black ? 0.85 : 0.28,
            metalness: hex === COLORS.black ? 0.00 : 0.12,
          })
        );


        

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.position.set(x, y, z);
        mesh.castShadow    = true;
        mesh.receiveShadow = false;

        mesh.userData.initialPos = { x, y, z };

        // Thin edge outlines for visual clarity
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry),
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        mesh.add(edges);

        scene.add(mesh);
        cubies.push(mesh);
      }
    }
  }

  return cubies;
}

// ─── FLOATING-POINT CORRECTION ────────────────────────────────────────────────

/**
 * roundCubie(cubie)
 * After each 90° rotation, snap positions to integers and quaternion
 * components to 3-decimal precision to prevent floating-point drift.
 * Without this, repeated moves cause cubies to slide off the grid.
 */
export function roundCubie(cubie) {
  // Snap grid positions to nearest integer (-1, 0, or 1)
  cubie.position.x = Math.round(cubie.position.x);
  cubie.position.y = Math.round(cubie.position.y);
  cubie.position.z = Math.round(cubie.position.z);

  // Round quaternion components to 3 decimal places
  // Valid 90° quaternion components are multiples of ≈ 0, 0.5, 0.707, 1
  cubie.quaternion.x = Math.round(cubie.quaternion.x * 1000) / 1000;
  cubie.quaternion.y = Math.round(cubie.quaternion.y * 1000) / 1000;
  cubie.quaternion.z = Math.round(cubie.quaternion.z * 1000) / 1000;
  cubie.quaternion.w = Math.round(cubie.quaternion.w * 1000) / 1000;
}

// ─── LAYER FILTER ─────────────────────────────────────────────────────────────

/**
 * getLayerCubies(cubies, axis, layer)
 * Filters the 27 cubies to those whose position on `axis` equals `layer`.
 * Example: getLayerCubies(cubies, 'x', 1) → the 9 cubies on the right face (R move).
 */
export function getLayerCubies(cubies, axis, layer) {
  return cubies.filter(c => Math.round(c.position[axis]) === layer);
}

// ─── SOLVED CHECK ─────────────────────────────────────────────────────────────

/**
 * checkColorsSolved(cubies)
 * Verifies that every cubie's face materials match the expected color
 * for its current grid position. A cubie at (-1, 1, 0) should have:
 *   Green  on -X, White on +Y, and Black on all other faces.
 * Returns true only when all 27 × 6 = 162 faces match expectations.
 */
export function checkColorsSolved(cubies) {
  for (const c of cubies) {
    const x = Math.round(c.position.x);
    const y = Math.round(c.position.y);
    const z = Math.round(c.position.z);

    const expected = [
      x ===  1 ? COLORS.blue   : COLORS.black,
      x === -1 ? COLORS.green  : COLORS.black,
      y ===  1 ? COLORS.white  : COLORS.black,
      y === -1 ? COLORS.yellow : COLORS.black,
      z ===  1 ? COLORS.orange : COLORS.black,
      z === -1 ? COLORS.red    : COLORS.black,
    ];

    for (let i = 0; i < 6; i++) {
      if (c.material[i].color.getHex() !== expected[i]) return false;
    }
  }
  return true;
}

// ─── THREE.JS SCENE SETUP ─────────────────────────────────────────────────────

/**
 * initThree(canvas)
 * Sets up the WebGL renderer, scene, camera, lights, and manual orbit control.
 * Returns { renderer, scene, camera, getRotation(), dispose() }.
 */
export function initThree(canvas) {
  // 1. Renderer sa antialiasing-om (pegla ivice) i podrškom za visoku gustinu piksela
  const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true, 
    alpha: true 
  });
  
  // Postavlja rezoluciju prema tvom ekranu (Retina/4K podrška)
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  
  // Početna veličina na osnovu CSS-a
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new THREE.Scene();

  // 2. Kamera - postavljena tako da kocka bude u fokusu
  const camera = new THREE.PerspectiveCamera(
    45, 
    canvas.clientWidth / canvas.clientHeight, 
    0.1, 
    100
  );
  camera.position.set(0, 0, 7.5); // Malo dalje za bolji pregled
  camera.lookAt(0, 0, 0);

  // 3. Osvetljenje - pojačano da boje budu jasne
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
  mainLight.position.set(5, 10, 7);
  scene.add(mainLight);

  // 4. Logika za rotaciju celog sveta (Quaternions)
  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  
  // targetQuaternion je gde želimo da kocka bude, current je gde je trenutno (za glatkoću)
  const targetQuaternion = new THREE.Quaternion();
  const currentQuaternion = new THREE.Quaternion();

  const onMove = (x, y) => {
    if (!isDragging) return;

    // Osetljivost miša - smanji ako ti je prebrzo
    const deltaX = (x - prevMouse.x) * 0.006;
    const deltaY = (y - prevMouse.y) * 0.006;

    // Kreiramo rotaciju oko X i Y osa
    const deltaRotation = new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(deltaY, deltaX, 0, 'XYZ'));

    // Množimo da bismo akumulirali rotaciju bez limita
    targetQuaternion.multiplyQuaternions(deltaRotation, targetQuaternion);

    prevMouse = { x, y };
  };

  // Event listeneri (Miš + Touch za mobilne)
  canvas.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
  window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', () => isDragging = false);

  canvas.addEventListener('touchstart', e => { 
    isDragging = true; 
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY }; 
  }, { passive: false });
  window.addEventListener('touchmove', e => {
    onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  window.addEventListener('touchend', () => isDragging = false);

  // 5. Resize Observer - da slika ostane oštra kad menjaš veličinu prozora
  const handleResize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(canvas);

  return {
    renderer, 
    scene, 
    camera,
    // Ova funkcija se poziva u App.jsx tick() petlji
    update: () => {
      // Slerp vrši glatko "pretapanje" rotacije (0.15 je faktor inercije)
      currentQuaternion.slerp(targetQuaternion, 0.15);
      scene.quaternion.copy(currentQuaternion);
    },
    dispose: () => {
      renderer.dispose();
      resizeObserver.disconnect();
    }
  };
}