import React, { useState } from 'react'
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
  onSelectDocument: (document: Document) => void
  onCreateDocument: () => void
  onDeleteDocument: (id: string) => void
  onRenameDocument: (id: string, newTitle: string) => void
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
  onRenameDocument
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleStartEdit = (block: SidebarBlock) => {
    setEditingId(block.id)
    setEditTitle(block.title)
  }

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameBlock(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleDelete = (block: SidebarBlock) => {
    if (window.confirm(`Вы уверены, что хотите удалить блок "${block.title}"?`)) {
      onDeleteBlock(block.id)
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
              className="block-item"
              onClick={(e) => {
                if (
                  e.target instanceof HTMLElement &&
                  (e.target.closest('.block-actions') || e.target.closest('.block-title-input'))
                ) {
                  return
                }
                onEditBlock(block)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && editingId !== block.id) {
                  onEditBlock(block)
                }
              }}
              onMouseEnter={() => setHoveredId(block.id)}
              onMouseLeave={() => setHoveredId(null)}
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