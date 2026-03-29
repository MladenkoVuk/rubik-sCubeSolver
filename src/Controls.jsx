// Controls.js — SVE NA JEDNOM MESTU
import * as THREE from 'three';
import { MOVES, getLayerCubies, roundCubie, checkColorsSolved } from './Cube';

const ANIM_DURATION_MS = 140; 
const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// 1. FUNKCIJA ZA DETEKCIJU FRONTA (EXPORT-OVANA)
export function detectCurrentFront(cubies) {
  if (!cubies || cubies.length === 0) return 'green';

  const sideCenters = [
    { color: 'green',  pos: { x: 0,  y: 0,  z: 1  } },
    { color: 'red',    pos: { x: 1,  y: 0,  z: 0  } },
    { color: 'blue',   pos: { x: 0,  y: 0,  z: -1 } },
    { color: 'orange', pos: { x: -1, y: 0,  z: 0  } }
  ];

  let bestColor = 'green';
  let maxZ = -Infinity;

  sideCenters.forEach(center => {
    const cubie = cubies.find(c => 
      Math.round(c.position.x) === center.pos.x &&
      Math.round(c.position.y) === center.pos.y &&
      Math.round(c.position.z) === center.pos.z
    );

    if (cubie) {
      const worldPos = new THREE.Vector3();
      cubie.getWorldPosition(worldPos);
      if (worldPos.z > maxZ) {
        maxZ = worldPos.z;
        bestColor = center.color;
      }
    }
  });
  return bestColor;
}

// 2. FUNKCIJA ZA MAPIRANJE (EXPORT-OVANA)
export function getMappedMove(moveName, frontColor, cubies) {
  // 1. OSNOVNA PROVERA
  if (!cubies || !Array.isArray(cubies)) return moveName;

  const baseMove = moveName.replace(/[2']/g, '');
  const suffix = moveName.includes("'") ? "'" : (moveName.includes("2") ? "2" : "");

  // 2. PRONALAŽENJE BELOG CENTRA
  // Tražimo cubie koji je na samom početku bio na (0, 1, 0)
  // To je jedini siguran način da znamo koja je to kockica "bela"
  const whiteCenter = cubies.find(c => {
    // Ako si dodao initialPos pri kreiranju, koristi to. 
    // Ako nisi, tražimo onaj koji ima samo jedan materijal (centar) i bio je gore.
    return Math.round(c.userData?.initialPos?.x) === 0 && 
           Math.round(c.userData?.initialPos?.y) === 1 && 
           Math.round(c.userData?.initialPos?.z) === 0;
  }) || cubies[13]; // Fallback na srednji element niza ako pretraga ne uspe

  // 3. DETEKCIJA "IS YELLOW TOP" PREKO WORLD COORDINATES
  const worldPos = new THREE.Vector3();
  whiteCenter.getWorldPosition(worldPos);
  
  // Ako je beli centar fizički ispod centra kocke (y < 0), znači da je žuta GORE
  const isYellowTop = worldPos.y < -0.1;

  // 4. TVOJA LOGIKA ZA FRONT (Horizontalno mapiranje)
  const sideMappings = {
    'green':  { 'F': 'F', 'B': 'B', 'R': 'R', 'L': 'L', 'U': 'U', 'D': 'D' },
    'red':    { 'F': 'R', 'B': 'L', 'R': 'B', 'L': 'F', 'U': 'U', 'D': 'D' },
    'blue':   { 'F': 'B', 'B': 'F', 'R': 'L', 'L': 'R', 'U': 'U', 'D': 'D' },
    'orange': { 'F': 'L', 'B': 'R', 'R': 'F', 'L': 'B', 'U': 'U', 'D': 'D' }
  };

  let newBase = sideMappings[frontColor]?.[baseMove] || baseMove;

  // 5. LOGIKA ZA GORE/DOLE (Vertikalno mapiranje)
  if (isYellowTop) {
    if (newBase === 'U') newBase = 'D';
    else if (newBase === 'D') newBase = 'U';
    // Kad je kocka naopačke, desno je levo, a levo je desno
    else if (newBase === 'R') newBase = 'L';
    else if (newBase === 'L') newBase = 'R';
  }

  return newBase + suffix;
}

// 3. GLAVNI EGZEKUTOR (EXPORT-OVAN)
export function executeMove(moveName, cubies, animatingRef, stateSetters, stateRefs) {
  const move = MOVES[moveName];
  if (!move || animatingRef.current) return;
  animatingRef.current = true;

  const { setMoveCount, setMoveHistory, setSolved, setTimerRunning } = stateSetters;
  const { moveCountRef, solvedRef, timerRunRef } = stateRefs;

  const layer = getLayerCubies(cubies, move.axis, move.layer);
  const totalAngle = (Math.PI / 2) * move.dir;
  const axisVec = new THREE.Vector3(move.axis === 'x' ? 1 : 0, move.axis === 'y' ? 1 : 0, move.axis === 'z' ? 1 : 0);

  const initPositions = layer.map(c => c.position.clone());
  const initQuaternions = layer.map(c => c.quaternion.clone());
  const startTime = performance.now();
  const frameQuat = new THREE.Quaternion();

  const animFrame = (now) => {
    const elapsed = now - startTime;
    const rawT = Math.min(elapsed / ANIM_DURATION_MS, 1);
    const easedT = easeInOut(rawT);
    const angle = totalAngle * easedT;

    frameQuat.setFromAxisAngle(axisVec, angle);
    layer.forEach((cubie, i) => {
      cubie.position.copy(initPositions[i]).applyQuaternion(frameQuat);
      cubie.quaternion.copy(frameQuat).multiply(initQuaternions[i]);
    });

    if (rawT < 1) { requestAnimationFrame(animFrame); return; }

    layer.forEach(roundCubie);
    animatingRef.current = false;
    moveCountRef.current++;
    setMoveCount(moveCountRef.current);
    setMoveHistory(prev => [...prev, moveName].slice(-20));

    if (!solvedRef.current && checkColorsSolved(cubies)) {
      solvedRef.current = true;
      setSolved(true);
      timerRunRef.current = false;
      setTimerRunning(false);
    }
  };
  requestAnimationFrame(animFrame);
}

// 4. GENERATOR SKRAMBLA (EXPORT-OVAN)
export function generateScramble(length = 20) {
  const moveKeys = Object.keys(MOVES);
  const sequence = [];
  let lastFace = '';
  while (sequence.length < length) {
    const move = moveKeys[Math.floor(Math.random() * moveKeys.length)];
    const face = move.replace(/[2']/g, '');
    if (face === lastFace) continue;
    sequence.push(move);
    lastFace = face;
  }
  return sequence;
}