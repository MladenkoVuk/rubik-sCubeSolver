// Sidebar.jsx — Material Dark Redesign
// Left: Stats / Controls / Keyboard Guide
// Right: CFOP Checklist with collapsible algorithms

import React, { useState } from 'react'

// ─── CFOP DATA ────────────────────────────────────────────────────────────────

const CFOP_STEPS = [
  {
    id: 'cross',
    stage: '01',
    title: 'Cross',
    color: '#38bdf8',        // sky-400
    bgColor: 'rgba(56,189,248,0.08)',
    borderColor: 'rgba(56,189,248,0.25)',
    description: 'Solve the white cross on the bottom layer.',
    tasks: [
      'Find all 4 white edge pieces',
      'Align edges with center colors',
      'Insert edges into bottom layer',
      'Verify cross is complete',
    ],
    algos: [
      { name: 'Daisy Method',  moves: "F U R U' R' F'" },
      { name: 'Edge Flip',     moves: "F R U R' U' F'" },
      { name: 'Cross Fix CW',  moves: "U F U' F'" },
      { name: 'Cross Fix CCW', moves: "U R U' R'" },
    ],
  },
  {
    id: 'f2l',
    stage: '02',
    title: 'F2L',
    color: '#4ade80',        // green-400
    bgColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.25)',
    description: 'Insert corner-edge pairs into the first two layers.',
    tasks: [
      'Locate corner-edge pair',
      'Set up pair above target slot',
      'Insert right-side pair',
      'Insert left-side pair',
      'Repeat for all 4 slots',
    ],
    algos: [
      { name: 'Right Insert',    moves: "U R U' R'" },
      { name: 'Left Insert',     moves: "U' L' U L" },
      { name: 'Right Slot Pair', moves: "R U R' U' R U R'" },
      { name: 'Left Slot Pair',  moves: "L' U' L U L' U' L" },
    ],
  },
  {
    id: 'oll',
    stage: '03',
    title: 'OLL',
    color: '#fbbf24',        // amber-400
    bgColor: 'rgba(251,191,36,0.08)',
    borderColor: 'rgba(251,191,36,0.25)',
    description: 'Orient all top-layer pieces — yellow face up.',
    tasks: [
      'Identify OLL case',
      'Orient top edges (Line / L / Dot)',
      'Orient top corners (Sune / Pi)',
      'Verify all yellow faces point up',
    ],
    algos: [
      { name: 'Line OLL',   moves: "F R U R' U' F'" },
      { name: 'L-Shape',    moves: "F U R U' R' F'" },
      { name: 'Sune',       moves: "R U R' U R U2 R'" },
      { name: 'Anti-Sune',  moves: "R U2 R' U' R U' R'" },
      { name: 'Dot OLL',    moves: "F R U R' U' F' B U L U' L' B'" },
    ],
  },
  {
    id: 'pll',
    stage: '04',
    title: 'PLL',
    color: '#f87171',        // red-400
    bgColor: 'rgba(248,113,113,0.08)',
    borderColor: 'rgba(248,113,113,0.25)',
    description: 'Permute all top-layer pieces to finish the solve.',
    tasks: [
      'Identify PLL case',
      'Align top layer (AUF)',
      'Execute PLL algorithm',
      'Final AUF to complete',
    ],
    algos: [
      { name: 'T-Perm',   moves: "R U R' U' R' F R2 U' R' U' R U R' F'" },
      { name: 'U-Perm A', moves: "R U' R U R U R U' R' U' R2" },
      { name: 'U-Perm B', moves: "R2 U R U R' U' R' U' R' U R'" },
      { name: 'J-Perm A', moves: "R U R' F' R U R' U' R' F R2 U' R'" },
      { name: 'Y-Perm',   moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
    ],
  },
]

// ─── KEYBOARD MAP ─────────────────────────────────────────────────────────────

const KEY_MAPPINGS = [
  { key: 'R', mod: false, move: 'R'  }, { key: 'R', mod: true,  move: "R'" },
  { key: 'L', mod: false, move: 'L'  }, { key: 'L', mod: true,  move: "L'" },
  { key: 'U', mod: false, move: 'U'  }, { key: 'U', mod: true,  move: "U'" },
  { key: 'D', mod: false, move: 'D'  }, { key: 'D', mod: true,  move: "D'" },
  { key: 'F', mod: false, move: 'F'  }, { key: 'F', mod: true,  move: "F'" },
  { key: 'B', mod: false, move: 'B'  }, { key: 'B', mod: true,  move: "B'" },
]

// ─── LEFT SIDEBAR ─────────────────────────────────────────────────────────────

