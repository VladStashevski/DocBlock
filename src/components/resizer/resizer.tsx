import React, { useCallback, useEffect, useRef } from 'react'
import './resizer.css'

interface ResizerProps {
  onResize: (width: number) => void
  minWidth?: number
  maxWidth?: number
  initialWidth?: number
}

export const Resizer: React.FC<ResizerProps> = ({
  onResize,
  minWidth = 250,
  maxWidth = 500,
  initialWidth = 320
}) => {
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(initialWidth)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = initialWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [initialWidth])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return

    const deltaX = startX.current - e.clientX // Инвертируем, так как тянем влево
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + deltaX))
    
    onResize(newWidth)
  }, [onResize, minWidth, maxWidth])

  const handleMouseUp = useCallback(() => {
    if (!isResizing.current) return
    
    isResizing.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div 
      className="resizer"
      onMouseDown={handleMouseDown}
      title="Перетащите для изменения размера"
    />
  )
}