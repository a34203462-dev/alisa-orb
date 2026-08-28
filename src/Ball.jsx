import { useCallback, useEffect, useRef, useState } from 'react'
import { asset } from './asset.js'
import './App.css'

const FRAME = 280
const LISTEN_BOX = { l: (FRAME - 234.71) / 2 + 0.35, t: (FRAME - 249) / 2 + 0.5 }
const THINK_BOX = { l: (FRAME - 192) / 2, t: (FRAME - 178.971) / 2 + 0.49 }

function pct(offset, value) {
  return ((offset + value) / FRAME) * 100
}

const DOTS = [
  { lx: 105.68, ly: 0, ls: 22, tx: 35, ty: 60, ts: 44, d: 0 },
  { lx: 105.68, ly: 227, ls: 22, tx: 14, ty: 34, ts: 44, d: 0.12 },
  { lx: 199.94, ly: 52.72, ls: 22, tx: 116, ty: 42, ts: 44, d: 0.24 },
  { lx: 7.55, ly: 171.22, ls: 16, tx: 92, ty: 131, ts: 22, d: 0.08 },
  { lx: 208.14, ly: 169.22, ls: 16, tx: 104, ty: 140, ts: 22, d: 0.3 },
  { lx: 3.35, ly: 52.72, ls: 22, tx: 48, ty: 145, ts: 22, d: 0.18 },
  { lx: 28, ly: 196.75, ls: 12, tx: 111, ty: 35, ts: 22, d: 0.36 },
  { lx: 188.63, ly: 36.35, ls: 12, tx: 45, ty: 0, ts: 12, d: 0.05 },
  { lx: 83.85, ly: 232.2, ls: 8, tx: 31, ty: 125, ts: 12, d: 0.42 },
  { lx: 142.76, ly: 12.97, ls: 8, tx: 65, ty: 162, ts: 12, d: 0.15 },
  { lx: 0.7, ly: 123.4, ls: 8, tx: 123, ty: 139, ts: 12, d: 0.28 },
  { lx: 230.71, ly: 126.56, ls: 4, tx: 103, ty: 98, ts: 12, d: 0.5 },
  { lx: 0, ly: 91.4, ls: 12, tx: 103, ty: 108, ts: 12, d: 0.22 },
  { lx: 222.92, ly: 152.04, ls: 8, tx: 103, ty: 57, ts: 12, d: 0.33 },
  { lx: 3.66, ly: 151.89, ls: 8, tx: 72, ty: 61, ts: 12, d: 0.4 },
  { lx: 222.97, ly: 93.29, ls: 8, tx: 166, ty: 117, ts: 12, d: 0.1 },
  { lx: 165.28, ly: 215.18, ls: 12, tx: 31, ty: 133.04, ts: 8, d: 0.45 },
  { lx: 59.85, ly: 24.44, ls: 4, tx: 119, ty: 117, ts: 8, d: 0.55 },
  { lx: 143.65, ly: 231.21, ls: 8, tx: 119, ty: 27, ts: 8, d: 0.2 },
  { lx: 80.16, ly: 8.04, ls: 12, tx: 0, ty: 74.29, ts: 8, d: 0.38 },
]

const SHAKE_THRESHOLD = 380
const BGS = ['rest', 'active', 'listen', 'think', 'weather', 'answer', 'places', 'timerDone', 'alarm']
const BG_IMGS = ['rest', 'active', 'listen', 'think', 'weather', 'answer', 'places', 'timerDone', 'alarm']
const PLACES = [
  {
    title: 'Пушкинский музей',
    addr: 'улица Волхонка, дом 12',
    main: asset('figma/place-museum.png'),
    side: asset('figma/place-statue.png'),
  },
  {
    title: 'Третьяковка',
    addr: 'Лаврушинский пер., 10',
    main: asset('figma/place-tretyakov.jpg'),
    side: asset('figma/place-tretyakov-side.jpg'),
  },
  {
    title: 'Большой\nтеатр',
    addr: 'Театральная площадь, 1',
    main: asset('figma/place-bolshoi.jpg'),
    side: asset('figma/place-bolshoi-side.jpg'),
  },
  {
    title: 'ВДНХ',
    addr: 'проспект Мира, 119',
    main: asset('figma/place-vdnh.jpg'),
    side: asset('figma/place-vdnh-side.jpg'),
  },
  {
    title: 'Храм Василия Блаженного',
    addr: 'Красная площадь, 2',
    main: asset('figma/place-basil.jpg'),
    side: asset('figma/place-basil-side.jpg'),
  },
]
const LOOP = [0, 1, 2].flatMap((copy) =>
  PLACES.map((place, i) => ({ ...place, key: `${copy}-${i}`, copy, idx: i })),
)