export function LeftSidebar({
  open, time, moveCount, timerRunning, onScramble, onReset, onToggleTimer
}) {
  return (
    <aside className={`sidebar left ${open ? 'visible' : ''}`}>
      <div className="sidebar-inner">

        {/* ── Stats ── */}
        <div>
          <div className="section-label">Statistics</div>
          <div className="stats-grid">
            <div className="stat-card">
              <div
                className={`stat-value ${timerRunning ? 'running' : ''}`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {time}
              </div>
              <div className="stat-label">Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-value orange">{moveCount}</div>
              <div className="stat-label">Moves</div>
            </div>
          </div>
        </div>

        {/* ── Controls ── */}
        <div>
          <div className="section-label">Controls</div>
          <button className="btn primary" onClick={onScramble}>
            <span>⟳</span> Scramble
          </button>
          <button className="btn danger" onClick={onReset}>
            <span>↺</span> Reset Cube
          </button>
          <button className="btn success" onClick={onToggleTimer}>
            <span>{timerRunning ? '⏸' : '▶'}</span>
            {timerRunning ? 'Pause Timer' : 'Start Timer'}
          </button>
        </div>

        {/* ── Keyboard ── */}
        <div>
          <div className="section-label">Keyboard Controls</div>
          <div className="keymap-grid">
            {KEY_MAPPINGS.map(({ key, mod, move }) => (
              <div className="key-item" key={move}>
                <span className="key-badge">
                  {mod ? `⇧${key}` : key}
                </span>
                <span className="key-move">{move}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mouse ── */}
        <div>
          <div className="section-label">Mouse & Touch</div>
          <div
            style={{
              background: 'var(--bg-panel)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
            }}
          >
            {[
              ['🖱', 'Click & drag', 'Rotate view'],
              ['📱', 'Touch & drag', 'Rotate view'],
            ].map(([icon, label, desc]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '5px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: 14 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{desc}</div>
                </div>
              </div>
            ))}
            <div style={{ paddingTop: 8, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
              Hold <span style={{ color: 'var(--blue-400)', fontFamily: 'var(--font-mono)' }}>Shift</span> + key for counter-clockwise moves
            </div>
          </div>
        </div>

      </div>
    </aside>
  )
}

// ─── RIGHT SIDEBAR ────────────────────────────────────────────────────────────

export function RightSidebar({ open, onExecAlgo }) {
  const [checked,   setChecked]   = useState({})
  const [openAlgos, setOpenAlgos] = useState({})

  const toggleCheck   = (key) => setChecked(p => ({ ...p, [key]: !p[key] }))
  const toggleAlgos   = (id)  => setOpenAlgos(p => ({ ...p, [id]: !p[id] }))
  const resetChecks   = ()    => setChecked({})
  const isStageDone   = (s)   => s.tasks.every((_, i) => checked[`${s.id}-${i}`])

  const totalTasks  = CFOP_STEPS.reduce((sum, s) => sum + s.tasks.length, 0)
  const doneTasks   = Object.values(checked).filter(Boolean).length
  const progressPct = Math.round((doneTasks / totalTasks) * 100)

  return (
    <aside className={`sidebar right ${open ? 'visible' : ''}`}>
      <div className="sidebar-inner">

        {/* ── Progress header ── */}
        <div>
          <div className="section-label">CFOP Progress</div>

          {/* Overall progress bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: 6, fontSize: 11,
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}>
              <span>Overall</span>
              <span style={{
                color: progressPct === 100 ? 'var(--emerald-400)' : 'var(--text-secondary)',
                fontWeight: 500,
              }}>
                {doneTasks} / {totalTasks}
              </span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct === 100
                    ? 'var(--emerald-500)'
                    : 'linear-gradient(90deg, var(--blue-500), var(--teal-500))',
                }}
              />
            </div>
          </div>

          {/* Stage pills row */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
            {CFOP_STEPS.map(step => {
              const done = isStageDone(step)
              return (
                <div
                  key={step.id}
                  className="stage-pill"
                  style={{
                    background: done ? step.bgColor : 'var(--bg-panel)',
                    border: `1px solid ${done ? step.borderColor : 'var(--border-subtle)'}`,
                    color: done ? step.color : 'var(--text-tertiary)',
                  }}
                >
                  {done ? '✓' : step.title}
                </div>
              )
            })}
          </div>

          {/* Reset progress */}
          <button className="btn ghost" style={{ marginBottom: 0 }} onClick={resetChecks}>
            ↺ Reset Progress
          </button>
        </div>

        {/* ── Step cards ── */}
        <div>
          <div className="section-label">Steps</div>
          {CFOP_STEPS.map(step => (
            <StepCard
              key={step.id}
              step={step}
              checked={checked}
              onToggleCheck={toggleCheck}
              stageDone={isStageDone(step)}
              algoOpen={!!openAlgos[step.id]}
              onToggleAlgos={() => toggleAlgos(step.id)}
              onExecAlgo={onExecAlgo}
            />
          ))}
        </div>

        {/* Solved all */}
        {progressPct === 100 && (
          <div style={{
            padding: 18,
            textAlign: 'center',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{
              fontSize: 24, marginBottom: 6,
            }}>🎉</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--emerald-400)',
              letterSpacing: '0.05em',
              marginBottom: 4,
            }}>
              All Steps Complete
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              Now execute the solve!
            </div>
          </div>
        )}

        {/* Notation footer */}
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-md)',
          fontSize: 11,
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
          lineHeight: 2,
        }}>
          R=Right · L=Left · U=Up<br />
          D=Down · F=Front · B=Back<br />
          <span style={{ color: 'var(--blue-400)' }}>'</span> = counter-clockwise &nbsp;
          <span style={{ color: 'var(--blue-400)' }}>2</span> = double move
        </div>

      </div>
    </aside>
  )
}

// ─── STEP CARD ────────────────────────────────────────────────────────────────

function StepCard({ step, checked, onToggleCheck, stageDone, algoOpen, onToggleAlgos, onExecAlgo }) {
  const doneCount = step.tasks.filter((_, i) => checked[`${step.id}-${i}`]).length

  return (
    <div
      className="step-card"
      style={{
        background: stageDone ? step.bgColor : 'var(--bg-panel)',
        border: `1px solid ${stageDone ? step.borderColor : 'var(--border-subtle)'}`,
      }}
    >
      {/* Header */}
      <div
        className="step-header"
        style={{
          background: stageDone ? `${step.bgColor}` : 'var(--bg-elevated)',
          borderBottom: `1px solid ${stageDone ? step.borderColor : 'var(--border-subtle)'}`,
        }}
      >
        {/* Number badge */}
        <div
          className="step-number"
          style={{
            background: stageDone ? step.color : 'var(--bg-inset)',
            border: `1.5px solid ${stageDone ? step.color : 'var(--border-default)'}`,
            color: stageDone ? '#000' : step.color,
            fontWeight: stageDone ? 700 : 600,
          }}
        >
          {stageDone ? '✓' : step.stage}
        </div>

        {/* Title + count */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: stageDone ? step.color : 'var(--text-primary)',
            letterSpacing: '0.01em',
            textDecoration: stageDone ? 'line-through' : 'none',
            opacity: stageDone ? 0.75 : 1,
          }}>
            {step.title}
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
            marginTop: 1,
          }}>
            {doneCount} / {step.tasks.length} tasks
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {step.tasks.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: checked[`${step.id}-${i}`] ? step.color : 'var(--border-default)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Description */}
      <div style={{
        padding: '8px 14px',
        fontSize: 12,
        color: 'var(--text-tertiary)',
        borderBottom: `1px solid var(--border-subtle)`,
        lineHeight: 1.5,
      }}>
        {step.description}
      </div>

      {/* Tasks */}
      {step.tasks.map((task, i) => {
        const key    = `${step.id}-${i}`
        const isDone = !!checked[key]
        return (
          <div
            key={key}
            className="step-task-row"
            onClick={() => onToggleCheck(key)}
            style={{
              opacity: isDone ? 0.55 : 1,
            }}
          >
            {/* Checkbox */}
            <div
              className={`cb-box ${isDone ? 'checked' : ''}`}
              style={{
                borderColor: isDone ? 'var(--blue-500)' : 'var(--border-strong)',
              }}
            >
              {isDone && '✓'}
            </div>

            {/* Text */}
            <span style={{
              fontSize: 12,
              color: isDone ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              textDecoration: isDone ? 'line-through' : 'none',
              lineHeight: 1.4,
              flex: 1,
            }}>
              {task}
            </span>
          </div>
        )
      })}

      {/* Algo toggle */}
      <button
        className="algo-toggle-btn"
        onClick={onToggleAlgos}
        style={{
          marginTop: 8,
          color: algoOpen ? step.color : undefined,
          borderColor: algoOpen ? step.borderColor : undefined,
          background: algoOpen ? step.bgColor : undefined,
        }}
      >
        <span style={{ fontSize: 9 }}>{algoOpen ? '▲' : '▼'}</span>
        {algoOpen ? 'Hide' : 'Show'} algorithms ({step.algos.length})
      </button>

      {/* Algorithms */}
      {algoOpen && (
        <div style={{ padding: '0 14px 12px' }}>
          {step.algos.map(algo => (
            <AlgoRow
              key={algo.name}
              algo={algo}
              color={step.color}
              onRun={onExecAlgo}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ALGO ROW ─────────────────────────────────────────────────────────────────

function AlgoRow({ algo, color, onRun }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(algo.moves).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="algo-row">
      <div className="algo-name-text">{algo.name}</div>
      <div className="algo-moves-text">{algo.moves}</div>
      <div style={{ display: 'flex', gap: 5 }}>
        <button className="algo-exec run" onClick={() => onRun(algo.moves)}>
          ▶ Run
        </button>
        <button className="algo-exec copy" onClick={handleCopy}>
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
    </div>
  )
}