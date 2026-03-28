import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createCubies, MOVES } from './Cube';

export default function InstructionModal({ isOpen, onClose, algoTitle, algorithm, setup }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const requestRef = useRef();
  
  const [currentMoveIdx, setCurrentMoveIdx] = useState(-1);

  // --- ADAPTIVNA ROTACIJA ZA MODAL ---
  const rotateLayer = (cubies, moveKey, angle, isYellowTop) => {
    const baseMove = moveKey.replace(/[2']/g, '');
    let move = { ...MOVES[baseMove] }; 
    if (!move) return;

    let direction = move.dir;
    if (moveKey.includes("'")) direction *= -1;

    // KOREKCIJA AKO JE KOCKA OKRENUTA (DAISY)
    if (isYellowTop) {
      if (move.axis === 'y') {
        // Kada je žuta gore, U sloj je fizički na dnu (y: -1)
        move.layer *= -1; 
      } else {
        // Za X i Z ose (R, L, F, B), smer rotacije se obrće jer gledamo "naglavačke"
        direction *= -1;
      }
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
    camera.position.set(4, 5, 8); 
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(350, 350);
    if (mountRef.current) mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 3.2));
    const cubies = createCubies(scene);

const titleLower = algoTitle?.toLowerCase() || "";
const isYellowTop = titleLower.includes("edge") || titleLower.includes("daisy");

// DODAJ OVO ZA DEBUGGING DA VIDIŠ U KONZOLI ŠTA MODAL MISLI:
console.log("MODAL PROVERA:", { title: algoTitle, isYellowTop });

    if (isYellowTop) {
      // Rotiramo celu kocku da Žuta (y: -1) dođe na vrh
      const flipMatrix = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI);
      cubies.forEach(c => {
        c.position.applyMatrix4(flipMatrix);
        c.quaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(flipMatrix));
      });
    }

    // SETUP (Priprema pozicije pre animacije)
    if (setup) {
      const setupMoves = setup.trim().split(/\s+/);
      setupMoves.forEach(m => rotateLayer(cubies, m, Math.PI / 2, isYellowTop));
    }

    // ANIMACIJA
    let queue = algorithm ? algorithm.trim().split(/\s+/) : [];
    let internalIdx = 0;
    let isRotating = false;
    let currentAngle = 0;
    let wait = 100;

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);

      if (wait > 0) {
        wait--;
      } else if (!isRotating && internalIdx < queue.length) {
        isRotating = true;
        currentAngle = 0;
        setCurrentMoveIdx(internalIdx);
      } else if (isRotating) {
        const step = 0.08;
        currentAngle += step;

        if (currentAngle >= Math.PI / 2) {
          const remainder = (Math.PI / 2) - (currentAngle - step);
          rotateLayer(cubies, queue[internalIdx], remainder, isYellowTop);
          isRotating = false;
          internalIdx++;
          wait = 40;
          if (internalIdx >= queue.length) {
            setCurrentMoveIdx(-1);
            wait = 250; 
          }
        } else {
          rotateLayer(cubies, queue[internalIdx], step, isYellowTop);
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
  }, [isOpen, algorithm, setup, algoTitle]);

  if (!isOpen) return null;

  const titleLower = algoTitle?.toLowerCase() || "";
  const isYellow = titleLower.includes("daisy") || titleLower.includes("edge");

  return (
    <div style={styles.overlay}>
      <div style={styles.content}>
        <h2 style={styles.title}>{algoTitle}</h2>
        <div style={{...styles.badge, color: isYellow ? '#ffd500' : '#4ade80'}}>
           {isYellow ? "ORIENTATION: YELLOW TOP" : "ORIENTATION: WHITE TOP"}
        </div>
        
        <div ref={mountRef} style={styles.canvasContainer} />

        <div style={styles.algoBox}>
          {algorithm && algorithm.split(' ').map((move, i) => (
            <span key={i} style={{ 
              color: i === currentMoveIdx ? '#38bdf8' : '#fff', 
              opacity: i === currentMoveIdx ? 1 : 0.4,
              fontSize: i === currentMoveIdx ? '42px' : '26px',
              fontWeight: '900',
              margin: '0 12px',
              transition: 'all 0.1s'
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
  overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(10px)' },
  content: { background: '#050505', padding: '40px', borderRadius: '40px', border: '2px solid #222', textAlign: 'center', width: '450px' },
  title: { color: '#fff', fontSize: '22px', margin: 0, fontWeight: '900' },
  badge: { fontSize: '10px', fontWeight: 'bold', marginTop: '8px', marginBottom: '20px', letterSpacing: '2px' },
  canvasContainer: { width: '350px', height: '350px', margin: '0 auto' },
  algoBox: { margin: '30px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px' },
  button: { background: '#38bdf8', color: '#000', border: 'none', padding: '16px 60px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' }
};