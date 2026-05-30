import { useEffect, useRef, useState } from 'react'

const MEDIAPIPE_HANDS_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
const MEDIAPIPE_CAMERA_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'

const CHEATSHEET = [
  { gesture: 'Fist', action: 'RSVP event' },
  { gesture: 'Open Hand', action: 'Toggle chat' },
  { gesture: 'Two Fingers Up', action: 'Interested' },
  { gesture: 'Two Fingers Down', action: 'Dismiss' },
]

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
]
const TIPS = [4, 8, 12, 16, 20]

/** Dynamically inject a script tag and resolve when it loads */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      const poll = setInterval(() => {
        if (src.includes('camera_utils') && window.Camera) { clearInterval(poll); resolve() }
        else if (src.includes('hands') && window.Hands) { clearInterval(poll); resolve() }
      }, 100)
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.crossOrigin = 'anonymous'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

export default function GestureController({
  events,
  activeCard,
  setActiveCard,
  onRSVP,
  onBookmark,
  onToggleChat,
}) {

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const handsRef = useRef(null)
  const cameraRef = useRef(null)
  const cooldown = useRef(false)
  const lastFired = useRef({ key: null, card: null, at: 0 })
  const clearFrames = useRef(0)
  const gesHist = useRef([])
  const flashTimer = useRef(null)
  const advanceTimer = useRef(null)
  const waitingForClear = useRef(false)

  // Keep latest props in refs so callbacks never go stale
  const eventsRef = useRef(events)
  const activeCardRef = useRef(activeCard)
  const setActiveRef = useRef(setActiveCard)
  const onRSVPRef = useRef(onRSVP)
  const onBookmarkRef = useRef(onBookmark)
  const onChatRef = useRef(onToggleChat)
  useEffect(() => { eventsRef.current = events }, [events])
  useEffect(() => { activeCardRef.current = activeCard }, [activeCard])
  useEffect(() => { setActiveRef.current = setActiveCard }, [setActiveCard])
  useEffect(() => { onRSVPRef.current = onRSVP }, [onRSVP])
  useEffect(() => { onBookmarkRef.current = onBookmark }, [onBookmark])
  useEffect(() => { onChatRef.current = onToggleChat }, [onToggleChat])

  const [active, setActive] = useState(false)
  const [ready, setReady] = useState(false)
  const [handPresent, setHandPresent] = useState(false)
  const [flash, setFlash] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [error, setError] = useState('')
  const [gestureLabel, setGestureLabel] = useState('Show your hand...')

  // ── Classifier — matches gestureDetector.py exactly ─────────────────
  /**
   * fingers_up() equivalent from gestureDetector.py:
   * - Thumb: tip.x < pip.x  (thumb extends left for right hand)
   * - Other 4 fingers: tip.y < pip.y  (finger extends upward = lower y value)
   *
   * Returns array of 5 booleans: [thumb, index, middle, ring, pinky]
   */
  function fingersUp(lm) {
    const fingers = []
    // Works for both left and right hands; x-axis checks only recognize one side.
    const thumbTipDistance = Math.hypot(lm[4].x - lm[0].x, lm[4].y - lm[0].y)
    const thumbJointDistance = Math.hypot(lm[3].x - lm[0].x, lm[3].y - lm[0].y)
    fingers.push(thumbTipDistance > thumbJointDistance + 0.025)
    // Index  — tip=8,  pip=6
    fingers.push(lm[8].y < lm[6].y)
    // Middle — tip=12, pip=10
    fingers.push(lm[12].y < lm[10].y)
    // Ring   — tip=16, pip=14
    fingers.push(lm[16].y < lm[14].y)
    // Pinky  — tip=20, pip=18
    fingers.push(lm[20].y < lm[18].y)
    return fingers
  }

  function classify(lm) {
    const [thumb, index, middle, ring, pinky] = fingersUp(lm)

    // Fist: index, middle, ring, pinky closed. Thumb is optional.
    if (!index && !middle && !ring && !pinky) {
      return 'FIST'
    }

    // Open Hand: all fingers up, with a relaxed four-finger fallback.
    if ((thumb && index && middle && ring && pinky) ||
      [thumb, index, middle, ring, pinky].filter(Boolean).length >= 4) {
      return 'OPEN_HAND'
    }

    // Two Fingers Up: index + middle raised.
    if (!thumb && index && middle && !ring && !pinky) {
      return 'TWO_FINGERS_UP'
    }

    // Two Fingers Down: ring + pinky raised, index + middle down. Thumb optional.
    if (!index && !middle && ring && pinky) {
      return 'TWO_FINGERS_DOWN'
    }

    return null
  }

  // ── Dispatch ──────────────────────────────────────────────────────────
  function dispatch(key) {
    if (waitingForClear.current) {
      if (!key) {
        clearFrames.current += 1
        if (clearFrames.current >= 4) {
          waitingForClear.current = false
          gesHist.current = []
          lastFired.current = { key: null, card: null, at: 0 }
        }
      }
      return
    }

    // Static gesture — require a steady hold so noisy frames do not repeat-fire.
    if (key) {
      clearFrames.current = 0
      gesHist.current.push(key)
      if (gesHist.current.length > 6) gesHist.current.shift()
      const confirmed =
        gesHist.current.length >= 5 &&
        gesHist.current.slice(-5).every(g => g === key)
      if (confirmed) fire(key)
    } else {
      clearFrames.current += 1
      if (clearFrames.current >= 4) {
        gesHist.current = []
        lastFired.current = { key: null, card: null, at: 0 }
      }
    }
  }

  function fire(key) {
    if (cooldown.current) return
    const card = activeCardRef.current
    const now = Date.now()
    if (
      lastFired.current.key === key &&
      lastFired.current.card === card &&
      now - lastFired.current.at < 2500
    ) {
      return
    }
    lastFired.current = { key, card, at: now }
    cooldown.current = true
    waitingForClear.current = true
    gesHist.current = []

    const MAP = {
      FIST: { emoji: '✊', label: 'RSVP!', color: '#22c55e' },
      OPEN_HAND: { emoji: '✋', label: 'Toggle Chat', color: '#8b5cf6' },
      TWO_FINGERS_UP: { emoji: '☝️', label: 'Interested', color: '#f59e0b' },
      TWO_FINGERS_DOWN: { emoji: '👇', label: 'Dismiss', color: '#ef4444' },
    }
    const info = MAP[key]
    if (info) {
      setFlash(info)
      setGestureLabel(`${info.emoji} ${info.label}`)
      clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => {
        setFlash(null)
        setGestureLabel('Show your hand...')
      }, 1800)
    }

    const evs = eventsRef.current ?? []
    switch (key) {
      case 'FIST':
        if (evs[card]) onRSVPRef.current?.(evs[card])
        break
      case 'OPEN_HAND':
        onChatRef.current?.()
        break
      case 'TWO_FINGERS_UP':
        if (evs[card]) onBookmarkRef.current?.(evs[card])
        break
      case 'TWO_FINGERS_DOWN':
        break
    }

    clearTimeout(advanceTimer.current)
    if (evs.length > 1 && evs[card]) {
      advanceTimer.current = setTimeout(() => {
        setActiveRef.current(() => (card + 1) % evs.length)
        lastFired.current = { key: null, card: null, at: 0 }
        setGestureLabel('Show your hand...')
      }, 3000)
    }

    setTimeout(() => { cooldown.current = false }, 3200)
  }

  // ── Draw skeleton ──────────────────────────────────────────────────────
  function drawSkeleton(ctx, lm, w, h) {
    const px = p => ({ x: (1 - p.x) * w, y: p.y * h }) // mirror x
    ctx.strokeStyle = 'rgba(99,102,241,0.7)'
    ctx.lineWidth = 1.5
    CONNECTIONS.forEach(([a, b]) => {
      const pa = px(lm[a]); const pb = px(lm[b])
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke()
    })
    lm.forEach((p, i) => {
      const { x, y } = px(p)
      const tip = TIPS.includes(i)
      ctx.beginPath(); ctx.arc(x, y, tip ? 5 : 3, 0, Math.PI * 2)
      ctx.fillStyle = tip ? '#818cf8' : 'rgba(255,255,255,0.85)'; ctx.fill()
    })
    // Highlight fingertips with color coding
    const [thumb, index, middle, ring, pinky] = fingersUp(lm)
    const tipStates = [thumb, index, middle, ring, pinky]
    TIPS.forEach((tip, i) => {
      const { x, y } = px(lm[tip])
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = tipStates[i] ? '#4ade80' : '#f87171'
      ctx.fill()
    })
  }

  // ── Start / stop camera ───────────────────────────────────────────────
  useEffect(() => {
    if (!active) return
    let cancelled = false

    const start = async () => {
      setReady(false); setError('')
      try {
        await loadScript(MEDIAPIPE_HANDS_URL)
        await loadScript(MEDIAPIPE_CAMERA_URL)
      } catch (error) {
        console.error(error)
        setError('Gesture engine could not load. Check internet connection, then try again.')
        setActive(false); return
      }
      if (cancelled) return

      const hands = new window.Hands({
        locateFile: f =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      })
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.55,
      })

      hands.onResults(results => {
        if (cancelled) return
        if (!ready) setReady(true)
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (!results.multiHandLandmarks?.length) {
          setHandPresent(false)
          setGestureLabel('Show your hand...')
          gesHist.current = []
          lastFired.current = { key: null, card: null, at: 0 }
          waitingForClear.current = false
          return
        }
        setHandPresent(true)
        const lm = results.multiHandLandmarks[0]
        drawSkeleton(ctx, lm, canvas.width, canvas.height)

        const key = classify(lm)

        // Show live gesture name
        if (key) {
          const LABELS = {
            FIST: '✊ Fist',
            OPEN_HAND: '✋ Open Hand',
            TWO_FINGERS_UP: '☝️ Two Fingers Up',
            TWO_FINGERS_DOWN: '👇 Two Fingers Down',
          }
          if (!cooldown.current) setGestureLabel(LABELS[key] || '✋ Detected')
        }

        dispatch(key)
      })

      handsRef.current = hands

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current && !cancelled)
            await handsRef.current.send({ image: videoRef.current })
        },
        width: 200, height: 150,
      })
      camera.start()
      cameraRef.current = camera
    }

    start()

    return () => {
      cancelled = true
      cameraRef.current?.stop()
      handsRef.current?.close()
      handsRef.current = null; cameraRef.current = null
      gesHist.current = []
      waitingForClear.current = false
      clearTimeout(advanceTimer.current)
      setReady(false); setHandPresent(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const dotColor = !ready ? '#fbbf24' : handPresent ? '#4ade80' : '#f87171'
  const curEvent = events?.[activeCard]

  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes gc-spin { to { transform:rotate(360deg); } }
        @keyframes gc-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes gc-pop { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
        @keyframes gc-slide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{
        position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
        fontFamily: 'system-ui,sans-serif',
      }}>

        {/* ── Error banner */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: 10, padding: '8px 12px',
            color: '#dc2626', fontSize: 11, maxWidth: 200,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Toggle button */}
        <button
          onClick={() => { setActive(a => !a); setError('') }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 999,
            background: active ? '#6366f1' : '#fff',
            color: active ? '#fff' : '#374151',
            border: `2px solid ${active ? '#6366f1' : '#e5e7eb'}`,
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            boxShadow: active
              ? '0 4px 16px rgba(99,102,241,.4)'
              : '0 2px 8px rgba(0,0,0,.08)',
            transition: 'all .2s', userSelect: 'none',
          }}>
          <span style={{ fontSize: 16 }}>{active ? '✋' : '🖐'}</span>
          {active ? 'Gesture ON' : 'Enable Gestures'}
          {active && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: dotColor,
              animation: !ready ? 'gc-pulse 1s infinite' : undefined,
            }} />
          )}
        </button>

        {/* ── Camera + skeleton */}
        {active && (
          <div style={{
            position: 'relative', width: 200, height: 150,
            borderRadius: 14, overflow: 'hidden',
            background: '#0f172a',
            border: `2px solid ${handPresent ? '#6366f1' : '#1e293b'}`,
            boxShadow: handPresent
              ? '0 0 22px rgba(99,102,241,.45)'
              : '0 4px 20px rgba(0,0,0,.35)',
            animation: 'gc-slide .25s ease',
          }}>
            <video ref={videoRef} autoPlay muted playsInline
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: 'scaleX(-1)', display: 'block'
              }} />
            <canvas ref={canvasRef} width={200} height={150}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%', pointerEvents: 'none'
              }} />

            {/* Loading */}
            {!ready && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(15,23,42,.88)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <div style={{
                  width: 30, height: 30,
                  border: '3px solid rgba(99,102,241,.25)',
                  borderTopColor: '#6366f1', borderRadius: '50%',
                  animation: 'gc-spin .75s linear infinite',
                }} />
                <span style={{ color: '#94a3b8', fontSize: 11 }}>
                  Loading MediaPipe…
                </span>
              </div>
            )}

            {/* No hand */}
            {ready && !handPresent && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6,
                pointerEvents: 'none',
              }}>
                <span style={{ fontSize: 28, opacity: .35 }}>🖐</span>
                <span style={{
                  color: 'rgba(148,163,184,.65)', fontSize: 10,
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em',
                }}>Show your hand</span>
              </div>
            )}

            {/* LIVE badge */}
            <div style={{
              position: 'absolute', top: 6, left: 8,
              fontSize: 9, fontWeight: 700,
              color: 'rgba(148,163,184,.8)',
              textTransform: 'uppercase', letterSpacing: '.1em',
            }}>LIVE</div>

            {/* Gesture label */}
            {ready && handPresent && !flash && (
              <div style={{
                position: 'absolute', bottom: 6, left: 0, right: 0,
                textAlign: 'center',
                color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 600,
              }}>{gestureLabel}</div>
            )}

            {/* Gesture flash */}
            {flash && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: `${flash.color}28`,
                animation: 'gc-pop .2s ease',
              }}>
                <span style={{ fontSize: 36 }}>{flash.emoji}</span>
                <span style={{
                  color: '#fff', fontSize: 11, fontWeight: 700,
                  background: 'rgba(0,0,0,.65)',
                  padding: '3px 10px', borderRadius: 99, marginTop: 4,
                }}>{flash.label}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Active card info */}
        {active && ready && curEvent && (
          <div style={{
            width: 200, background: '#fff',
            borderRadius: 12, padding: '9px 12px',
            border: '1.5px solid #e0e7ff',
            boxShadow: '0 2px 10px rgba(99,102,241,.1)',
            animation: 'gc-slide .2s ease',
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: '#6366f1',
              textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3,
            }}>
              Card {activeCard + 1} / {events?.length}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 600, color: '#1e1b4b',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{curEvent.title}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
              {curEvent.venue}
            </div>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 3, marginTop: 7, flexWrap: 'wrap' }}>
              {events?.slice(0, 10).map((_, i) => (
                <div key={i} style={{
                  height: 5, borderRadius: 999,
                  width: i === (activeCard % 10) ? 18 : 5,
                  background: i === (activeCard % 10) ? '#6366f1' : '#e0e7ff',
                  transition: 'all .3s',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Help toggle */}
        {active && (
          <button
            onClick={() => setShowHelp(h => !h)}
            style={{
              background: '#fff', border: '1.5px solid #e5e7eb',
              borderRadius: 999, padding: '5px 14px',
              fontSize: 11, color: '#6b7280',
              cursor: 'pointer', userSelect: 'none',
            }}>
            {showHelp ? '✕ Hide guide' : '? Gesture guide'}
          </button>
        )}

        {/* ── Cheat sheet */}
        {active && showHelp && (
          <div style={{
            width: 200, background: '#fff',
            borderRadius: 14, padding: '12px 14px',
            border: '1.5px solid #e0e7ff',
            boxShadow: '0 4px 20px rgba(99,102,241,.14)',
            animation: 'gc-slide .2s ease',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#4338ca',
              textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10,
            }}>Gesture Guide</div>
            {CHEATSHEET.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '5px 0',
                borderBottom: i < CHEATSHEET.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}>
                <span style={{ fontSize: 12 }}>{item.gesture}</span>
                <span style={{ fontSize: 10, color: '#6b7280', textAlign: 'right', maxWidth: 82 }}>
                  {item.action}
                </span>
              </div>
            ))}
            <div style={{
              marginTop: 10, padding: '8px 10px',
              background: '#f0fdf4', borderRadius: 8,
              fontSize: 10, color: '#166534', lineHeight: 1.6,
            }}>
              💡 <strong>Tips</strong><br />
              • Hand 30–50 cm from camera<br />
              • Green dot = finger UP<br />
              • Red dot = finger DOWN<br />
              • Hold gestures ~0.5s firmly
            </div>
          </div>
        )}

      </div>
    </>
  )
}