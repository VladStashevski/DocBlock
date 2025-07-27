import React, { useEffect, useState } from 'react'
import './replacement-tooltip.css'

interface ReplacementTooltipProps {
  show: boolean
  position: { x: number; y: number }
  onHide: () => void
  isDragging?: boolean
}

export const ReplacementTooltip: React.FC<ReplacementTooltipProps> = ({
  show,
  position,
  onHide,
  isDragging = false
}) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      
      // Если это не во время drag'а, автоматически скрываем через 2 секунды
      if (!isDragging) {
        const timer = setTimeout(() => {
          setVisible(false)
          onHide()
        }, 2000)

        return () => clearTimeout(timer)
      }
    } else {
      setVisible(false)
    }
  }, [show, onHide, isDragging])

  if (!visible) return null

  return (
    <div
      className={`replacement-tooltip ${isDragging ? 'dragging' : ''}`}
      style={{
        left: position.x,
        top: position.y - 40, // Показываем выше позиции
      }}
    >
      <div className="replacement-tooltip-content">
        <ReplaceIcon />
        <span>{isDragging ? 'Заменить выделенный текст' : 'Текст заменен'}</span>
      </div>
    </div>
  )
}

const ReplaceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 21,12 17,16" />
    <line x1="21" y1="12" x2="9" y2="12" />
    <path d="M3 9v4a2 2 0 0 0 2 2h4" />
  </svg>
)