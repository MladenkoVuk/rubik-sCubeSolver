import React, { useState } from 'react';

// ─── DATA & STEPS (Sa dodatim SETUP potezima za kontekst) ─────────────────────

const CFOP_STEPS = [
{ 
  id: 'cross', 
  stage: '01', 
  title: 'The White Cross', 
  color: '#38bdf8', 
  description: 'Building the "Daisy": Place 4 white edges around the yellow center.',
  holding: 'Yellow center on TOP, White center on BOTTOM.',
  tasks: [
    'Find a White Edge piece', 
    'Bring it to the Front face (Middle layer)', 
    'Rotate it up to the Yellow top'
  ], 
  algos: [
    { 
      name: "Case: Edge on Front-Bottom", 
      moves: "F R'", 
      setup: "B2 L2 D2 U' R2 U B2 D2 F2 L2 F' R' B L D' R F D B F' U' L' D R F R",
      instruction: "If it's at the bottom, move F to bring it to the side, then R to bring it up."
    }
  ] 
},
 { 
  id: 'corners', 
  stage: '02', 
  title: 'Solving the Corners', 
  color: '#4ade80', 
  description: 'White Cross is done and on TOP. Now we fill the 4 corners.',
  holding: 'White Cross on TOP. Front facing YOU.',
  tasks: [
    'Find a corner piece with White on it in the bottom layer', 
    'Use D moves to place it directly UNDER its spot', 
    'Look at the White sticker and use the matching move'
  ], 
  algos: [
    { 
      name: 'White Facing FRONT', 
      moves: "F D F'", 
      // SETUP: Prvo složi krst, pa izbaci ćošak tako da bela gleda NAPRED
      setup: "R' D' R L D L' B' D' B D' F D' F' D' L D L' R' D D R D", 
      instruction: "Front side down, Bottom right, Front side up."
    },
    { 
      name: 'White Facing RIGHT', 
      moves: "R' D' R", 
      // SETUP: Prvo složi krst, pa izbaci ćošak tako da bela gleda DESNO
      setup: "R' D' R L D L' B' D' B D' F D' F' D' L D L'", 
      instruction: "Right side down, Bottom left, Right side up."
    },
    { 
      name: 'White Facing BOTTOM', 
      moves: "R' D D R D R' D' R", 
      // SETUP: Prvo složi krst, pa izbaci ćošak tako da bela gleda u POD
      setup: "R' D' R L D L' B' D' B D' F D' F' D' L D L' R' D D R D R' D R D D", 
      instruction: "Double bottom turn to flip the white sticker to the side, then insert."
    }
  ] 
},
  { 
    id: 'oll', 
    stage: '03', 
    title: 'Yellow Face (OLL)', 
    color: '#fbbf24', 
    description: 'Orient the top layer to be all yellow.',
    holding: 'Yellow on TOP.',
    tasks: ['Yellow Cross', 'Sune to finish'], 
    algos: [
      { 
        name: 'Yellow Cross (Line)', 
        moves: "F R U R' U' F'", 
        setup: "R2 U2 B2 D2 F2 R2 U2 L2 B2 U' B' R' F U2 L' D2 B' R2 U" 
      },
      { 
        name: 'Sune', 
        moves: "R U R' U R U2 R'", 
        setup: "R U2 R' U' R U' R' B2 D2 F2 L2 U' R2 D B2 L2 F2 U2 R'" 
      }
    ] 
  },
  { 
    id: 'pll', 
    stage: '04', 
    title: 'The Final Solve (PLL)', 
    color: '#f87171', 
    description: 'Final permutation of top layer.',
    holding: 'Check for Headlights at the back.',
    tasks: ['Permute Corners', 'Permute Edges'], 
    algos: [
      { 
        name: 'T-Perm', 
        moves: "R U R' U' R' F R2 U' R' U' R U R' F'", 
        setup: "R U R' U' R' F R2 U' R' U' R U R' F' D2 B2 L2 U2 F2 R2" 
      }
    ] 
  },
];

const KEY_MAPPINGS = [
  { key: 'R', move: 'R' }, { key: 'L', move: 'L' }, { key: 'U', move: 'U' },
  { key: 'D', move: 'D' }, { key: 'F', move: 'F' }, { key: 'B', move: 'B' },
];

// ─── LEFT SIDEBAR COMPONENT ───────────────────────────────────────────────────

