// App.jsx — State Management & Layout — Material Dark Redesign

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { initThree, createCubies, checkColorsSolved, MOVES } from './Cube'
import { executeMove, detectCurrentFront, getMappedMove } from './Controls'
import { LeftSidebar, RightSidebar } from './Sidebar'
import InstructionModal from './InstructionModal';
import WelcomeModal from './WelcomeModal';

// ── Hook za praćenje veličine ekrana ──────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

// ── Mobilni D-Pad za poteze ───────────────────────────────────────────────────
function MobileControls({ onMove }) {
  // Dinamički izračun da stane na svaki ekran
  const screenW = window.innerWidth;
  // 4 kolone + 3 gapa — maksimalno 95% širine ekrana
  const totalCols = 4;
  const gap = 5;
  const btnW = Math.min(52, Math.floor((screenW * 0.95 - gap * (totalCols - 1)) / totalCols));
  const btnH = 38;

  const rows = [
    ["U'", "U",  null, null],
    ["L",  "F",  "F'", "R" ],
    ["L'", "D",  "D'", "R'"],
  ];

  const totalW = totalCols * btnW + (totalCols - 1) * gap;
  const totalH = 3 * btnH + 2 * gap;

  return (
    <div style={{ position: 'relative', width: totalW, height: totalH }}>
      {rows.map((row, rowIdx) =>
        row.map((label, colIdx) => {
          if (!label) return null;
          const isPrime = label.includes("'");
          return (
            <button
              key={label}
              onPointerDown={e => { e.preventDefault(); onMove(label); }}
              style={{
                position: 'absolute',
                top:  rowIdx * (btnH + gap),
                left: colIdx * (btnW + gap),
                width: btnW,
                height: btnH,
                borderRadius: 7,
                background: isPrime ? 'rgba(248,113,113,0.15)' : 'rgba(56,189,248,0.15)',
                border: `1px solid ${isPrime ? 'rgba(248,113,113,0.4)' : 'rgba(56,189,248,0.4)'}`,
                color: isPrime ? '#f87171' : '#38bdf8',
                fontFamily: 'monospace',
                fontSize: Math.max(11, btnW * 0.22),
                fontWeight: 700,
                cursor: 'pointer',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              {label}
            </button>
          );
        })
      )}
    </div>
  );
}

export default function App() {
  const canvasRef     = useRef(null)
  const threeRef      = useRef(null)
  const cubiesRef     = useRef([])
  const animatingRef  = useRef(false)
  const moveQueueRef  = useRef([])
  const moveCountRef  = useRef(0)
  const solvedRef     = useRef(false)
  const timerRunRef   = useRef(false)
  const startTimeRef  = useRef(null)
  const timerInterval = useRef(null)

  const isMobile = useIsMobile();

  const [showWelcome,  setShowWelcome]  = useState(true)
  const [moveCount,    setMoveCount]    = useState(0)
  const [time,         setTime]         = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [moveHistory,  setMoveHistory]  = useState([])
  const [solved,       setSolved]       = useState(false)
  const [leftOpen,     setLeftOpen]     = useState(false)
  const [rightOpen,    setRightOpen]    = useState(false)
  const [scrambleSeq,  setScrambleSeq]  = useState('')
  const [modalData,    setModalData]    = useState({ isOpen: false, title: '', algo: '', setup: '', label: '' });

  const openHelper = (title, algo, setup = "", label) => {
    setModalData({ isOpen: true, title, algo, setup, label: label || algo });
  };

  // ── Three.js init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const three  = initThree(canvas)
    threeRef.current  = three
    cubiesRef.current = createCubies(three.scene)

    // Renderer prati veličinu canvas elementa
    const handleResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      three.renderer.setSize(w, h, false);
      three.camera.aspect = w / h;

      // Na mobilnom pomjeri kameru dalje — kocka izgleda manja
      const isMob = window.innerWidth <= 768;
      three.camera.position.z = isMob ? 11 : 7.5;

      three.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);
    // Mali timeout da se layout "slegne" prije prvog mjerenja
    setTimeout(handleResize, 50);

    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick);
      three.update();
      if (!animatingRef.current && moveQueueRef.current.length > 0) {
        const nextMove = moveQueueRef.current.shift();
        executeMove(
          nextMove,
          cubiesRef.current,
          animatingRef,
          { setMoveCount, setMoveHistory, setSolved, setTimerRunning },
          { moveCountRef, solvedRef, timerRunRef, startTimeRef }
        );
      }
      three.renderer.render(three.scene, three.camera);
    };
    tick()
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      three.dispose();
    }
  }, [])

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRunning) {
      timerInterval.current = setInterval(() => {
        setTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 500)
    } else {
      clearInterval(timerInterval.current)
    }
    return () => clearInterval(timerInterval.current)
  }, [timerRunning])

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.repeat) return;
      const key   = e.key.toUpperCase();
      const prime = e.shiftKey;
      const validKeys = new Set(['R', 'L', 'U', 'D', 'F', 'B']);
      if (validKeys.has(key)) {
        e.preventDefault();
        const rawMove      = prime ? `${key}'` : key;
        const currentFront = detectCurrentFront(cubiesRef.current);
        const mappedMove   = getMappedMove(rawMove, currentFront, cubiesRef.current);
        moveQueueRef.current.push(mappedMove);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Mobilni potez ──────────────────────────────────────────────────────────
  const handleMobileMove = useCallback((moveLabel) => {
    if (MOVES[moveLabel]) moveQueueRef.current.push(moveLabel);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const scramble = useCallback(() => {
    const keys = Object.keys(MOVES)
    const seq  = Array.from({ length: 20 }, () => keys[Math.floor(Math.random() * keys.length)])
    seq.forEach(m => moveQueueRef.current.push(m))
    setScrambleSeq(seq.join(' '))
    resetStats()
  }, [])

  const reset = useCallback(() => {
    const { scene } = threeRef.current
    cubiesRef.current.forEach(c => scene.remove(c))
    cubiesRef.current    = createCubies(scene)
    moveQueueRef.current = []
    animatingRef.current = false
    setScrambleSeq('')
    resetStats()
  }, [])

  const resetStats = () => {
    setMoveCount(0);   moveCountRef.current = 0
    setTime(0)
    setTimerRunning(false); timerRunRef.current = false
    startTimeRef.current = null
    setMoveHistory([])
    solvedRef.current = false
    setSolved(false)
  }

  const execAlgo = useCallback((movesStr) => {
    movesStr.trim().split(/\s+/).forEach(m => {
      if (MOVES[m]) moveQueueRef.current.push(m)
    })
  }, [])

  const toggleTimer = () => {
    const next = !timerRunning
    setTimerRunning(next)
    timerRunRef.current = next
    if (next) startTimeRef.current = Date.now() - time * 1000
  }

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const closeAllSidebars = () => {
    setLeftOpen(false)
    setRightOpen(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-title">
          <div className="app-title-dot" />
          Cube · Trainer
        </div>

        <div className="header-status">
          <button
            className="status-pill"
            onClick={() => setShowWelcome(true)}
            style={{ cursor: 'pointer', border: 'none', background: 'none' }}
          >
            ⓘ Info
          </button>
          <div className={`status-pill ${timerRunning ? 'active' : ''}`}>
            {timerRunning ? '⏱ Timing' : '⏸ Ready'}
          </div>
          <div className={`status-pill ${solved ? 'solved-active' : ''}`}>
            {solved ? '✓ Solved' : '○ Unsolved'}
          </div>
          <div className="status-pill" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {moveCount} moves
          </div>
        </div>
      </header>

      {/* ── Modali ── */}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      <InstructionModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ ...modalData, isOpen: false })}
        algoTitle={modalData.title}
        algorithm={modalData.algo}
        setup={modalData.setup}
        cubies={cubiesRef.current}
        labelMoves={modalData.label}
      />

      {/* ── Body ── */}
      <div className="app-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Backdrop — position:fixed da pokrije i header */}
        {(leftOpen || rightOpen) && (
          <div
            onClick={closeAllSidebars}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 499,
              backdropFilter: 'blur(2px)',
            }}
          />
        )}

        {/* Left sidebar */}
        <LeftSidebar
          open={leftOpen}
          onClose={closeAllSidebars}
          time={fmt(time)}
          moveCount={moveCount}
          timerRunning={timerRunning}
          onScramble={scramble}
          onReset={reset}
          onToggleTimer={toggleTimer}
        />

        {/* Canvas area — flex kolona: canvas gore, D-pad dole */}
        <div
          className="canvas-area"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* ── Gornji dio: samo kocka ── */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            <canvas
              ref={canvasRef}
              id="cube-canvas"
              style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Scramble indicator */}
            {scrambleSeq && (
              <div className="scramble-indicator">◎ Scrambled — Ready to solve</div>
            )}

            {/* Notation tip — samo desktop */}
            {!isMobile && (
              <div className="notation-tip">
                Clockwise · R L U D F B<br />
                Counter-CW · Shift + key
              </div>
            )}

            {/* Move history — pozicioniran na dnu ovog diva */}
            {moveHistory.length > 0 && (
              <div
                className="move-history"
                style={isMobile ? { bottom: 8 } : {}}
              >
                {moveHistory.slice(-9).map((m, i, arr) => (
                  <div key={i} className={`move-badge ${i === arr.length - 1 ? 'recent' : ''}`}>
                    {m}
                  </div>
                ))}
              </div>
            )}

            {/* Sidebar toggle dugmad — gore desno, samo mobilno */}
            {isMobile && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                display: 'flex', flexDirection: 'column', gap: 8, zIndex: 100,
              }}>
                <button
                  onClick={() => { setLeftOpen(!leftOpen); setRightOpen(false); }}
                  style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: leftOpen ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${leftOpen ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.12)'}`,
                    color: '#fff', fontSize: 17, cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                  }}
                >☰</button>
                <button
                  onClick={() => { setRightOpen(!rightOpen); setLeftOpen(false); }}
                  style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: rightOpen ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${rightOpen ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.12)'}`,
                    color: '#fff', fontSize: 17, cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                  }}
                >📖</button>
              </div>
            )}

            {/* Solved overlay */}
            {solved && (
              <div className="solved-overlay" onClick={() => setSolved(false)}>
                <div className="solved-card" onClick={e => e.stopPropagation()}>
                  <div className="solved-subtitle">Congratulations</div>
                  <div className="solved-title">Solved!</div>
                  <div className="solved-stats">
                    {fmt(time)}<span>·</span>{moveCount} moves
                  </div>
                  <button className="btn success" style={{ marginBottom: 10 }} onClick={reset}>
                    ↺ New Cube
                  </button>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                    Click outside to dismiss
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Donji dio: D-pad — fiksna visina, vidljiv ispod kocke ── */}
          {isMobile && (
            <div style={{
              flexShrink: 0,
              // Auto visina: 3 reda × 38px + 2 × 5px gap + 24px padding
              padding: '12px 0',
              background: 'rgba(6,9,16,0.95)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}>
              <MobileControls onMove={handleMobileMove} />
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <RightSidebar
          open={rightOpen}
          onClose={closeAllSidebars}
          onExecAlgo={execAlgo}
          onOpenHelper={openHelper}
        />
      </div>
    </div>
  )
}