// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react'
import { getLeaderboard, subscribeLeaderboard } from '../lib/supabase'

export default function Leaderboard() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  async function load() {
    const data = await getLeaderboard(50)
    setPlayers(data)
    setLastUpdate(new Date())
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = subscribeLeaderboard(() => load())
    return () => channel.unsubscribe()
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="lb-root">
      <div className="lb-header">
        <h1 className="lb-main-title">Puan Sıralaması</h1>
        <p className="lb-sub">
          {players.length} katılımcı
          {lastUpdate && ` • ${lastUpdate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} güncellendi`}
        </p>
      </div>

      {loading && <div className="lb-loading">Yükleniyor...</div>}

      <div className="lb-list">
        {players.map((p, i) => (
          <div key={p.id} className={`lb-row ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
            <div className="lb-rank">
              {i < 3
                ? <span className="lb-medal">{medals[i]}</span>
                : <span className="lb-rank-num">{i + 1}</span>}
            </div>
            <div className="lb-name">{p.name}</div>
            <div className="lb-bar-wrap">
              <div
                className="lb-bar"
                style={{
                  width: players[0]?.total_points
                    ? `${Math.round((p.total_points / players[0].total_points) * 100)}%`
                    : '0%'
                }}
              />
            </div>
            <div className="lb-points">
              <span className="lb-pts-num">{p.total_points}</span>
              <span className="lb-pts-label"> puan</span>
            </div>
          </div>
        ))}
      </div>

      {!loading && players.length === 0 && (
        <div className="lb-empty">
          Henüz puan kazanan yok. QR kodları okutmaya başlayın!
        </div>
      )}
    </div>
  )
}
