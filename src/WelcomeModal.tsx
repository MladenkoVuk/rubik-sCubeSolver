// WelcomeModal.jsx — Kontrole i info modal za Cube Trainer

import { useState, useEffect } from 'react'

type WelcomeModalProps = {
  onClose: () => void
}

const CONTROLS = [
  { key: 'R', label: 'Right face', color: '#e74c3c' },
  { key: 'L', label: 'Left face',  color: '#e67e22' },
  { key: 'U', label: 'Up face',    color: '#f1c40f' },
  { key: 'D', label: 'Down face',  color: '#ecf0f1' },
  { key: 'F', label: 'Front face', color: '#2ecc71' },
  { key: 'B', label: 'Back face',  color: '#3498db' },
]

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="welcome-modal-inner"
        style={{
          background: '#111',
          border: '1px solid #2a2a2a',
          borderRadius: 16,
          padding: '2rem',
          maxWidth: 480,
          width: '100%',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(16px)',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dekorativni gradient */}
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,213,0,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: '#ffd500',
              boxShadow: '0 0 10px #ffd500',
            }} />
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.15em',
              color: '#555',
              textTransform: 'uppercase',
            }}>
              Cube Trainer
            </span>
          </div>
          <h2 style={{
            margin: 0,
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.2,
          }}>
            How to use
          </h2>
        </div>

        {/* Keyboard controls */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#444',
            marginBottom: 10,
            fontFamily: 'Space Grotesk, sans-serif',
          }}>
            Keyboard Controls
          </div>

          {/* Grid — klasa omogućava CSS override na mobilnom */}
          <div
            className="welcome-controls-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {CONTROLS.map(({ key, label, color }) => (
              <div key={key} style={{
                background: '#1a1a1a',
                border: '1px solid #242424',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: '#0d0d0d',
                  border: `1.5px solid ${color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: 13,
                    fontWeight: 700,
                    color: color,
                  }}>
                    {key}
                  </span>
                </div>
                <span style={{
                  fontSize: 12,
                  color: '#888',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Shift modifier */}
          <div style={{
            marginTop: 10,
            background: '#1a1a1a',
            border: '1px solid #242424',
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              padding: '3px 8px',
              borderRadius: 5,
              background: '#0d0d0d',
              border: '1.5px solid #333',
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 700,
              color: '#aaa',
              flexShrink: 0,
            }}>
              SHIFT
            </div>
            <span style={{
              fontSize: 12,
              color: '#888',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>
              Hold + key for counter-clockwise rotation
            </span>
          </div>
        </div>

        {/* Tips */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#444',
            marginBottom: 10,
            fontFamily: 'Space Grotesk, sans-serif',
          }}>
            Tips
          </div>

          {[
            { icon: '◎', text: 'Use Scramble to randomize the cube, then try to solve it.' },
            { icon: '⏱', text: 'Toggle the timer to track your solve time.' },
            { icon: '📖', text: 'Open the right panel for algorithms and guides.' },
            { icon: '↺', text: 'Drag to orbit the cube and see all sides.' },
          ].map(({ icon, text }) => (
            <div key={icon} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 14, flexShrink: 0, opacity: 0.6 }}>{icon}</span>
              <span style={{
                fontSize: 12,
                color: '#666',
                fontFamily: 'Space Grotesk, sans-serif',
                lineHeight: 1.5,
              }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            border: 'none',
            background: '#ffd500',
            color: '#000',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.04em',
            transition: 'opacity 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '0.9'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Start Solving
        </button>

        <div style={{
          textAlign: 'center',
          marginTop: 10,
          fontSize: 11,
          color: '#333',
          fontFamily: 'Space Grotesk, sans-serif',
        }}>
          Click outside or press this button to dismiss
        </div>
      </div>
    </div>
  )
}