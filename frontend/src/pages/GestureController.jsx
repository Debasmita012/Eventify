import { useEffect, useRef, useState, useCallback } from 'react'

// ── Gesture thresholds ────────────────────────────────────────────────
const COOLDOWN_MS = 1500
const HISTORY_LEN = 10
const CONFIRM_RATIO = 0.6

// ── Finger landmark indices (MediaPipe) ───────────────────────────────
const FINGER_TIPS = [4, 8, 12, 16, 20]
const FINGER_PIPS = [2, 6, 10, 14, 18] // thumb uses MCP (2), others use PIP

function getExtended(lm) {
    // Returns [thumb, index, middle, ring, pinky] booleans
    const thumb = lm[4].x < lm[3].x  // thumb tip left of IP (mirrored cam)
    const index = lm[8].y < lm[6].y
    const middle = lm[12].y < lm[10].y
    const ring = lm[16].y < lm[14].y
    const pinky = lm[20].y < lm[18].y
    return { thumb, index, middle, ring, pinky }
}
function classifyGesture(landmarks) {

    if (!landmarks || landmarks.length < 21) return null

    const lm = landmarks

    const thumbUp =
        lm[4].y < lm[3].y &&
        lm[4].y < lm[2].y

    const indexUp =
        lm[8].y < lm[6].y

    const middleUp =
        lm[12].y < lm[10].y

    const ringUp =
        lm[16].y < lm[14].y

    const pinkyUp =
        lm[20].y < lm[18].y

    // 👍 RSVP
    if (
        thumbUp &&
        !indexUp &&
        !middleUp &&
        !ringUp &&
        !pinkyUp
    ) {
        return 'RSVP'
    }

    // ✋ OPEN PALM
    if (
        thumbUp &&
        indexUp &&
        middleUp &&
        ringUp &&
        pinkyUp
    ) {
        return 'CHAT'
    }

    // ☝️ DETAILS
    if (
        indexUp &&
        !middleUp &&
        !ringUp &&
        !pinkyUp
    ) {
        return 'OPEN'
    }

    // 👉 NEXT
    if (
        indexUp &&
        middleUp &&
        !ringUp &&
        !pinkyUp
    ) {
        return 'NEXT'
    }

    // 👎 UNDO
    if (
        lm[4].y > lm[0].y &&
        !indexUp &&
        !middleUp &&
        !ringUp &&
        !pinkyUp
    ) {
        return 'UNDO'
    }

    return null
}

function smoothGesture(history) {
    if (history.length < HISTORY_LEN) return null
    const counts = {}
    history.forEach(g => { if (g) counts[g] = (counts[g] || 0) + 1 })
    const [best, cnt] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || []
    return cnt >= HISTORY_LEN * CONFIRM_RATIO ? best : null
}

// ── Emoji map ────────────────────────────────────────────────────────
const GESTURE_UI = {
    RSVP: { emoji: '👍', label: 'RSVP!', color: '#22c55e' },
    NEXT: { emoji: '👉', label: 'Next →', color: '#6366f1' },
    OPEN: { emoji: '☝️', label: 'View Detail', color: '#f59e0b' },
    UNDO: { emoji: '👎', label: 'Skip', color: '#ef4444' },
    CHAT: { emoji: '✋', label: 'Open Chat', color: '#8b5cf6' },
}

