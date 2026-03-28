// App.jsx — State Management & Layout — Material Dark Redesign

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { initThree, createCubies, checkColorsSolved, MOVES } from './Cube'
import { executeMove } from './Controls'
import { LeftSidebar, RightSidebar } from './Sidebar'
import InstructionModal from './instructionModal';

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

  const [moveCount,    setMoveCount]    = useState(0)
  const [time,         setTime]         = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [moveHistory,  setMoveHistory]  = useState([])
  const [solved,       setSolved]       = useState(false)
  const [leftOpen,     setLeftOpen]     = useState(false)
  const [rightOpen,    setRightOpen]    = useState(false)
  const [scrambleSeq,  setScrambleSeq]  = useState('')
  const [modalData, setModalData] = useState({ isOpen: false, title: '', algo: '', setup: '' });
  
  const openHelper = (title, algo, setup = "") => {
  setModalData({ isOpen: true, title, algo, setup });
};
  // ── Three.js init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const three  = initThree(canvas)
    threeRef.current  = three
    cubiesRef.current = createCubies(three.scene)

    let raf
const tick = () => {
  raf = requestAnimationFrame(tick);

  // Samo pozovi update, on sada direktno menja scene.quaternion
  three.update(); 

  if (!animatingRef.current && moveQueueRef.current.length > 0) {
    executeMove(
      moveQueueRef.current.shift(),
      cubiesRef.current,
      animatingRef,
      { setMoveCount, setMoveHistory, setSolved, setTimerRunning },
      { moveCountRef, solvedRef, timerRunRef, startTimeRef }
    )
  }
  three.renderer.render(three.scene, three.camera);
}
    tick()
    return () => { cancelAnimationFrame(raf); three.dispose() }
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
      if (e.repeat) return
      const key   = e.key.toUpperCase()
      const prime = e.shiftKey
      const map   = { R:'R', L:'L', U:'U', D:'D', F:'F', B:'B' }
      if (map[key]) {
        e.preventDefault()
        moveQueueRef.current.push(prime ? `${key}'` : key)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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

      {/* ── Body ── */}
      <div className="app-body">

        {/* Left sidebar */}
        <LeftSidebar
          open={leftOpen}
          time={fmt(time)}
          moveCount={moveCount}
          timerRunning={timerRunning}
          onScramble={scramble}
          onReset={reset}
          onToggleTimer={toggleTimer}
        />
        <InstructionModal 
  isOpen={modalData.isOpen} 
  onClose={() => setModalData({ ...modalData, isOpen: false })}
  algoTitle={modalData.title}
  algorithm={modalData.algo}
  setup={modalData.setup} // Dodajemo setup potez
/>

        {/* Canvas */}
        <div className="canvas-area">
          <canvas ref={canvasRef} id="cube-canvas" />

          {/* Scramble indicator */}
          {scrambleSeq && (
            <div className="scramble-indicator">
              ◎ Scrambled — Ready to solve
            </div>
          )}

          {/* Notation tip */}
          <div className="notation-tip">
            Clockwise · R L U D F B<br />
            Counter-CW · Shift + key
          </div>

          {/* Move history */}
          {moveHistory.length > 0 && (
            <div className="move-history">
              {moveHistory.slice(-9).map((m, i, arr) => (
                <div
                  key={i}
                  className={`move-badge ${i === arr.length - 1 ? 'recent' : ''}`}
                >
                  {m}
                </div>
              ))}
            </div>
          )}

          {/* Solved overlay */}
          {solved && (
            <div className="solved-overlay" onClick={() => setSolved(false)}>
              <div className="solved-card" onClick={e => e.stopPropagation()}>
                <div className="solved-subtitle">Congratulations</div>
                <div className="solved-title">Solved!</div>
                <div className="solved-stats">
                  {fmt(time)}
                  <span>·</span>
                  {moveCount} moves
                </div>
                <button
                  className="btn success"
                  style={{ marginBottom: 10 }}
                  onClick={reset}
                >
                  ↺ New Cube
                </button>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.04em',
                  }}
                >
                  Click outside to dismiss
                </div>
              </div>
            </div>
          )}

          {/* Mobile toggles */}
          <button
            className="mobile-toggle"
            style={{ bottom: 76 }}
            onClick={() => { setLeftOpen(!leftOpen); setRightOpen(false) }}
          >
            ☰
          </button>
          <button
            className="mobile-toggle"
            style={{ bottom: 20 }}
            onClick={() => { setRightOpen(!rightOpen); setLeftOpen(false) }}
          >
            📖
          </button>
        </div>

        {/* Right sidebar */}
       <RightSidebar 
  open={rightOpen} 
  onExecAlgo={execAlgo} 
  onOpenHelper={openHelper} // DODAJ OVO
/>
      </div>
    </div>
  )
}