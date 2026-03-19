// Controls.js — Keyboard Listeners, Move Execution & Animation Engine
// Handles all 90° face rotations with smooth easing and post-move rounding.

import * as THREE from 'three';
import { MOVES, getLayerCubies, roundCubie, checkColorsSolved } from './Cube';

// ─── ANIMATION SETTINGS ────────────────────────────────────────────────────────

const ANIM_DURATION_MS = 140;  // Duration of one 90° rotation in milliseconds

/**
 * easeInOut(t)
 * Smooth quadratic easing function. t ∈ [0, 1].
 */
const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// ─── CORE MOVE EXECUTOR ────────────────────────────────────────────────────────

/**
 * executeMove(moveName, cubies, animatingRef, stateSetters, stateRefs)
 *
 * Performs an animated 90° rotation of the appropriate cubie layer.
 *
 * Algorithm:
 *  1. Look up the move definition (axis, layer, direction).
 *  2. Filter cubies to those in the target layer using getLayerCubies().
 *  3. Snapshot the initial positions and quaternions of those cubies.
 *  4. In a requestAnimationFrame loop:
 *     a. Compute eased progress t ∈ [0, 1].
 *     b. Build a partial rotation quaternion for the current frame angle.
 *     c. Apply it to each cubie's world position and orientation.
 *  5. On completion, call roundCubie() on each moved cubie to snap values.
 *  6. Update React state (move count, history, solved flag, timer).
 *
 * @param {string}   moveName      — Key in MOVES, e.g. 'R', "U'", 'F'
 * @param {Array}    cubies        — All 27 cubie meshes
 * @param {Ref}      animatingRef  — Boolean ref; true while animation is running
 * @param {Object}   stateSetters  — { setMoveCount, setMoveHistory, setSolved, setTimerRunning }
 * @param {Object}   stateRefs     — { moveCountRef, solvedRef, timerRunRef, startTimeRef }
 */
export function executeMove(moveName, cubies, animatingRef, stateSetters, stateRefs) {
  const move = MOVES[moveName];
  if (!move) {
    console.warn(`[Controls] Unknown move: "${moveName}"`);
    return;
  }

  // Guard: skip if already animating (queue handles ordering)
  if (animatingRef.current) return;
  animatingRef.current = true;

  const { setMoveCount, setMoveHistory, setSolved, setTimerRunning } = stateSetters;
  const { moveCountRef, solvedRef, timerRunRef, startTimeRef }        = stateRefs;

  // ── 1. Select affected cubies ─────────────────────────────────────────────
  const layer = getLayerCubies(cubies, move.axis, move.layer);

  // ── 2. Build rotation metadata ────────────────────────────────────────────
  const totalAngle = (Math.PI / 2) * move.dir;   // 90° in correct direction
  const axisVec    = new THREE.Vector3(
    move.axis === 'x' ? 1 : 0,
    move.axis === 'y' ? 1 : 0,
    move.axis === 'z' ? 1 : 0,
  );

  // ── 3. Snapshot start state ───────────────────────────────────────────────
  const initPositions  = layer.map(c => c.position.clone());
  const initQuaternions = layer.map(c => c.quaternion.clone());

  const startTime      = performance.now();
  const frameQuat      = new THREE.Quaternion();  // reused each frame

  // ── 4. Animation loop ─────────────────────────────────────────────────────
  const animFrame = (now) => {
    const elapsed  = now - startTime;
    const rawT     = Math.min(elapsed / ANIM_DURATION_MS, 1);
    const easedT   = easeInOut(rawT);
    const angle    = totalAngle * easedT;

    // Build partial quaternion for this frame's angle
    frameQuat.setFromAxisAngle(axisVec, angle);

    layer.forEach((cubie, i) => {
      // Rotate world position around origin (0,0,0)
      cubie.position.copy(initPositions[i]).applyQuaternion(frameQuat);
      // Compose rotations: new = frame * initial
      cubie.quaternion.copy(frameQuat).multiply(initQuaternions[i]);
    });

    if (rawT < 1) {
      requestAnimationFrame(animFrame);
      return;
    }

    // ── 5. Snap to grid after animation completes ─────────────────────────
    layer.forEach(roundCubie);

    // ── 6. Update React state ─────────────────────────────────────────────
    animatingRef.current = false;
    moveCountRef.current++;
    setMoveCount(moveCountRef.current);
    setMoveHistory(prev => [...prev, moveName].slice(-20));

    

    // Check solve condition
    if (!solvedRef.current && checkColorsSolved(cubies)) {
      solvedRef.current = true;
      setSolved(true);
      timerRunRef.current = false;
      setTimerRunning(false);
    }
  };

  requestAnimationFrame(animFrame);
}

// ─── KEYBOARD HOOK ─────────────────────────────────────────────────────────────

/**
 * useKeyboardControls(moveQueueRef)
 * React hook that registers keydown listeners and pushes move strings
 * onto the queue. Shift + key = prime (counter-clockwise) move.
 *
 * Bindings:
 *   R → R    Shift+R → R'
 *   L → L    Shift+L → L'
 *   U → U    Shift+U → U'
 *   D → D    Shift+D → D'
 *   F → F    Shift+F → F'
 *   B → B    Shift+B → B'
 */
export function useKeyboardControls(moveQueueRef) {
  // Import useEffect from React when using in a module context
  const { useEffect } = require('react');

  useEffect(() => {
    const FACE_KEYS = new Set(['R', 'L', 'U', 'D', 'F', 'B']);

    const onKeyDown = (event) => {
      if (event.repeat) return;                           // ignore held keys
      const key = event.key.toUpperCase();
      if (!FACE_KEYS.has(key)) return;

      event.preventDefault();                             // stop browser scroll etc.
      const moveName = event.shiftKey ? `${key}'` : key;
      moveQueueRef.current.push(moveName);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moveQueueRef]);
}

// ─── SCRAMBLE GENERATOR ────────────────────────────────────────────────────────

/**
 * generateScramble(length?)
 * Returns an array of random move strings suitable for scrambling.
 * Avoids immediately repeating the same face move (e.g. R R).
 *
 * @param  {number} length — Number of moves (default: 20)
 * @returns {string[]}
 */
export function generateScramble(length = 20) {
  const moveKeys  = Object.keys(MOVES);
  const faces     = ['R', 'L', 'U', 'D', 'F', 'B'];
  const sequence  = [];
  let   lastFace  = '';

  while (sequence.length < length) {
    const move = moveKeys[Math.floor(Math.random() * moveKeys.length)];
    const face = move.replace("'", '');                   // strip prime
    if (face === lastFace) continue;                      // no back-to-back same face
    sequence.push(move);
    lastFace = face;
  }

  return sequence;
}
