import React, { useState, useEffect } from 'react';

// ─── HOOK ─────────────────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── CLOSE BUTTON ─────────────────────────────────────────────────────────────
function CloseBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#666',
        fontSize: 16,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      ✕
    </button>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const CFOP_STEPS = [
{ 
  id: 'cross', stage: '01', title: 'The White Cross', color: '#38bdf8', 
  description: 'Building the "Daisy": Place 4 white edges around the yellow center.',
  holding: 'Yellow center on TOP, White center on BOTTOM.',
  tasks: ['Find a White Edge piece', 'Bring it to the Front face (Middle layer)', 'Rotate it up to the Yellow top'], 
  algos: [{ name: "Case: Edge on Front-Bottom", moves: "F R'", labelMoves:"F D F", setup: "B2 L2 D2 U' R2 U B2 D2 F2 L2 F' R' B L D' R F D B F' U' L' D R F R", instruction: "If it's at the bottom, move F to bring it to the side, then R to bring it up." }] 
},
{ 
  id: 'corners', stage: '02', title: 'Solving the Corners', color: '#4ade80', 
  description: 'White Cross is done and on TOP. Now we fill the 4 corners.',
  holding: 'White Cross on TOP. Front facing YOU.',
  tasks: ['Find a corner piece with White on it in the bottom layer', 'Use D moves to place it directly UNDER its spot', 'Look at the White sticker and use the matching move'], 
  algos: [
    { name: 'White Facing FRONT', moves: "F D F'", labelMoves:"F D F'", setup: "R' D' R L D L' B' D' B D' F D' F' D' L D L' R' D D R D", instruction: "Front side down, Bottom right, Front side up." },
    { name: 'White Facing RIGHT', moves: "R' D' R", labelMoves: "R' D' R", setup: "R' D' R L D L' B' D' B D' F D' F' D' L D L'", instruction: "Right side down, Bottom left, Right side up." },
    { name: 'White Facing BOTTOM', moves: "R' D D R D R' D' R", labelMoves: "R' D D R D R' D' R", setup: "R' D' R L D L' B' D' B D' F D' F' D' L D L' R' D D R D R' D R D D", instruction: "Double bottom turn to flip the white sticker to the side, then insert." }
  ] 
},
{ 
  id: 'middle-layer', stage: '03', title: 'The Middle Layer', color: '#3b82f6', 
  description: 'First layer is done. Flip the cube: YELLOW is now TOP. We solve the 4 middle edges.',
  holding: 'Yellow face on TOP. White face on BOTTOM.',
  tasks: ['Find an edge piece on top without Yellow', 'Rotate U to match its side color with the center (making a "T" shape)', 'Check if it needs to go LEFT or RIGHT'], 
  algos: [
    { name: 'Insert to the RIGHT', moves: "U' R' U R U F U' F'", labelMoves: "U R U' R' U' F' U F", setup: "U' R' U R U F U' F' U' R' U R U F U' F' U' R' U R U F U' F' U", instruction: "Up, Right, Up-prime, Right-prime... then rotate to front-face and insert." },
    { name: 'Insert to the LEFT', moves: "U L U' L' U' F' U F", labelMoves: "U' L' U L U F U' F'", setup: "U L U' L' U' F' U F U L U' L' U' F' U F U L U' L' U' F' U F U'", instruction: "Up-prime, Left-prime, Up, Left... then rotate to front-face and insert." }
  ] 
},
{ 
  id: 'yellow-cross', stage: '04', title: 'The Yellow Cross', color: '#eab308', 
  description: 'Now we build the cross. We use the same algorithm for all patterns, just change how you hold the cube.',
  holding: 'Yellow face on TOP. White face on BOTTOM.',
  tasks: ['DOT: Use the algo from any side.', 'L-SHAPE: Hold at 09:00 (Back and Left).', 'LINE: Hold it horizontally (Left to Right).'], 
  algos: [{ name: 'Cross Algorithm', moves: "F R U R' U' F'", labelMoves: "F R U R' U' F'", setup: "F R U R' U' F' U2", instruction: "Front, Right, Up, Right-prime, Up-prime, Front-prime." }] 
},
{ 
  id: 'align-edges', stage: '05', title: 'Aligning the Cross', color: '#f59e0b', 
  description: 'First, get two adjacent edges to match. Then, use the second algorithm to align all four.',
  holding: 'Yellow on TOP. White on BOTTOM.',
  tasks: ["STEP 1: If matches are opposite, run R U R' U R U2 R'.", 'STEP 2: Find two adjacent matches.', 'STEP 3: Hold one in FRONT and one on the RIGHT.', "STEP 4: Run the final algo: U R U R' U R U2 R'."], 
  algos: [
    { name: '1. Get Adjacent Matches', moves: "R U R' U R U U R'", labelMoves: "R U R' U R U2 R'", instruction: "Use this when edges are opposite or only one matches." },
    { name: '2. Final Alignment', moves: "U R U R' U R U U R'", labelMoves: "U' R U R' U R U2 R'", instruction: "Hold matching edges at FRONT and RIGHT, then run this." }
  ] 
},
{ 
  id: 'position-corners', stage: '06', title: 'Positioning Corners', color: '#8b5cf6', 
  description: 'Place all corners in their correct "homes".',
  holding: 'Yellow on TOP. Find one corner that is in the right spot.',
  tasks: ['Find a corner that belongs between its three surrounding centers.', 'If none are correct: Run the algo once to "create" a correct corner.', 'Hold the correct "Anchor" corner in the BOTTOM-RIGHT of the top face.', 'Repeat the algo until all 4 corners are in their correct homes.'], 
  algos: [{ name: 'Corner Cycle', moves: "U R U' L' U R' U' L", labelMoves: "U R U' L' U R' U' L", setup: "L' U R U' L U R' U' ", instruction: "Up, Right, Up-prime, Left-prime, Up, Right-prime, Up-prime, Left." }] 
},
{ 
  id: 'final-solve', stage: '07', title: 'Final Orientation', color: '#10b981', 
  description: "The final step! Use R' D' R D to rotate the corners.",
  holding: 'Yellow on TOP. Place an unsolved corner in the BOTTOM-RIGHT.',
  tasks: ['Rotate the WHOLE CUBE so an unsolved corner is at the BOTTOM-RIGHT.', "Repeat R' D' R D until the Yellow sticker faces UP.", 'CRITICAL: Always finish the full 4 moves, including the D!', 'Rotate ONLY the top layer (U) to bring the next corner to the same spot.', 'Repeat until all corners are solved.'], 
  algos: [{ name: 'The Final Sequence', moves: "R' D' R D", labelMoves: "R' D' R D", instruction: "Right-prime, Down-prime, Right, Down. Repeat until the yellow face is up." }] 
}
];