export default function GestureController({
    events = [],
    activeCard = 0,
    setActiveCard,
    onRSVP,
    onOpenDetail,
    onToggleChat,
}) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const handsRef = useRef(null)
    const lastActRef = useRef(0)
    const historyRef = useRef([])
    const streamRef = useRef(null)

    const [enabled, setEnabled] = useState(false)
    const [detected, setDetected] = useState(null)   // current raw gesture
    const [confirmed, setConfirmed] = useState(null)   // smoothed + acted
    const [feedback, setFeedback] = useState(null)   // toast text
    const [camError, setCamError] = useState(null)
    const [loading, setLoading] = useState(false)

    // ── Flash feedback toast ──────────────────────────────────────────
    const flash = useCallback((text, color = '#6366f1') => {
        setFeedback({ text, color })
        setTimeout(() => setFeedback(null), 1800)
    }, [])

    // ── Handle confirmed gesture ──────────────────────────────────────
    const handleAction = useCallback((gesture) => {
        const now = Date.now()
        if (now - lastActRef.current < COOLDOWN_MS) return
        lastActRef.current = now

        setConfirmed(gesture)
        setTimeout(() => setConfirmed(null), 1200)

        const ui = GESTURE_UI[gesture]
        if (ui) flash(`${ui.emoji} ${ui.label}`, ui.color)

        switch (gesture) {
            case 'RSVP':
                onRSVP && onRSVP()
                break
            case 'NEXT':
                setActiveCard(i => {
                    const next = (i + 1) % Math.max(events.length, 1)
                    return next
                })
                break
            case 'OPEN':
                if (events[activeCard]) onOpenDetail && onOpenDetail(events[activeCard])
                break
            case 'UNDO':
                setActiveCard(i => Math.max(0, i - 1))
                break
            case 'CHAT':
                onToggleChat && onToggleChat()
                break
        }
    }, [events, activeCard, onRSVP, onOpenDetail, onToggleChat, setActiveCard, flash])

    // ── MediaPipe results callback ────────────────────────────────────
    const onResults = useCallback((results) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (!results.multiHandLandmarks?.length) {
            historyRef.current = []
            setDetected(null)
            return
        }

        const landmarks = results.multiHandLandmarks[0]

        // Draw hand skeleton
        if (window.drawConnectors && window.drawLandmarks) {
            window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS,
                { color: '#6366f1', lineWidth: 2 })
            window.drawLandmarks(ctx, landmarks,
                { color: '#a5b4fc', lineWidth: 1, radius: 3 })
        }

        const raw = classifyGesture(landmarks)
        setDetected(raw)

        // Push to history ring buffer
        historyRef.current = [...historyRef.current.slice(-(HISTORY_LEN - 1)), raw]
        const smooth = smoothGesture(historyRef.current)
        if (smooth) handleAction(smooth)
    }, [handleAction])

    // ── Start camera + MediaPipe ──────────────────────────────────────
    const startCamera = useCallback(async () => {
        setLoading(true)
        setCamError(null)
        try {
            // Dynamically load MediaPipe if not present
            if (!window.Hands) {
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js')
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')
                await new Promise(r => setTimeout(r, 600)) // let scripts init
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' }
            })
            streamRef.current = stream

            const video = videoRef.current
            video.srcObject = stream
            await video.play()

            // Init MediaPipe Hands
            const hands = new window.Hands({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            })
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.6,
            })
            hands.onResults(onResults)
            handsRef.current = hands

            // Frame loop
            const processFrame = async () => {
                if (!handsRef.current || !videoRef.current) return
                try {
                    await handsRef.current.send({ image: videoRef.current })
                } catch (_) { }
                if (streamRef.current) requestAnimationFrame(processFrame)
            }
            requestAnimationFrame(processFrame)

            setLoading(false)
            setEnabled(true)
        } catch (err) {
            console.error('Camera error:', err)
            setCamError(err.name === 'NotAllowedError'
                ? 'Camera permission denied. Please allow camera access.'
                : `Camera error: ${err.message}`)
            setLoading(false)
        }
    }, [onResults])

    // ── Stop camera ───────────────────────────────────────────────────
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        if (handsRef.current) {
            handsRef.current.close()
            handsRef.current = null
        }
        if (videoRef.current) videoRef.current.srcObject = null
        historyRef.current = []
        setEnabled(false)
        setDetected(null)
        setConfirmed(null)
    }, [])

    // Cleanup on unmount
    useEffect(() => () => stopCamera(), [stopCamera])

    const toggle = () => enabled ? stopCamera() : startCamera()

    const currentUI = confirmed
        ? GESTURE_UI[confirmed]
        : detected
            ? GESTURE_UI[detected]
            : null

    // ═══════════════════════════════════════════════════════════════════
    return (
        <div className="fixed bottom-4 left-4 z-50 select-none">

            {/* Toggle button */}
            <button
                onClick={toggle}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-full
          font-semibold text-sm shadow-lg transition-all
          ${enabled
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-400'
                    }
          ${loading ? 'opacity-60 cursor-wait' : ''}`}>
                {loading ? '⏳' : enabled ? '🖐️' : '🖐️'}
                <span>{loading ? 'Loading...' : enabled ? 'Gesture ON' : 'Gesture Mode'}</span>
                {enabled && (
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
            </button>

            {/* Camera + overlay */}
            {enabled && (
                <div className="mt-2 relative rounded-xl overflow-hidden shadow-xl
          border-2 border-indigo-400 w-[240px]">

                    <video
                        ref={videoRef}
                        className="w-full block"
                        style={{ transform: 'scaleX(-1)', maxHeight: '180px', objectFit: 'cover' }}
                        muted
                        playsInline
                    />
                    <canvas
                        ref={canvasRef}
                        width={240}
                        height={180}
                        className="absolute inset-0 w-full h-full"
                        style={{ transform: 'scaleX(-1)' }}
                    />

                    {/* Gesture overlay */}
                    {currentUI && (
                        <div className="absolute inset-0 flex items-center justify-center
              pointer-events-none">
                            <div className="bg-black/60 rounded-xl px-4 py-2 text-center">
                                <div className="text-3xl">{currentUI.emoji}</div>
                                <div className="text-white text-xs font-bold mt-1"
                                    style={{ color: currentUI.color }}>
                                    {currentUI.label}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Card indicator */}
                    <div className="absolute top-1 left-2 text-white text-[10px]
            font-bold bg-black/50 px-1.5 py-0.5 rounded">
                        CARD {activeCard + 1} / {Math.max(events.length, 1)}
                    </div>
                </div>
            )}

            {/* Gesture legend */}
            {enabled && (
                <div className="mt-1.5 bg-white/95 backdrop-blur rounded-xl p-2
          shadow text-[10px] text-gray-600 w-[240px] space-y-0.5">
                    {Object.entries(GESTURE_UI).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5">
                            <span>{v.emoji}</span>
                            <span className="font-semibold" style={{ color: v.color }}>{k}</span>
                            <span className="text-gray-400">→ {v.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {camError && (
                <div className="mt-2 bg-red-50 border border-red-200 text-red-600
          text-xs rounded-xl p-2 w-[240px]">
                    {camError}
                </div>
            )}

            {/* Feedback toast */}
            {feedback && (
                <div
                    className="fixed bottom-24 left-1/2 -translate-x-1/2
            px-6 py-3 rounded-2xl text-white font-bold text-lg
            shadow-2xl pointer-events-none transition-all"
                    style={{ background: feedback.color, zIndex: 9999 }}>
                    {feedback.text}
                </div>
            )}
        </div>
    )
}

// ── Dynamic script loader ─────────────────────────────────────────────
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve()
        const s = document.createElement('script')
        s.src = src
        s.crossOrigin = 'anonymous'
        s.onload = resolve
        s.onerror = reject
        document.head.appendChild(s)
    })
}