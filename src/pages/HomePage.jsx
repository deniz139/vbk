import { useState, useEffect } from 'react'
import { getLeaderboard } from '../lib/supabase'

const MODULES = [
  {
    id: 'battle',
    icon: '⚡',
    title: 'Prompt Battle',
    desc: "En iyi promptu yaz, Claude'a karşı yarış, puan kazan.",
    href: '#/battle/join',
    color: '#534AB7',
    bg: '#EEEDFE',
  }
]

export default function HomePage() {
  const [top3, setTop3] = useState([])

  useEffect(() => {
    getLeaderboard(3).then(setTop3).catch(() => {})
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="hp-root">
      <div className="hp-hero">
        <div className="hp-hero-badge">ITÜ VBK</div>
        <h1 className="hp-hero-title">Zirve<br />Gamification</h1>
        <p className="hp-hero-sub">Etkinliğe katıl, puan topla, networking yap.</p>
      </div>

      <div className="hp-cards">
        {MODULES.map(m => (
          <a
            key={m.id}
            href={m.href}
            className="hp-card"
            style={{ '--card-color': m.color, '--card-bg': m.bg }}
          >
            <div className="hp-card-icon">{m.icon}</div>
            <div className="hp-card-content">
              <div className="hp-card-title">{m.title}</div>
              <div className="hp-card-desc">{m.desc}</div>
            </div>
            <div className="hp-card-arrow">→</div>
          </a>
        ))}
      </div>

      {top3.length > 0 && (
        <div className="hp-mini-lb">
          <div className="hp-mini-lb-title">Bu anki liderler</div>
          {top3.map((p, i) => (
            <div key={p.id} className="hp-mini-lb-row">
              <span className="hp-mini-medal">{medals[i]}</span>
              <span className="hp-mini-name">{p.name}</span>
              <span className="hp-mini-pts">{p.total_points} puan</span>
            </div>
          ))}
          <a href="#/leaderboard" className="hp-mini-lb-more">
            Tüm sıralamayı gör →
          </a>
        </div>
      )}

      <div className="hp-footer">
        Snack standlarındaki QR kodları okutarak puan toplayabilirsin.
      </div>
    </div>
  )
}