const KEY_MAPPINGS = [
  { key: 'R', desc: 'Right' }, { key: 'L', desc: 'Left' },
  { key: 'U', desc: 'Up' },   { key: 'D', desc: 'Down' },
  { key: 'F', desc: 'Front' }, { key: 'B', desc: 'Back' },
];

// ─── LEFT SIDEBAR ─────────────────────────────────────────────────────────────

export function LeftSidebar({ open, onClose, time, moveCount, timerRunning, onScramble, onReset, onToggleTimer }) {
  const isMobile = useIsMobile();

  const asideStyle = isMobile
    ? {
        position: 'fixed', top: 0, left: 0,
        width: '85vw', maxWidth: '320px', height: '100vh',
        background: '#0f1115',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
        zIndex: 500,
        transform: open ? 'translateX(0)' : 'translateX(-110%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: open ? '8px 0 40px rgba(0,0,0,0.8)' : 'none',
      }
    : {
        width: '320px', flexShrink: 0,
        background: '#0f1115',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        height: '100vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      };

  return (
    <aside style={{ ...asideStyle, position: asideStyle.position || 'relative' }}>
      {/* X dugme — samo na mobilnom */}
      {isMobile && <CloseBtn onClick={onClose} />}

      <div style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', letterSpacing: '2px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '8px', paddingRight: isMobile ? '40px' : 0 }}>
          <div style={{ width: '24px', height: '24px', background: '#38bdf8', borderRadius: '4px' }}></div>
          CUBE<span style={{ color: '#38bdf8' }}>PRO</span>
        </h2>

        {/* TIMER */}
        <div style={{ background: timerRunning ? 'rgba(56,189,248,0.1)' : '#1a1d23', borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '24px', border: `1px solid ${timerRunning ? '#38bdf844' : 'transparent'}`, transition: 'all 0.3s ease' }}>
          <div style={{ fontSize: '42px', fontWeight: '800', color: timerRunning ? '#38bdf8' : '#fff', fontFamily: '"JetBrains Mono", monospace' }}>{time}</div>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', letterSpacing: '3px', fontWeight: 'bold' }}>SOLVE TIME</div>
          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <div><div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>{moveCount}</div><div style={{ fontSize: '9px', color: '#555' }}>MOVES</div></div>
            <div><div style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8' }}>{Math.round(moveCount / (parseFloat(time) || 1) * 10) / 10}</div><div style={{ fontSize: '9px', color: '#555' }}>TPS</div></div>
          </div>
        </div>

        {/* CONTROLS */}
        <button onClick={onToggleTimer} style={{ width: '100%', padding: '16px', borderRadius: '14px', background: timerRunning ? '#f87171' : '#38bdf8', border: 'none', fontWeight: '900', cursor: 'pointer', marginBottom: '12px', color: '#000', boxShadow: `0 4px 0 ${timerRunning ? '#b91c1c' : '#0284c7'}`, transition: 'all 0.1s' }}
          onMouseDown={e => e.target.style.transform = 'translateY(2px)'}
          onMouseUp={e => e.target.style.transform = 'translateY(0)'}
        >
          {timerRunning ? 'STOP TIMER' : 'START SOLVING'}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '40px' }}>
          <button onClick={onScramble} style={{ background: '#16191e', color: '#fff', border: '1px solid #333', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Scramble</button>
          <button onClick={onReset}    style={{ background: '#16191e', color: '#f87171', border: '1px solid #333', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>Reset</button>
        </div>

        {/* NOTATION */}
        <div style={{ marginBottom: '35px' }}>
          <div style={{ color: '#444', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px' }}>LEARN NOTATION</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { m: 'R', d: 'Right UP', color: '#f87171' }, { m: "R'", d: 'Right DOWN', color: '#f87171' },
              { m: 'U', d: 'Top LEFT', color: '#facc15' }, { m: "U'", d: 'Top RIGHT', color: '#facc15' },
              { m: 'F', d: 'Front CLOCK', color: '#4ade80' }, { m: "F'", d: 'Front COUNTER', color: '#4ade80' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#16191e', padding: '12px 8px', borderRadius: '10px', borderLeft: `3px solid ${item.color}`, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: '#fff', fontWeight: '900', fontSize: '15px' }}>{item.m}</span>
                <div style={{ color: '#888', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase' }}>{item.d}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: '#666', fontSize: '10px', margin: 0, lineHeight: '1.5' }}>
              <strong style={{ color: '#38bdf8' }}>TIP:</strong> Imagine looking directly at the face. <strong>"Prime" (')</strong> is always counter-clockwise!
            </p>
          </div>
        </div>

        {/* KEYBOARD */}
        <div style={{ color: '#444', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px' }}>KEYBOARD BINDINGS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {KEY_MAPPINGS.map(m => (
            <div key={m.key} style={{ background: '#1a1d23', padding: '12px 4px', borderRadius: '8px', textAlign: 'center', border: '1px solid #333', boxShadow: '0 3px 0 #000' }}>
              <div style={{ fontSize: '14px', color: '#fff', fontWeight: '900' }}>{m.key}</div>
              <div style={{ fontSize: '8px', color: '#38bdf8', marginTop: '2px', opacity: 0.7 }}>{m.desc.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '20px', fontSize: '10px', color: '#444', textAlign: 'center' }}>
          Hold <strong>Shift</strong> for Inverse (') moves
        </div>
      </div>
    </aside>
  );
}

// ─── RIGHT SIDEBAR ────────────────────────────────────────────────────────────

export function RightSidebar({ open, onClose, onExecAlgo, onOpenHelper }) {
  const isMobile = useIsMobile();
  const [checked,   setChecked]   = useState({});
  const [openAlgos, setOpenAlgos] = useState({});

  const toggleCheck = (key) => setChecked(p => ({ ...p, [key]: !p[key] }));
  const toggleAlgos = (id)  => setOpenAlgos(p => ({ ...p, [id]: !p[id] }));

  const asideStyle = isMobile
    ? {
        position: 'fixed', top: 0, right: 0,
        width: '85vw', maxWidth: '360px', height: '100vh',
        background: '#0f1115',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        overflowY: 'auto', zIndex: 500,
        transform: open ? 'translateX(0)' : 'translateX(110%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: open ? '-8px 0 40px rgba(0,0,0,0.8)' : 'none',
      }
    : {
        width: '360px', flexShrink: 0,
        background: '#0f1115',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        height: '100vh', overflowY: 'auto',
      };

  return (
    <aside style={asideStyle}>
      {/* X dugme — samo na mobilnom */}
      {isMobile && <CloseBtn onClick={onClose} />}

      <div style={{ padding: '24px' }}>
        <header style={{ marginBottom: '24px', paddingRight: isMobile ? '40px' : 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>HOW TO SOLVE</h2>
          <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>Follow Step 01 to 07</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {CFOP_STEPS.map((step) => {
            const isDone = step.tasks.every((_, i) => checked[`${step.id}-${i}`]);
            const isOpen = !!openAlgos[step.id];

            return (
              <div key={step.id} style={{ background: isDone ? 'rgba(74,222,128,0.03)' : '#16191e', borderRadius: '16px', border: `1px solid ${isDone ? '#4ade8055' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.3s' }}>
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
                      <div key={i} onClick={() => toggleCheck(`${step.id}-${i}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: checked[`${step.id}-${i}`] ? 0.3 : 1 }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: step.color, flexShrink: 0 }}>
                          {checked[`${step.id}-${i}`] && '✓'}
                        </div>
                        <span style={{ fontSize: '12px', color: '#ccc' }}>{task}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => toggleAlgos(step.id)}
                    style={{ width: '100%', marginTop: '15px', padding: '10px', borderRadius: '8px', background: isOpen ? step.color : 'rgba(255,255,255,0.03)', color: isOpen ? '#000' : '#888', border: 'none', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                    {isOpen ? 'CLOSE MOVES' : `VIEW MOVES (${step.algos.length})`}
                  </button>

                  {isOpen && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {step.algos.map((algo, idx) => (
                        <div key={idx} style={{ background: '#0a0c10', padding: '12px', borderRadius: '10px' }}>
                          <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px', fontWeight: '700' }}>{algo.name}</div>
                          <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#fff', textAlign: 'center', marginBottom: '10px' }}>{algo.labelMoves}</div>
                          <button
                            onClick={() => onOpenHelper(algo.name, algo.moves, algo.setup || "", algo.labelMoves || algo.moves)}
                            style={{ width: '100%', padding: '8px', background: '#38bdf8', color: '#000', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>
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
            <span><strong>U</strong>: Top</span>   <span><strong>F</strong>: Front</span>
            <span><strong>'</strong>: Inverse</span> <span><strong>2</strong>: Double</span>
          </div>
        </div>
      </div>
    </aside>
  );
}