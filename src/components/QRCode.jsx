// src/components/QRCode.jsx
// Basit QR benzeri görsel (gerçek QR için 'qrcode' npm paketi kullan)
// npm install qrcode && import QRCode from 'qrcode' ile replace edebilirsin

import { useEffect, useRef } from 'react'

export default function QRCodeComponent({ value, size = 160 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    // Gerçek QR kütüphanesi varsa kullan
    if (window.QRCode) {
      // qrcode.js entegrasyonu
      window.QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 1 })
      return
    }
    // Fallback: pattern-based placeholder
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const cells = 25
    const cell = Math.floor(size / cells)
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#1a1a2e'

    const hash = [...value].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)

    // Corner markers
    const drawCorner = (ox, oy) => {
      ctx.fillRect(ox * cell, oy * cell, 7 * cell, 7 * cell)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect((ox + 1) * cell, (oy + 1) * cell, 5 * cell, 5 * cell)
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect((ox + 2) * cell, (oy + 2) * cell, 3 * cell, 3 * cell)
    }
    drawCorner(0, 0)
    drawCorner(cells - 7, 0)
    drawCorner(0, cells - 7)

    // Data modules
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const isCorner = (r < 8 && c < 8) || (r < 8 && c > cells - 9) || (r > cells - 9 && c < 8)
        if (!isCorner) {
          const on = ((hash * (r + 1) * (c + 3) + r * 17 + c * 11 + Math.abs(hash)) % 3) === 0
          if (on) ctx.fillRect(c * cell, r * cell, cell - 1, cell - 1)
        }
      }
    }
  }, [value, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ borderRadius: 8, display: 'block', margin: '0 auto' }}
    />
  )
}