function bgFor(phase) {
  if (phase === 'listen' || phase === 'listen2') return 'listen'
  if (phase === 'think' || phase === 'think2') return 'think'
  if (phase === 'goAsk' || phase === 'riceAsk' || phase === 'riceTimer' || phase === 'alarmWait' || phase === 'alarmMoved' || phase === 'clock')
    return 'answer'
  if (phase === 'goPlaces') return 'places'
  if (phase === 'riceDone') return 'timerDone'
  if (phase === 'alarmSleep') return 'rest'
  if (phase === 'alarmActive') return 'active'
  if (phase === 'alarmWake' || phase === 'alarmRing') return 'alarm'
  return phase
}

export function RevealText({ text, className, replay }) {
  return (
    <span className={`reveal ${className || ''}`} key={replay}>
      {[...text].map((ch, i) => (
        <span key={`${i}-${ch}`} style={{ animationDelay: `${i * 38}ms` }}>
          {ch === ' ' ? '\u00a0' : ch}
        </span>
      ))}
    </span>
  )
}

function Places({ apiRef }) {
  const trackRef = useRef(null)
  const xRef = useRef(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const viewport = track.parentElement
    if (!viewport) return
    const n = PLACES.length

    const layout = () => {
      const cards = [...track.querySelectorAll('.place-card')]
      const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0
      return { cards, mid: viewport.clientWidth / 2, step, period: step * n }
    }

    const paint = (x) => {
      const { cards, mid } = layout()
      xRef.current = x
      track.style.transform = `translate3d(${x}px, 0, 0)`
      cards.forEach((card) => {
        const visual = card.offsetLeft + card.offsetWidth / 2 + x
        const drop = Math.max(0, 1 - Math.abs(visual - mid) / card.offsetWidth)
        card.style.setProperty('--drop', String(drop))
        card.classList.toggle('is-on', drop > 0.55)
        const title = card.querySelector('.place-title')
        const copy = card.querySelector('.place-copy')
        if (title && copy) {
          const line =
            parseFloat(getComputedStyle(title).lineHeight) ||
            parseFloat(getComputedStyle(title).fontSize) * (22 / 24)
          copy.classList.toggle('is-one-line', title.scrollHeight <= line * 1.35)
        }
      })
    }

    const nearestIndex = (x) => {
      const { cards, mid } = layout()
      let best = 0
      let dist = Infinity
      cards.forEach((card, i) => {
        const d = Math.abs(mid - (card.offsetLeft + card.offsetWidth / 2) - x)
        if (d < dist) {
          dist = d
          best = i
        }
      })
      return best
    }

    const wrappedX = (x) => {
      const { period } = layout()
      if (!period) return x
      const i = nearestIndex(x)
      if (i < n) return x - period
      if (i >= n * 2) return x + period
      return x
    }

    const apply = (x, snap) => {
      const { cards, mid } = layout()
      if (!cards.length) return
      if (snap) {
        const i = nearestIndex(x)
        const equiv = (i % n) + n
        const card = cards[equiv]
        track.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
        paint(mid - (card.offsetLeft + card.offsetWidth / 2))
        return
      }
      track.style.transition = 'none'
      paint(wrappedX(x))
    }

    const boot = () => {
      const { cards, mid } = layout()
      const card = cards[n]
      if (!card || !card.offsetWidth) return false
      track.style.transition = 'none'
      paint(mid - (card.offsetLeft + card.offsetWidth / 2))
      return true
    }

    if (!boot()) requestAnimationFrame(boot)
    apiRef.current = {
      step(dir) {
        const { step: cardStep } = layout()
        if (!cardStep) return
        apply(xRef.current - dir * cardStep, true)
      },
    }

    return () => {
      apiRef.current = null
    }
  }, [apiRef])

  return (
    <div className="places rise">
      <div className="places-track" ref={trackRef}>
        {LOOP.map((place) => (
          <article key={place.key} className="place-card">
            <div className="place-photos">
              <div className="place-photo place-photo-side">
                <img src={place.side} alt="" />
              </div>
              <div className="place-photo place-photo-main">
                <img src={place.main} alt="" />
              </div>
            </div>
            <div className="place-copy">
              <img className="place-pin" src={asset('figma/pin.svg')} alt="" width={18} height={18} />
              <p className="place-title">{place.title}</p>
              <p className="place-addr">{place.addr}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function formatNow() {
  const date = new Date()
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function NowClock() {
  const [now, setNow] = useState(formatNow)

  useEffect(() => {
    const id = window.setInterval(() => setNow(formatNow()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="now-time">
      <div className="now-icon">
        <img src={asset('figma/clock.svg')} alt="" />
      </div>
      <p className="rice-clock">
        <RevealText text={now} replay={now} />
      </p>
    </div>
  )
}

function formatClock(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function RiceTimer({ onDone, skipRef }) {
  const [left, setLeft] = useState(10 * 60)
  const doneRef = useRef(false)
  const skipTimerRef = useRef(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((seconds) => (seconds <= 1 ? 0 : seconds - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!skipRef) return
    skipRef.current = () => {
      window.clearTimeout(skipTimerRef.current)
      setLeft(10 * 60)
      skipTimerRef.current = window.setTimeout(() => {
        if (doneRef.current) return
        doneRef.current = true
        onDone?.()
      }, 320)
    }
    return () => {
      skipRef.current = null
      window.clearTimeout(skipTimerRef.current)
    }
  }, [onDone, skipRef])

  useEffect(() => {
    if (left > 0 || doneRef.current) return
    doneRef.current = true
    onDone?.()
  }, [left, onDone])

  return (
    <div className="rice-timer rise">
      <p className="rice-clock">{formatClock(left)}</p>
      <p className="rice-label">10 минут</p>
    </div>
  )
}

export default function Screen({
  phase,
  onShakeReset,
  onPickup,
  stageRef,
  placesNavRef,
  onRiceDone,
  riceSkipRef,
  alarmClock = '8:00',
}) {
  const energyRef = useRef(0)
  const pathRef = useRef(0)
  const netXRef = useRef(0)
  const netYRef = useRef(0)
  const flipRef = useRef(0)
  const lastDxSignRef = useRef(0)
  const lastDySignRef = useRef(0)
  const lastPointRef = useRef(null)
  const grabbingRef = useRef(false)
  const placesApiRef = useRef(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useEffect(() => {
    if (!placesNavRef) return
    placesNavRef.current = {
      step(dir) {
        placesApiRef.current?.step(dir)
      },
    }
    return () => {
      placesNavRef.current = null
    }
  }, [placesNavRef])

  const resetTilt = useCallback((el) => {
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
    el.style.setProperty('--shake-x', '0px')
    el.style.setProperty('--shake-y', '0px')
  }, [])

  useEffect(() => {
    const el = stageRef?.current
    if (!el) return

    const onDown = (event) => {
      try {
        el.setPointerCapture(event.pointerId)
      } catch {
        /* ignore */
      }
      grabbingRef.current = true
      el.classList.add('is-grabbing')
      energyRef.current = 0
      pathRef.current = 0
      netXRef.current = 0
      netYRef.current = 0
      flipRef.current = 0
      lastDxSignRef.current = 0
      lastDySignRef.current = 0
      lastPointRef.current = { x: event.clientX, y: event.clientY }
      if (phaseRef.current === 'rest') onPickup?.()
    }

    const onMove = (event) => {
      if (!grabbingRef.current) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const nx = (event.clientX - cx) / (rect.width / 2)
      const ny = (event.clientY - cy) / (rect.height / 2)
      el.style.setProperty('--tilt-y', `${Math.max(-16, Math.min(16, nx * 14))}deg`)
      el.style.setProperty('--tilt-x', `${Math.max(-16, Math.min(16, -ny * 14))}deg`)
      el.style.setProperty('--shake-x', `${Math.max(-18, Math.min(18, nx * 10))}px`)
      el.style.setProperty('--shake-y', `${Math.max(-18, Math.min(18, ny * 10))}px`)
      const last = lastPointRef.current
      if (last) {
        const dx = event.clientX - last.x
        const dy = event.clientY - last.y
        const dist = Math.hypot(dx, dy)
        pathRef.current += dist
        netXRef.current += dx
        netYRef.current += dy
        energyRef.current += dist
        if (Math.abs(dx) > 6) {
          const sign = Math.sign(dx)
          if (lastDxSignRef.current && sign !== lastDxSignRef.current) flipRef.current += 1
          lastDxSignRef.current = sign
        }
        if (Math.abs(dy) > 6) {
          const sign = Math.sign(dy)
          if (lastDySignRef.current && sign !== lastDySignRef.current) flipRef.current += 1
          lastDySignRef.current = sign
        }
      }
      lastPointRef.current = { x: event.clientX, y: event.clientY }
      const net = Math.hypot(netXRef.current, netYRef.current)
      const wiggling = pathRef.current > 100 && (pathRef.current > net * 1.45 || flipRef.current >= 2)
      const shaking = energyRef.current > SHAKE_THRESHOLD || wiggling
      el.classList.toggle('is-shaking', wiggling || energyRef.current > 80)
      if (shaking && phaseRef.current !== 'clock') {
        onShakeReset()
        energyRef.current = 0
        pathRef.current = 0
        grabbingRef.current = false
        el.classList.remove('is-grabbing', 'is-shaking')
        resetTilt(el)
      }
    }

    const onUp = () => {
      if (!grabbingRef.current) return
      grabbingRef.current = false
      el.classList.remove('is-grabbing', 'is-shaking')
      resetTilt(el)
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [onPickup, onShakeReset, resetTilt, stageRef])

  const showEyes =
    phase === 'rest' ||
    phase === 'active' ||
    phase === 'alarmSleep' ||
    phase === 'alarmActive' ||
    phase === 'alarmWake' ||
    phase === 'alarmRing'
  const showDots =
    phase === 'listen' ||
    phase === 'listen2' ||
    phase === 'think' ||
    phase === 'think2' ||
    phase === 'riceTimer'
  const clustered = phase === 'think' || phase === 'think2'
  const currentBg = bgFor(phase)

  return (
    <div className="orb" data-phase={phase}>
      {BGS.map((name) => (
        <div
          key={`wash-${name}`}
          className={`wash wash-${name} ${currentBg === name ? 'is-on' : ''}`}
        />
      ))}
      {BG_IMGS.map((name) => (
        <img
          key={name}
          className={`orb-bg ${currentBg === name ? 'is-on' : ''}`}
          src={
            name === 'places'
              ? asset('figma/bg-places.svg')
              : name === 'timerDone'
                ? asset('figma/bg-timerDone.svg?v=2')
                : name === 'alarm'
                  ? asset('figma/bg-alarm.svg')
                  : asset(`figma/bg-${name}.png`)
          }
          alt=""
        />
      ))}

      {showEyes ? (
        <div
          className={`eyes ${phase === 'active' || phase === 'alarmActive' || phase === 'alarmWake' || phase === 'alarmRing' ? 'is-open' : 'is-closed'}`}
        >
          <img className="eyes-closed" src={asset('figma/eyes-closed.svg')} alt="" />
          <div className="eyes-open">
            <img src={asset('figma/eye-l.svg')} alt="" />
            <img src={asset('figma/eye-r.svg')} alt="" />
          </div>
        </div>
      ) : null}

      {showDots ? (
        <div className={`dots ${clustered ? 'dots-think' : 'dots-listen'}`}>
          {DOTS.map((dot, i) => {
            const x = clustered ? pct(THINK_BOX.l, dot.tx) : pct(LISTEN_BOX.l, dot.lx)
            const y = clustered ? pct(THINK_BOX.t, dot.ty) : pct(LISTEN_BOX.t, dot.ly)
            const s = clustered ? dot.ts : dot.ls
            return (
              <i
                key={i}
                style={{
                  '--s': s,
                  left: `${x}%`,
                  top: `${y}%`,
                  animationDelay: `${dot.d}s`,
                }}
              />
            )
          })}
        </div>
      ) : null}

      {phase === 'clock' ? <NowClock /> : null}

      {phase === 'weather' ? (
        <div className="weather rise">
          <img className="sun" src={asset('figma/sun.svg')} alt="" />
          <p className="temp">10°</p>
          <p className="cond">Ясно</p>
        </div>
      ) : null}

      {phase === 'answer' ? (
        <p className="answer">
          <span className="answer-line">
            <RevealText text="Лучше" replay={phase} />
          </span>
          <span className="answer-line">
            <RevealText text="надеть" replay={`${phase}-2`} />
          </span>
          <span className="answer-line">
            <RevealText text="куртку" replay={`${phase}-3`} />
          </span>
        </p>
      ) : null}

      {phase === 'goAsk' ? (
        <p className="answer">
          <span className="answer-line">
            <RevealText text="В каком" replay={phase} />
          </span>
          <span className="answer-line">
            <RevealText text="вы" replay={`${phase}-2`} />
          </span>
          <span className="answer-line">
            <RevealText text="городе?" replay={`${phase}-3`} />
          </span>
        </p>
      ) : null}

      {phase === 'riceAsk' ? (
        <p className="answer">
          <span className="answer-line">
            <RevealText text="Когда?" replay={phase} />
          </span>
        </p>
      ) : null}

      {phase === 'goPlaces' ? <Places apiRef={placesApiRef} /> : null}

      {phase === 'riceTimer' ? (
        <RiceTimer onDone={onRiceDone} skipRef={riceSkipRef} />
      ) : null}

      {phase === 'alarmWait' ? (
        <p className="answer">
          <span className="answer-line">
            <RevealText text="Будильник" replay={phase} />
          </span>
          <span className="answer-line">
            <RevealText text="на 8:00" replay={`${phase}-2`} />
          </span>
          <span className="answer-line">
            <RevealText text="готов" replay={`${phase}-3`} />
          </span>
        </p>
      ) : null}

      {phase === 'alarmMoved' ? (
        <p className="answer">
          <span className="answer-line">
            <RevealText text="Будильник" replay={phase} />
          </span>
          <span className="answer-line">
            <RevealText text="перенесен" replay={`${phase}-2`} />
          </span>
          <span className="answer-line">
            <RevealText text="на 8:10" replay={`${phase}-3`} />
          </span>
        </p>
      ) : null}

      {phase === 'alarmWake' || phase === 'alarmRing' ? (
        <div className={`rice-timer is-alarm-copy ${phase === 'alarmRing' ? 'is-on' : ''}`}>
          <p className="rice-clock">
            <RevealText text={alarmClock} replay={`${phase}-${alarmClock}`} />
          </p>
          <p className="rice-label">
            <RevealText text="доброе утро" replay={`${phase}-hello`} />
          </p>
        </div>
      ) : null}

      {phase === 'riceDone' ? (
        <p className="answer">
          <span className="answer-line">
            <RevealText text="Пора" replay={phase} />
          </span>
          <span className="answer-line">
            <RevealText text="выключить" replay={`${phase}-2`} />
          </span>
          <span className="answer-line">
            <RevealText text="рис" replay={`${phase}-3`} />
          </span>
        </p>
      ) : null}
    </div>
  )
}
