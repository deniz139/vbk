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
        <div className="hp-hero-badge">İTÜ VBK</div>
        <h1 className="hp-hero-title">From Generative<br />To Agentic</h1>
        <p className="hp-hero-sub">Summit'26</p>
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

      

      <div className="hp-footer">
        Snack standlarındaki QR kodları okutarak puan toplayabilirsin.
      </div>
    </div>
  )
}
