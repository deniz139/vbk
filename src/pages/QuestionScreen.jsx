// src/pages/QuestionScreen.jsx
import { useState, useEffect, useRef } from 'react'
import {
  getOrCreatePlayer,
  getQuestionForStation,
  getStations,
  submitAnswer,
} from '../lib/supabase'

const TIMER_SECONDS = 15

export default function QuestionScreen({ stationId }) {
  const [step, setStep] = useState('name')      // name | loading | question | result | done
  const [name, setName] = useState('')
  const [player, setPlayer] = useState(null)
  const [station, setStation] = useState(null)
  const [question, setQuestion] = useState(null)
  const [chosen, setChosen] = useState(null)
  const [result, setResult] = useState(null)    // { isCorrect, pointsEarned }
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  // Stand bilgisini yükle
  useEffect(() => {
    getStations().then(stations => {
      const s = stations.find(s => s.id === stationId)
      setStation(s || { id: stationId, name: stationId })
    })
  }, [stationId])

  function startTimer(onExpire) {
    setTimeLeft(TIMER_SECONDS)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          onExpire()
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  async function handleStart() {
    if (!name.trim()) return
    setStep('loading')
    setError(null)
    try {
      const p = await getOrCreatePlayer(name.trim())
      setPlayer(p)
      const q = await getQuestionForStation(stationId, p.id)
      if (!q) { setStep('done'); return }
      setQuestion(q)
      setStep('question')
      startTimer(() => handleAnswer(null, q, p))
    } catch (e) {
      setError('Bağlantı hatası: ' + e.message)
      setStep('name')
    }
  }

  async function handleAnswer(chosenIndex, q = question, p = player) {
    clearInterval(timerRef.current)
    const idx = chosenIndex ?? -1
    setChosen(idx)
    setStep('result')
    try {
      const res = await submitAnswer(p.id, q, idx)
      setResult(res)
    } catch (e) {
      setResult({ isCorrect: false, pointsEarned: 0 })
    }
  }

  // Shuffled options (sadece display için, index'i koruyoruz)
  const shuffledOptions = question
    ? question.options.map((opt, i) => ({ opt, i }))
    : []

  return (
    <div className="q-root">
      <div className="q-card">

        {/* NAME ENTRY */}
        {step === 'name' && (
          <div className="q-section">
            <div className="q-logo-ring">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2">
                <path d="M3 9V5a2 2 0 0 1 2-2h4M3 15v4a2 2 0 0 0 2 2h4M15 3h4a2 2 0 0 1 2 2v4M15 21h4a2 2 0 0 0 2-2v-4"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div className="station-pill">{station?.name || stationId}</div>
            <h2 className="q-title">Soruya hazır mısın?</h2>
            <p className="q-sub">Adını gir, hızlıca bir soruya cevap ver, puan kazan!</p>
            {error && <p className="q-error">{error}</p>}
            <label className="q-label">Adın</label>
            <input
              className="q-input"
              placeholder="Adını yaz..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              autoFocus
            />
            <button className="q-btn-primary" onClick={handleStart} disabled={!name.trim()}>
              Başla →
            </button>
          </div>
        )}

        {/* LOADING */}
        {step === 'loading' && (
          <div className="q-section q-center">
            <div className="q-spinner" />
            <p className="q-sub">Soru hazırlanıyor...</p>
          </div>
        )}

        {/* QUESTION */}
        {step === 'question' && question && (
          <div className="q-section">
            <div className="q-topbar">
              <span className="station-pill small">{station?.name}</span>
              <span className={`q-timer ${timeLeft <= 5 ? 'urgent' : ''}`}>{timeLeft}s</span>
            </div>
            <div className="q-progress">
              <div className="q-progress-fill" style={{ width: `${(timeLeft / TIMER_SECONDS) * 100}%`, background: timeLeft <= 5 ? '#E24B4A' : '#534AB7' }} />
            </div>
            <div className="q-question-box">
              <p className="q-question-text">{question.text}</p>
            </div>
            <div className="q-options">
              {shuffledOptions.map(({ opt, i }) => (
                <button
                  key={i}
                  className="q-option"
                  onClick={() => handleAnswer(i)}
                >
                  <span className="q-option-letter">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RESULT */}
        {step === 'result' && question && result && (
          <div className="q-section q-center">
            <div className={`q-result-icon ${result.isCorrect ? 'win' : 'lose'}`}>
              {result.isCorrect ? '✓' : '✗'}
            </div>
            <div className={`q-points-big ${result.isCorrect ? 'win' : 'lose'}`}>
              {result.isCorrect ? `+${result.pointsEarned} puan!` : '0 puan'}
            </div>
            <p className="q-sub">
              {result.isCorrect ? 'Harika! Doğru cevap.' : `Doğru cevap: "${question.options[question.correct_index]}"`}
            </p>
            <div className="q-options result-preview">
              {question.options.map((opt, i) => (
                <div
                  key={i}
                  className={`q-option static ${i === question.correct_index ? 'correct' : chosen === i ? 'wrong' : 'neutral'}`}
                >
                  <span className="q-option-letter">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DONE — tüm sorular cevaplanmış */}
        {step === 'done' && (
          <div className="q-section q-center">
            <div className="q-result-icon win">★</div>
            <h2 className="q-title">Bu standı bitirdin!</h2>
            <p className="q-sub">Diğer standlarda daha fazla puan topla.</p>
            <a className="q-btn-primary" href="/leaderboard">Sıralamayı gör</a>
          </div>
        )}

      </div>
    </div>
  )
}
