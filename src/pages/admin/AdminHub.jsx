// src/pages/admin/AdminHub.jsx
import { useState } from 'react'

const ADMIN_MODULES = [
  {
    icon: '🍞',
    title: 'Snack Admin',
    desc: 'Standları yönet, soru ekle, QR üret, istatistikleri gör.',
    href: '#/a/snack',
    color: '#BA7517',
    bg: '#FAEEDA',
  },
  {
    icon: '⚡',
    title: 'Prompt Battle',
    desc: 'Tur başlat, promptları seç, oylamayı yönet.',
    href: '#/a/battle',
    color: '#534AB7',
    bg: '#EEEDFE',
  },
  {
    icon: '⚡',
    title: 'Battle Büyük Ekran',
    desc: 'Projektöre açılacak A vs B ekranı.',
    href: '#/battle',
    color: '#534AB7',
    bg: '#EEEDFE',
  },
  {
    icon: '📋',
    title: 'Yoklama',
    desc: 'Oturum oluştur, QR göster, katılım listesini izle, CSV indir.',
    href: '#/a/attendance',
    color: '#1D9E75',
    bg: '#E1F5EE',
  },
  {
    icon: '🤝',
    title: 'Networking',
    desc: 'Profilleri gör, eşleştirmeyi başlat.',
    href: '#/a/network',
    color: '#D85A30',
    bg: '#FAECE7',
  },
  {
    icon: '🏆',
    title: 'Leaderboard',
    desc: 'Canlı puan sıralaması — büyük ekrana aç.',
    href: '#/leaderboard',
    color: '#639922',
    bg: '#EAF3DE',
  },
]

export default function AdminHub() {
  return (
    <div className="admin-root">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">🎛️ Panel</h1>
          <p style={{fontSize:13,color:'var(--text-muted)',marginTop:2}}>Tüm modüllere buradan erişebilirsin</p>
        </div>
        <a href="#/" className="admin-link-btn">← Ana Sayfa</a>
      </div>

      <div style={{display:'grid',gap:10}}>
        {ADMIN_MODULES.map(m => (
          <a
            key={m.href}
            href={m.href}
            style={{
              display:'flex', alignItems:'center', gap:14,
              background:'var(--white)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'14px 16px',
              textDecoration:'none', color:'var(--text)',
              transition:'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = m.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{
              width:48, height:48, borderRadius:12,
              background: m.bg,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:22, flexShrink:0,
            }}>
              {m.icon}
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:15, fontWeight:600, marginBottom:3}}>{m.title}</div>
              <div style={{fontSize:12, color:'var(--text-muted)', lineHeight:1.4}}>{m.desc}</div>
            </div>
            <div style={{fontSize:16, color:'var(--text-muted)', flexShrink:0}}>→</div>
          </a>
        ))}
      </div>

      <div style={{
        marginTop:24, padding:'12px 16px',
        background:'#FAEEDA', borderRadius:'var(--radius-sm)',
        fontSize:13, color:'#633806'
      }}>
        💡 Bu sayfa PIN korumalı. URL'i kimlerle paylaştığına dikkat et.
      </div>
    </div>
  )
}
