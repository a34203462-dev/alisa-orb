import { useCallback, useEffect, useRef, useState } from 'react'
import Screen, { RevealText } from './Ball.jsx'
import { asset } from './asset.js'
import './site.css'

const SCENES = [
  { id: 'weather', label: 'Алиса, какая погода?' },
  { id: 'go', label: 'Куда сходить?' },
  { id: 'rice', label: 'Алиса, напомни выключить рис' },
  { id: 'alarm', label: 'Поставь будильник' },
]

const SHELLS = [
  { id: 'black', label: 'Чёрный', color: '#0B0415', photo: asset('figma/ball.png') },
  { id: 'pink', label: 'Розовый', color: '#FF5BA8', photo: asset('figma/ball-pink.jpg') },
  { id: 'white', label: 'Белый', color: '#FFFFFF', photo: asset('figma/ball-white.jpg') },
]

const HINT_DEFAULT = 'Потрясите Алису мышкой'
const HINT_RESET = 'Потрясите Алису мышкой, чтобы сбросить'
const HINT_SPIN = 'Потрясите, чтобы сбросить'

export default function App() {
  const [phase, setPhase] = useState('rest')
  const [shell, setShell] = useState('black')
  const [activeId, setActiveId] = useState(null)
  const [cta, setCta] = useState(null)
  const [hint, setHint] = useState(HINT_DEFAULT)
  const [textTick, setTextTick] = useState(0)
  const [alarmClock, setAlarmClock] = useState('8:00')
  const stageRef = useRef(null)
  const placesNavRef = useRef(null)
  const riceSkipRef = useRef(null)
  const idleRef = useRef(null)
  const phaseRef = useRef(phase)
  const activeIdRef = useRef(activeId)
  const timers = useRef([])
  phaseRef.current = phase
  activeIdRef.current = activeId
  const currentShell = SHELLS.find((item) => item.id === shell) ?? SHELLS[0]

  useEffect(() => {
    SHELLS.forEach((item) => {
      const img = new Image()
      img.src = item.photo
    })
  }, [])

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }, [])

  const later = (ms, fn) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const reset = useCallback(() => {
    clearTimers()
    window.clearTimeout(idleRef.current)
    setPhase('rest')
    setActiveId(null)
    setCta(null)
    setHint(HINT_DEFAULT)
    setAlarmClock('8:00')
  }, [clearTimers])

  const fadeSleep = useCallback(() => {
    clearTimers()
    window.clearTimeout(idleRef.current)
    setActiveId(null)
    setCta(null)
    setHint(HINT_DEFAULT)
    setAlarmClock('8:00')
    setPhase('active')
    later(750, () => setPhase('rest'))
  }, [clearTimers])

  const bumpIdle = useCallback(() => {
    window.clearTimeout(idleRef.current)
    const current = phaseRef.current
    if (
      current === 'rest' ||
      current === 'riceTimer' ||
      current === 'riceDone' ||
      current === 'alarmWait' ||
      current === 'alarmSleep' ||
      current === 'alarmActive' ||
      current === 'alarmWake' ||
      current === 'alarmRing' ||
      current === 'alarmMoved' ||
      current === 'clock'
    )
      return
    idleRef.current = window.setTimeout(() => {
      const next = phaseRef.current
      if (
        next === 'rest' ||
        next === 'riceTimer' ||
        next === 'riceDone' ||
        next === 'alarmWait' ||
        next === 'alarmSleep' ||
        next === 'alarmActive' ||
        next === 'alarmWake' ||
        next === 'alarmRing' ||
        next === 'alarmMoved' ||
        next === 'clock'
      )
        return
      fadeSleep()
    }, 20000)
  }, [fadeSleep])

  useEffect(() => () => clearTimers(), [clearTimers])

  useEffect(() => {
    const onTouch = () => bumpIdle()
    window.addEventListener('pointerdown', onTouch)
    window.addEventListener('keydown', onTouch)
    return () => {
      window.removeEventListener('pointerdown', onTouch)
      window.removeEventListener('keydown', onTouch)
      window.clearTimeout(idleRef.current)
    }
  }, [bumpIdle])

  useEffect(() => {
    bumpIdle()
  }, [phase, bumpIdle])

  const startWeather = () => {
    clearTimers()
    setActiveId('weather')
    setCta('Алиса, какая погода?')
    setTextTick((n) => n + 1)
    setHint(HINT_RESET)
    setPhase('active')
    later(750, () => setPhase('listen'))
    later(2600, () => setPhase('think'))
    later(4600, () => {
      setPhase('weather')
      setCta('Что мне надеть?')
      setTextTick((n) => n + 1)
    })
  }

  const startOutfit = () => {
    if (phase !== 'weather') return
    clearTimers()
    setCta('Что мне надеть?')
    setTextTick((n) => n + 1)
    setPhase('listen2')
    later(1600, () => setPhase('think2'))
    later(3400, () => setPhase('answer'))
  }

  const startGo = () => {
    clearTimers()
    setActiveId('go')
    setCta('Куда сходить?')
    setTextTick((n) => n + 1)
    setHint(HINT_RESET)
    setPhase('active')
    later(750, () => setPhase('listen'))
    later(2600, () => setPhase('think'))
    later(4600, () => {
      setPhase('goAsk')
      setCta('Я в Москве')
      setTextTick((n) => n + 1)
    })
  }

  const startGoCity = () => {
    if (phase !== 'goAsk') return
    clearTimers()
    setCta('Я в Москве')
    setTextTick((n) => n + 1)
    setPhase('listen2')
    later(1600, () => setPhase('think2'))
    later(3400, () => {
      setPhase('goPlaces')
      setHint(HINT_SPIN)
    })
  }

  const startRice = () => {
    clearTimers()
    setActiveId('rice')
    setCta('Алиса, напомни выключить рис')
    setTextTick((n) => n + 1)
    setHint(HINT_RESET)
    setPhase('active')
    later(750, () => setPhase('listen'))
    later(2600, () => setPhase('think'))
    later(4600, () => {
      setPhase('riceAsk')
      setCta('Через 10 минут')
      setTextTick((n) => n + 1)
    })
  }

  const startRiceWhen = () => {
    if (phase !== 'riceAsk') return
    clearTimers()
    setCta('Через 10 минут')
    setTextTick((n) => n + 1)
    setPhase('listen2')
    later(1600, () => setPhase('think2'))
    later(3400, () => setPhase('riceTimer'))
  }

  const finishRiceTimer = useCallback(() => {
    setPhase((current) => (current === 'riceTimer' ? 'riceDone' : current))
  }, [])

  const skipRiceTimer = () => {
    riceSkipRef.current?.()
  }

  const pickup = useCallback(() => {
    if (phaseRef.current !== 'rest' || activeIdRef.current) return
    setHint(HINT_DEFAULT)
    setPhase('active')
  }, [])

  const showClock = useCallback(() => {
    if (activeIdRef.current) {
      reset()
      return
    }
    if (phaseRef.current === 'clock') return
    clearTimers()
    window.clearTimeout(idleRef.current)
    setPhase('clock')
    later(4500, () => {
      if (phaseRef.current === 'clock') fadeSleep()
    })
  }, [clearTimers, fadeSleep, reset])

  const startAlarm = () => {
    clearTimers()
    setActiveId('alarm')
    setAlarmClock('8:00')
    setCta('Алиса, поставь будильник на 8:00')
    setTextTick((n) => n + 1)
    setHint(HINT_RESET)
    setPhase('active')
    later(750, () => setPhase('listen'))
    later(2600, () => setPhase('think'))
    later(4600, () => setPhase('alarmWait'))
  }

  const jumpToAlarm = () => {
    clearTimers()
    setPhase('alarmSleep')
    later(600, () => setPhase('alarmActive'))
    later(1500, () => setPhase('alarmWake'))
    later(2700, () => {
      setPhase('alarmRing')
      setTextTick((n) => n + 1)
    })
  }

  const startSnooze = () => {
    if (phase !== 'alarmRing') return
    clearTimers()
    setAlarmClock('8:10')
    setCta('Алиса, еще 10 минут')
    setTextTick((n) => n + 1)
    setPhase('listen2')
    later(1600, () => setPhase('think2'))
    later(3400, () => setPhase('alarmMoved'))
  }

  const onSceneClick = (id) => {
    if (id === 'weather') {
      if (activeId === 'weather' && phase === 'weather') {
        startOutfit()
        return
      }
      if (activeId) return
      startWeather()
      return
    }
    if (id === 'go') {
      if (activeId === 'go' && phase === 'goAsk') {
        startGoCity()
        return
      }
      if (activeId) return
      startGo()
      return
    }
    if (id === 'rice') {
      if (activeId === 'rice' && phase === 'riceAsk') {
        startRiceWhen()
        return
      }
      if (activeId) return
      startRice()
      return
    }
    if (id === 'alarm') {
      if (activeId) return
      startAlarm()
    }
  }

  return (
    <div className="page">
      <div className="mobile-stub">
        <p className="mobile-stub-copy">
          Пожалуйста, откройте прототип
          <br />с компьютера/ноута
        </p>
        <div className="mobile-stub-scene" aria-hidden="true">
          <div className="stub-orbit stub-orbit-white">
            <div className="stub-ball">
              <img className="stub-shell" src={asset('figma/ball-white.jpg')} alt="" />
              <div className="stub-face">
                <img className="stub-face-bg" src={asset('figma/stub-face.svg')} alt="" />
                <div className="stub-eyes">
                  <img src={asset('figma/stub-eye-l.svg')} alt="" />
                  <img src={asset('figma/stub-eye-r.svg')} alt="" />
                </div>
              </div>
            </div>
          </div>
          <div className="stub-orbit stub-orbit-pink">
            <div className="stub-ball">
              <img className="stub-shell" src={asset('figma/ball-pink.jpg')} alt="" />
              <div className="stub-face">
                <img className="stub-face-bg" src={asset('figma/stub-face-2.svg')} alt="" />
                <div className="stub-eyes">
                  <img src={asset('figma/stub-eye-l.svg')} alt="" />
                  <img src={asset('figma/stub-eye-r.svg')} alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <header className="topbar">
        <a className="brand" href="#device">
          <span className="brand-icon">
            <img src={asset('figma/alice.svg')} alt="" width={58} height={58} />
          </span>
          Алиса ORB
        </a>
        <div className="top-actions">
          <a
            className="present"
            href="https://www.figma.com/deck/NzvSsZO67uHj38rF3k9UPK/%D0%A2%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D0%BE%D0%B5-%D0%A3%D0%BC%D0%BD%D1%8B%D0%B5-%D1%83%D1%81%D1%82%D1%80%D0%BE%D0%B9%D1%81%D1%82%D0%B2%D0%B0?node-id=1-42&viewport=-133%2C-88%2C0.62&t=icsIzWNaxjeDN4vv-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1"
            target="_blank"
            rel="noreferrer"
          >
            смотреть презентацию
          </a>
          <a
            className="figma-link"
            href="https://www.figma.com/design/iNqX38znpqnetklWbH3tJo/%D0%A2%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D0%BE%D0%B5---%D0%A3%D0%BC%D0%BD%D1%8B%D0%B5-%D1%83%D1%81%D1%82%D1%80%D0%BE%D0%B9%D1%81%D1%82%D0%B2%D0%B0?node-id=1-6&t=IdzLFCdKoZ4sBpty-1"
            target="_blank"
            rel="noreferrer"
            aria-label="Открыть в Figma"
          >
            <img src={asset('figma/figma-btn.png')} alt="" width={60} height={60} />
          </a>
        </div>
      </header>

      <main className="stage" id="device">
        <div className="mid">
          <div className="swatches" role="radiogroup" aria-label="Цвет корпуса">
            {SHELLS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={shell === item.id}
                aria-label={item.label}
                className={`swatch ${shell === item.id ? 'is-on' : ''}`}
                style={{ '--swatch': item.color }}
                onClick={() => setShell(item.id)}
              />
            ))}
          </div>

          <div className="device-col">
            <div className="device-stage">
              {phase === 'goPlaces' ? (
                <>
                  <button
                    type="button"
                    className="place-nav place-nav-prev"
                    aria-label="Предыдущее место"
                    onClick={() => placesNavRef.current?.step(-1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="place-nav place-nav-next"
                    aria-label="Следующее место"
                    onClick={() => placesNavRef.current?.step(1)}
                  >
                    →
                  </button>
                </>
              ) : null}
              <div
                ref={stageRef}
                data-shell={shell}
                className={`device ${phase === 'riceDone' || phase === 'alarmRing' ? 'is-alarm' : ''}`}
                role="button"
                tabIndex={0}
                aria-label="Шар Алисы"
              >
                <div className="device-clip">
                  <img
                    className="device-photo"
                    src={currentShell.photo}
                    alt=""
                    decoding="async"
                  />
                  <div className="screen">
                    <Screen
                      phase={phase}
                      onShakeReset={showClock}
                      onPickup={pickup}
                      stageRef={stageRef}
                      placesNavRef={placesNavRef}
                      onRiceDone={finishRiceTimer}
                      riceSkipRef={riceSkipRef}
                      alarmClock={alarmClock}
                    />
                  </div>
                </div>
              </div>
            </div>
            <p className="hint">{hint}</p>
          </div>
        </div>
      </main>

      {phase === 'riceTimer' ? (
        <div className="scenes" role="tablist" aria-label="Таймер">
          <button type="button" className="skip" onClick={skipRiceTimer}>
            Пропустить
          </button>
        </div>
      ) : phase === 'alarmWait' || phase === 'alarmMoved' ? (
        <div className="scenes" role="tablist" aria-label="Будильник">
          <button type="button" className="skip" onClick={jumpToAlarm}>
            перейти к будильнику
          </button>
        </div>
      ) : phase === 'riceDone' ? (
        <div className="scenes is-focused" role="tablist" aria-label="Стоп">
          <button type="button" className="scene is-on" onClick={fadeSleep}>
            <span className="scene-icon">
              <img src={asset('figma/mic.svg')} alt="" width={24} height={24} />
            </span>
            Алиса, стоп
          </button>
        </div>
      ) : phase === 'alarmRing' ? (
        <div className="scenes is-focused" role="tablist" aria-label="Будильник">
          <button type="button" className="scene is-on" onClick={fadeSleep}>
            <span className="scene-icon">
              <img src={asset('figma/mic.svg')} alt="" width={24} height={24} />
            </span>
            Алиса, стоп
          </button>
          <button type="button" className="scene" onClick={startSnooze}>
            <span className="scene-icon">
              <img src={asset('figma/mic.svg')} alt="" width={24} height={24} />
            </span>
            Алиса, еще 10 минут
          </button>
        </div>
      ) : phase !== 'answer' &&
        phase !== 'goPlaces' &&
        phase !== 'alarmSleep' &&
        phase !== 'alarmActive' &&
        phase !== 'alarmWake' ? (
      <div className={`scenes ${activeId ? 'is-focused' : ''}`} role="tablist" aria-label="Сценарии">
        {SCENES.map((item) => {
          const visible = !activeId || item.id === activeId
          if (!visible) return null
          const live = item.id === 'weather' || item.id === 'go' || item.id === 'rice' || item.id === 'alarm'
          const label = live && cta ? cta : item.label
          const reveal = live && cta
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeId === item.id}
              className={`scene ${activeId === item.id ? 'is-on' : ''}`}
              onClick={() => onSceneClick(item.id)}
            >
              <span className="scene-icon">
                <img src={asset('figma/mic.svg')} alt="" width={24} height={24} />
              </span>
              {reveal ? (
                <RevealText text={label} replay={textTick} />
              ) : (
                <span>{label}</span>
              )}
            </button>
          )
        })}
      </div>
      ) : null}
    </div>
  )
}
