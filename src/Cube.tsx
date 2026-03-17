import { useRef, useState, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const COLORS = {
  top: '#FFFFFF',    // Pure White
  bottom: '#DFFF00', // Neon Lemon (Cooler yellow, clearly different from orange)
  front: '#FF3131',  // Vivid Red
  back: '#00FF41',   // Matrix Green
  right: '#00D4FF',  // Electric Cyan (Brighter than deep blue)
  left: '#FF8C00',   // Deep Burnt Orange (More saturated/reddish)
  core: '#101113',   // Deep Slate Core
};

export interface CubeHandle {
  shuffle: () => void;
  executeSequence: (moves: string[]) => void;
}

export const Cube = forwardRef<CubeHandle, { onMove: () => void }>(({ onMove }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { camera } = useThree();
  const rotationData = useRef({ pivot: new THREE.Group(), axis: 'x' as 'x'|'y'|'z', targetAngle: 0, currentAngle: 0 });

  const startRotation = (axis: 'x' | 'y' | 'z', layer: number, angle: number) => {
    if (isAnimating || !groupRef.current) return;
    const pivot = rotationData.current.pivot;
    pivot.rotation.set(0, 0, 0);
    pivot.updateMatrixWorld();
    groupRef.current.add(pivot);
    const children = [...groupRef.current.children];
    children.forEach((child) => {
      if (child !== pivot && Math.abs(child.position[axis] - layer) < 0.1) pivot.attach(child);
    });
    rotationData.current = { pivot, axis, targetAngle: angle, currentAngle: 0 };
    onMove();
    setIsAnimating(true);
  };

  const getMoveParams = (key: string, isPrime: boolean) => {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
    const getDomAxis = (vec: THREE.Vector3) => {
      const absX = Math.abs(vec.x), absY = Math.abs(vec.y), absZ = Math.abs(vec.z);
      if (absX > absY && absX > absZ) return { axis: 'x' as const, sign: Math.sign(vec.x) };
      if (absY > absX && absY > absZ) return { axis: 'y' as const, sign: Math.sign(vec.y) };
      return { axis: 'z' as const, sign: Math.sign(vec.z) };
    };
    let moveAxis: 'x' | 'y' | 'z' = 'z';
    let layer = 0;
    let dir = isPrime ? 1 : -1;
    const k = key.toLowerCase();
    if (k === 'f' || k === 'b') {
      const res = getDomAxis(forward);
      moveAxis = res.axis;
      layer = k === 'f' ? -res.sign : res.sign;
      dir *= (k === 'b' ? -1 : 1) * res.sign;
    } else if (k === 'r' || k === 'l') {
      const res = getDomAxis(right);
      moveAxis = res.axis;
      layer = k === 'r' ? res.sign : -res.sign;
      dir *= (k === 'l' ? -1 : 1) * res.sign;
      if (res.axis === 'y') dir *= -1;
    } else if (k === 'u' || k === 'd') {
      const res = getDomAxis(up);
      moveAxis = res.axis;
      layer = k === 'u' ? res.sign : -res.sign;
      dir *= (k === 'd' ? -1 : 1) * res.sign;
    } else return null;
    return { axis: moveAxis, layer, angle: (Math.PI / 2) * dir };
  };

  useImperativeHandle(ref, () => ({
    shuffle() {
      const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
      let count = 0;
      const interval = setInterval(() => {
        startRotation(axes[Math.floor(Math.random()*3)], Math.floor(Math.random()*3)-1, (Math.PI/2)*(Math.random()>0.5?1:-1));
        count++; if (count >= 20) clearInterval(interval);
      }, 160);
    },
    executeSequence(moves: string[]) {
      let i = 0;
      const runNext = () => {
        if (i >= moves.length) return;
        const p = getMoveParams(moves[i].replace("'",""), moves[i].includes("'"));
        if (p) { startRotation(p.axis, p.layer, p.angle); i++; setTimeout(runNext, 400); }
      };
      runNext();
    }
  }));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const p = getMoveParams(e.key, e.shiftKey);
      if (p && !isAnimating) startRotation(p.axis, p.layer, p.angle);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAnimating, camera]);

  useFrame((_, delta) => {
    if (!isAnimating) return;
    const d = rotationData.current;
    const step = (d.targetAngle / 0.12) * delta;
    if (Math.abs(d.currentAngle) < Math.abs(d.targetAngle)) {
      d.pivot.rotation[d.axis] += step;
      d.currentAngle += step;
    } else {
      d.pivot.rotation[d.axis] = d.targetAngle;
      d.pivot.updateMatrixWorld();
      [...d.pivot.children].forEach(c => groupRef.current?.attach(c));
      groupRef.current?.remove(d.pivot);
      setIsAnimating(false);
    }
  });

  const cublets = useMemo(() => {
    const items = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const colors = [x===1?COLORS.right:COLORS.core, x===-1?COLORS.left:COLORS.core, y===1?COLORS.top:COLORS.core, y===-1?COLORS.bottom:COLORS.core, z===1?COLORS.front:COLORS.core, z===-1?COLORS.back:COLORS.core];
          items.push({ pos: [x,y,z] as [number,number,number], colors });
        }
      }
    }
    return items;
  }, []);

  return (
    <group ref={groupRef}>
      {cublets.map((c, i) => (
        <mesh key={i} position={c.pos}>
          <boxGeometry args={[0.95, 0.95, 0.95]} />
          {c.colors.map((col, idx) => (
            <meshStandardMaterial 
              key={idx} 
              attach={`material-${idx}`} 
              color={col} 
              roughness={0.4} // Non-reflective
              metalness={0.1}
              emissive={col} 
    emissiveIntensity={0.1}
            />
          ))}
        </mesh>
      ))}
    </group>
  );
});