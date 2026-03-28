import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createCubies, MOVES } from './Cube';

export default function InstructionModal({ isOpen, onClose, algoTitle, algorithm, setup }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const requestRef = useRef();
  
  const [currentMoveIdx, setCurrentMoveIdx] = useState(-1);

  // --- LOGIKA ROTACIJE (Precizno rukovanje sa R, R', R2) ---
  const rotateLayer = (cubies, moveKey, angle) => {
    // 1. Očistimo ključ (npr. "R'" postane "R")
    const baseMove = moveKey.replace(/[2']/g, '');
    const move = MOVES[baseMove];
    if (!move) return;

    // 2. Određivanje smera
    let direction = move.dir;
    if (moveKey.includes("'")) {
      direction *= -1; // Invertuj smer za prime (')
    }

    const axisVector = new THREE.Vector3(
      move.axis === 'x' ? 1 : 0,
      move.axis === 'y' ? 1 : 0,
      move.axis === 'z' ? 1 : 0
    );

    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axisVector, angle * direction);
    
    cubies.forEach(cubie => {
      if (Math.round(cubie.position[move.axis]) === move.layer) {
        cubie.position.applyMatrix4(rotationMatrix);
        cubie.quaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(rotationMatrix));
      }
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 5, 8); // Pogled koji obuhvata Top i Front
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(350, 350);
    if (mountRef.current) mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const cubies = createCubies(scene);

    // --- KLJUČ: Postavljanje Žute Gore (x2 rotacija) ---
    // Umesto scene.rotation, rotiramo same kockice da 'U' ostane 'U'
    const flipMatrix = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI);
    cubies.forEach(c => {
      c.position.applyMatrix4(flipMatrix);
      c.quaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(flipMatrix));
    });

    // --- SETUP (Priprema pomešanosti) ---
    if (setup) {
      const setupMoves = setup.trim().split(/\s+/);
      setupMoves.forEach(m => rotateLayer(cubies, m, Math.PI / 2));
    }

    // --- ANIMACIJA ALGORITMA ---
    let queue = algorithm ? algorithm.trim().split(/\s+/) : [];
    let internalIdx = 0;
    let isRotating = false;
    let currentAngle = 0;
    let wait = 120; // Početno čekanje

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);

      if (wait > 0) {
        wait--;
      } else if (!isRotating && internalIdx < queue.length) {
        isRotating = true;
        currentAngle = 0;
        setCurrentMoveIdx(internalIdx);
      } else if (isRotating) {
        const step = 0.06; // Brzina animacije
        currentAngle += step;

        if (currentAngle >= Math.PI / 2) {
          // Završi rotaciju precizno na 90 stepeni
          const remainder = (Math.PI / 2) - (currentAngle - step);
          rotateLayer(cubies, queue[internalIdx], remainder);
          isRotating = false;
          internalIdx++;
          wait = 45; // Pauza između poteza
          
          if (internalIdx >= queue.length) {
            setCurrentMoveIdx(-1);
            wait = 250; // Pauza na kraju pre loop-a ili stopa
          }
        } else {
          rotateLayer(cubies, queue[internalIdx], step);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(requestRef.current);
      if (mountRef.current) mountRef.current.innerHTML = "";
      renderer.dispose();
    };
  }, [isOpen, algorithm, setup]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.content}>
        <h2 style={styles.title}>{algoTitle || "Algorithm Helper"}</h2>
        <div style={styles.badge}>DAISY METHOD: YELLOW TOP</div>
        
        <div ref={mountRef} style={styles.canvasContainer} />

        <div style={styles.algoBox}>
          {algorithm && algorithm.split(' ').map((move, i) => (
            <span key={i} style={{ 
              color: i === currentMoveIdx ? '#38bdf8' : '#fff', 
              opacity: i === currentMoveIdx ? 1 : 0.4,
              fontSize: i === currentMoveIdx ? '42px' : '26px',
              fontWeight: '900',
              margin: '0 12px',
              transition: 'all 0.2s'
            }}>
              {move}
            </span>
          ))}
        </div>
        
        <button onClick={onClose} style={styles.button}>CLOSE EXAMPLE</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)' },
  content: { background: '#050505', padding: '40px', borderRadius: '40px', border: '2px solid #333', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  title: { color: '#fff', fontSize: '24px', margin: 0, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' },
  badge: { color: '#fbbf24', fontSize: '11px', fontWeight: 'bold', marginTop: '8px', marginBottom: '20px', letterSpacing: '2px' },
  canvasContainer: { width: '350px', height: '350px', margin: '0 auto', background: '#000', borderRadius: '30px', border: '1px solid #111' },
  algoBox: { margin: '30px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' },
  button: { background: '#38bdf8', color: '#000', border: 'none', padding: '16px 50px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', transition: 'transform 0.2s' }
};