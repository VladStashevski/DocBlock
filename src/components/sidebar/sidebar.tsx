import React, { useState, useCallback } from 'react'
import type { Document } from '@/types/document'
import type { TextBlock } from '@/types/text-block'
import { DocumentSelector } from '../document-selector/document-selector'
import './sidebar.css'

type SidebarBlock = TextBlock

interface SidebarProps {
  blocks: SidebarBlock[]
  onCreateBlock: () => void
  onDeleteBlock: (id: string) => void
  onRenameBlock: (id: string, newTitle: string) => void
  onEditBlock: (block: SidebarBlock) => void
  activeDocument: Document | null
  documents: Document[]
  onSelectDocument: (document: Document, shouldFocus?: boolean) => void
  onCreateDocument: () => void
  onDeleteDocument: (id: string) => void
  onRenameDocument: (id: string, newTitle: string) => void
  editingBlock: SidebarBlock | null
}

export const Sidebar: React.FC<SidebarProps> = ({
  blocks,
  onCreateBlock,
  onDeleteBlock,
  onRenameBlock,
  onEditBlock,
  activeDocument,
  documents,
  onSelectDocument,
  onCreateDocument,
  onDeleteDocument,
  onRenameDocument,
  editingBlock
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [clickedId, setClickedId] = useState<string | null>(null)
  const [hoveredActiveId, setHoveredActiveId] = useState<string | null>(null)

  const handleStartEdit = useCallback((block: SidebarBlock) => {
    setEditingId(block.id)
    setEditTitle(block.title)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (editingId && editTitle.trim()) {
      onRenameBlock(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }, [editingId, editTitle, onRenameBlock])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditTitle('')
  }, [])

  const handleDelete = useCallback((block: SidebarBlock) => {
    if (window.confirm(`Вы уверены, что хотите удалить блок "${block.title}"?`)) {
      onDeleteBlock(block.id)
    }
  }, [onDeleteBlock])

  const handleBlockClick = useCallback((block: SidebarBlock, e: React.MouseEvent) => {
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest('.block-actions') || e.target.closest('.block-title-input'))
    ) {
      return
    }

    setClickedId(block.id)
    // Добавляем небольшую задержку для визуальной обратной связи
    setTimeout(() => {
      onEditBlock(block)
      setClickedId(null)
    }, 100)
  }, [onEditBlock])

  const handleDragStart = (block: SidebarBlock, e: React.DragEvent) => {
    try {
      // Сбрасываем состояние редактирования
      setEditingId(null)
      setEditTitle('')

      // Очищаем контент от HTML тегов перед сохранением
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = block.content || ''
      const cleanContent = tempDiv.textContent || tempDiv.innerText || ''

      const cleanBlock = {
        ...block,
        content: cleanContent
      }

      e.dataTransfer.setData('application/json', JSON.stringify(cleanBlock))
      e.dataTransfer.effectAllowed = 'copy'

      // Создаем элемент для отображения при перетаскивании
      const dragElement = document.createElement('div')
      dragElement.className = 'block-item drag-element'
      dragElement.style.width = '280px'
      dragElement.style.background = 'var(--tt-bg-color, #fff)'
      dragElement.style.border = '1px solid var(--tt-border-color, #e5e7eb)'
      dragElement.style.borderRadius = 'var(--tt-radius-md, 8px)'
      dragElement.style.padding = '12px'
      dragElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
      dragElement.style.position = 'absolute'
      dragElement.style.top = '-1000px' // Скрываем элемент за пределами экрана
      dragElement.style.opacity = '0.95'
      dragElement.style.pointerEvents = 'none' // Предотвращаем взаимодействие с элементом
      dragElement.style.transition = 'transform 0.2s ease, opacity 0.2s ease'

      // Добавляем эффект сжатия если блок активен и на него наводят
      if (editingBlock?.id === block.id && hoveredActiveId === block.id) {
        dragElement.style.transform = 'scale(0.85)'
        dragElement.style.opacity = '0.8'
      }

      const header = document.createElement('div')
      header.style.display = 'flex'
      header.style.alignItems = 'center'
      header.style.marginBottom = '8px'
      header.style.gap = '8px'

      const title = document.createElement('div')
      title.textContent = block.title
      title.style.fontWeight = '600'
      title.style.fontSize = '14px'
      title.style.color = 'var(--tt-gray-dark-800, #2c2e33)'
      title.style.flex = '1'
      title.style.paddingLeft = '30px'
      header.appendChild(title)

      const content = document.createElement('div')
      content.textContent = cleanContent?.slice(0, 120) + (cleanContent && cleanContent.length > 120 ? '...' : '')
      content.style.fontSize = '13px'
      content.style.color = 'var(--tt-gray-dark-600, #676b73)'
      content.style.lineHeight = '1.4'
      content.style.maxHeight = '3.2em'
      content.style.overflow = 'hidden'
      content.style.display = '-webkit-box'
      content.style.webkitLineClamp = '2'
      content.style.webkitBoxOrient = 'vertical'
      content.style.paddingLeft = '30px'

      dragElement.appendChild(header)
      dragElement.appendChild(content)

      document.body.appendChild(dragElement)
      e.dataTransfer.setDragImage(dragElement, 20, 20)

      // Удаляем элемент после начала перетаскивания
      requestAnimationFrame(() => {
        if (dragElement.parentNode) {
          document.body.removeChild(dragElement)
        }
      })

      // Добавляем класс для визуальной обратной связи
      const blockElement = e.currentTarget as HTMLElement
      blockElement.classList.add('dragging')
    } catch (error) {
      console.error('Error starting drag:', error)
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    try {
      // Сбрасываем состояние редактирования
      setEditingId(null)
      setEditTitle('')

      // Удаляем класс для визуальной обратной связи
      const blockElement = e.currentTarget as HTMLElement
      blockElement.classList.remove('dragging')
    } catch (error) {
      console.error('Error ending drag:', error)
    }
  }

  const documentBlocks = activeDocument
    ? blocks.filter(block => block.documentId === activeDocument.id)
    : []

  return (
    <div className="sidebar-container">
      <DocumentSelector
        documents={documents}
        activeDocumentId={activeDocument?.id || null}
        onSelectDocument={onSelectDocument}
        onCreateDocument={onCreateDocument}
        onDeleteDocument={onDeleteDocument}
        onRenameDocument={onRenameDocument}
      />

      <div className="blocks-header">
        <h3>Текстовые блоки</h3>
        <button
          className="create-block-button"
          onClick={onCreateBlock}
          title="Создать новый блок"
          disabled={!activeDocument}
        >
          <PlusIcon />
        </button>
      </div>

      <div className="blocks-list">
        {!activeDocument ? null : documentBlocks.length === 0 ? null : (
          documentBlocks.map(block => (
            <div
              key={block.id}
              className={`block-item ${editingBlock?.id === block.id ? 'active' : ''} ${clickedId === block.id ? 'clicking' : ''}`}
              onClick={(e) => handleBlockClick(block, e)}
              role="button"
              tabIndex={0}
              draggable={editingId !== block.id}
              onDragStart={(e) => handleDragStart(block, e)}
              onDragEnd={handleDragEnd}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && editingId !== block.id) {
                  e.preventDefault()
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  handleBlockClick(block, e as any)
                }
              }}
              onMouseEnter={() => {
                setHoveredId(block.id)
                if (editingBlock?.id === block.id) {
                  setHoveredActiveId(block.id)
                }
              }}
              onMouseLeave={() => {
                setHoveredId(null)
                setHoveredActiveId(null)
              }}
            >
              {editingId === block.id ? (
                <div className="block-edit">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    className="block-title-input"
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button
                      className="save-edit-button"
                      onClick={handleSaveEdit}
                      title="Сохранить"
                    >
                      <CheckIcon />
                    </button>
                    <button
                      className="cancel-edit-button"
                      onClick={handleCancelEdit}
                      title="Отменить"
                    >
                      <XIcon />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="block-content">
                  <div className="block-title">
                    {block.title}
                  </div>
                  <div className="block-actions">
                    {hoveredId === block.id && (
                      <>
                        <button
                          className="edit-block-button"
                          onClick={() => handleStartEdit(block)}
                          title="Переименовать"
                        >
                          <EditIcon />
                        </button>
                        <button
                          className="delete-block-button"
                          onClick={() => handleDelete(block)}
                          title="Удалить"
                        >
                          <DeleteIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className="block-date">
                {block.updatedAt.toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Иконки
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6" />
    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12" />
  </svg>
)

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)