export function LeftSidebar({ open, time, moveCount, timerRunning, onScramble, onReset, onToggleTimer }) {
  return (
    <aside className={`sidebar left ${open ? 'visible' : ''}`} style={{ 
      width: '300px', background: '#0f1115', borderRight: '1px solid rgba(255,255,255,0.05)', height: '100vh' 
    }}>
      <div style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#fff', letterSpacing: '1px', marginBottom: '30px' }}>
          CUBE<span style={{ color: '#38bdf8' }}>PRO</span>
        </h2>

        <div style={{ background: '#1a1d23', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', fontWeight: '700', color: timerRunning ? '#38bdf8' : '#fff', fontFamily: 'monospace' }}>
            {time}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', letterSpacing: '2px' }}>TIMER</div>
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
             <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{moveCount}</span> <span style={{ fontSize: '10px', color: '#666' }}>MOVES</span>
          </div>
        </div>

        <button 
          onClick={onToggleTimer} 
          style={{ 
            width: '100%', padding: '14px', borderRadius: '12px', background: timerRunning ? '#f87171' : '#38bdf8', 
            border: 'none', fontWeight: '800', cursor: 'pointer', marginBottom: '12px', color: '#000'
          }}
        >
          {timerRunning ? 'STOP TIMER' : 'START SOLVE'}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '30px' }}>
          <button onClick={onScramble} style={{ background: '#1a1d23', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>Scramble</button>
          <button onClick={onReset} style={{ background: '#1a1d23', color: '#f87171', border: '1px solid #333', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>Reset</button>
        </div>

        <div style={{ color: '#444', fontSize: '10px', fontWeight: '800', letterSpacing: '1px', marginBottom: '12px' }}>KEYBOARD CONTROLS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {KEY_MAPPINGS.map(m => (
            <div key={m.key} style={{ background: '#1a1d23', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700' }}>{m.key}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── RIGHT SIDEBAR COMPONENT ──────────────────────────────────────────────────

export function RightSidebar({ open, onExecAlgo, onOpenHelper }) {
  const [checked, setChecked] = useState({});
  const [openAlgos, setOpenAlgos] = useState({});

  const toggleCheck = (key) => setChecked(p => ({ ...p, [key]: !p[key] }));
  const toggleAlgos = (id) => setOpenAlgos(p => ({ ...p, [id]: !p[id] }));

  return (
    <aside className={`sidebar right ${open ? 'visible' : ''}`} style={{ 
      width: '360px', background: '#0f1115', borderLeft: '1px solid rgba(255,255,255,0.05)', height: '100vh', overflowY: 'auto'
    }}>
      <div style={{ padding: '24px' }}>
        
        <header style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>HOW TO SOLVE</h2>
          <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Follow Step 01 to 04</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {CFOP_STEPS.map((step) => {
            const isDone = step.tasks.every((_, i) => checked[`${step.id}-${i}`]);
            const isOpen = !!openAlgos[step.id];

            return (
              <div key={step.id} style={{
                background: isDone ? 'rgba(74, 222, 128, 0.03)' : '#16191e',
                borderRadius: '16px',
                border: `1px solid ${isDone ? '#4ade8055' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.3s'
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: step.color }}>STEP {step.stage}</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: isDone ? '#4ade80' : '#fff' }}>{step.title}</div>
                  </div>
                  {isDone && <span style={{ color: '#4ade80' }}>✓</span>}
                </div>

                <div style={{ padding: '16px' }}>
                  <div style={{ background: '#000', padding: '12px', borderRadius: '10px', marginBottom: '15px', borderLeft: `3px solid ${step.color}` }}>
                    <div style={{ fontSize: '11px', color: '#fff', fontWeight: '700', marginBottom: '4px' }}>GOAL:</div>
                    <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.4' }}>{step.description}</div>
                    <div style={{ marginTop: '10px', fontSize: '11px', color: step.color, fontWeight: '700' }}>📍 {step.holding}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {step.tasks.map((task, i) => (
                      <div 
                        key={i} 
                        onClick={() => toggleCheck(`${step.id}-${i}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: checked[`${step.id}-${i}`] ? 0.3 : 1 }}
                      >
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: step.color }}>
                          {checked[`${step.id}-${i}`] && '✓'}
                        </div>
                        <span style={{ fontSize: '12px', color: '#ccc' }}>{task}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => toggleAlgos(step.id)}
                    style={{ 
                      width: '100%', marginTop: '15px', padding: '10px', borderRadius: '8px', 
                      background: isOpen ? step.color : 'rgba(255,255,255,0.03)', color: isOpen ? '#000' : '#888',
                      border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer' 
                    }}
                  >
                    {isOpen ? 'CLOSE MOVES' : `VIEW MOVES (${step.algos.length})`}
                  </button>

                  {isOpen && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {step.algos.map((algo, idx) => (
                        <div key={idx} style={{ background: '#0a0c10', padding: '12px', borderRadius: '10px' }}>
                          <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px', fontWeight: '700' }}>{algo.name}</div>
                          <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#fff', textAlign: 'center', marginBottom: '10px' }}>{algo.moves}</div>
                          
                          {/* GLAVNA PROMENA: Pozivamo onOpenHelper umesto onExecAlgo za tutorijal */}
                          <button 
                            onClick={() => onOpenHelper(algo.name, algo.moves, algo.setup || "")}
                            style={{ 
                              width: '100%', padding: '8px', background: '#38bdf8', color: '#000', 
                              border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' 
                            }}
                          >
                            SHOW EXAMPLE
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '30px', padding: '15px', background: '#1a1d23', borderRadius: '12px', color: '#444' }}>
          <div style={{ fontSize: '10px', fontWeight: '800', marginBottom: '10px', color: '#666' }}>NOTATION CHEAT SHEET</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '11px' }}>
              <span><strong>R</strong>: Right</span> <span><strong>L</strong>: Left</span>
              <span><strong>U</strong>: Top</span> <span><strong>F</strong>: Front</span>
              <span><strong>'</strong>: Inverse</span> <span><strong>2</strong>: Double</span>
          </div>
        </div>
      </div>
    </aside>
  );
}