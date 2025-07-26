import { useState, useEffect } from 'react'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { Resizer } from '@/components/resizer/resizer'
import { Sidebar } from '@/components/sidebar/sidebar'
import type { Document } from './types/document'
import type { TextBlock } from './types/text-block'
import './App.css'

const SIDEBAR_WIDTH_KEY = 'sidebar-width'
const DOCUMENTS_KEY = 'documents'
const ACTIVE_DOCUMENT_KEY = 'active-document'
const DEFAULT_SIDEBAR_WIDTH = 320
const BLOCKS_KEY = 'text-blocks'

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY)
    return saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH
  })

  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem(DOCUMENTS_KEY)
    return saved ? JSON.parse(saved).map((doc: Document) => ({
      ...doc,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt)
    })) : []
  })

  const [activeDocument, setActiveDocument] = useState<Document | null>(() => {
    const savedId = localStorage.getItem(ACTIVE_DOCUMENT_KEY)
    if (savedId) {
      const saved = localStorage.getItem(DOCUMENTS_KEY)
      if (saved) {
        const docs = JSON.parse(saved)
        const doc = docs.find((d: Document) => d.id === savedId)
        return doc ? {
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt)
        } : null
      }
    }
    return null
  })

  const [blocks, setBlocks] = useState<TextBlock[]>(() => {
    const saved = localStorage.getItem(BLOCKS_KEY)
    return saved ? JSON.parse(saved).map((block: TextBlock) => ({
      ...block,
      createdAt: new Date(block.createdAt),
      updatedAt: new Date(block.updatedAt || block.createdAt)
    })) : []
  })

  const [currentContent, setCurrentContent] = useState('')
  const [editingBlock, setEditingBlock] = useState<TextBlock | null>(null)
  const [focusEditor, setFocusEditor] = useState(0)

  // Сохраняем документы в localStorage
  useEffect(() => {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents))
  }, [documents])

  // Сохраняем активный документ в localStorage
  useEffect(() => {
    if (activeDocument) {
      localStorage.setItem(ACTIVE_DOCUMENT_KEY, activeDocument.id)
    } else {
      localStorage.removeItem(ACTIVE_DOCUMENT_KEY)
    }
  }, [activeDocument])

  // Сохраняем блоки в localStorage
  useEffect(() => {
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks))
  }, [blocks])

  // Автоматически выбираем первый документ, если нет активного
  useEffect(() => {
    if (!activeDocument && documents.length > 0 && !editingBlock) {
      const firstDoc = documents[0]
      setActiveDocument(firstDoc)
      setCurrentContent(firstDoc.content)
    }
  }, [documents, activeDocument, editingBlock])

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substring(2, 11)
  }

  const handleResize = (width: number) => {
    setSidebarWidth(width)
    localStorage.setItem(SIDEBAR_WIDTH_KEY, width.toString())
  }

  const handleCreateDocument = () => {
    const newDoc: Document = {
      id: generateId(),
      title: `Документ ${documents.length + 1}`,
      content: '<p>Новый документ</p>',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setDocuments(prev => [newDoc, ...prev])
    setActiveDocument(newDoc)
    setEditingBlock(null)
    setCurrentContent(newDoc.content)
  }

  const handleSelectDocument = (document: Document, shouldFocus = false) => {
    // Если это тот же документ и нужно фокусироваться, но мы редактируем блок
    if (activeDocument?.id === document.id && shouldFocus && editingBlock) {
      // Переключаемся с блока на документ
      setEditingBlock(null)
      setCurrentContent(document.content)
      setFocusEditor(prev => prev + 1)
      return
    }

    // Если это тот же документ и нужно фокусироваться, и мы уже на документе
    if (activeDocument?.id === document.id && shouldFocus && !editingBlock) {
      setFocusEditor(prev => prev + 1)
      return
    }

    // Сохраняем текущий документ перед переключением, только если контент изменился
    if (activeDocument && !editingBlock && currentContent !== activeDocument.content) {
      const updatedDocument = {
        ...activeDocument,
        content: currentContent,
        updatedAt: new Date()
      }
      setDocuments(prev => prev.map(doc =>
        doc.id === activeDocument.id ? updatedDocument : doc
      ))
    }
    
    setActiveDocument(document)
    setEditingBlock(null)
    setCurrentContent(document.content)
  }

  const handleDeleteDocument = (id: string) => {
    const newDocuments = documents.filter(doc => doc.id !== id)
    setDocuments(newDocuments)

    if (activeDocument?.id === id) {
      const nextDoc = newDocuments.length > 0 ? newDocuments[0] : null
      setActiveDocument(nextDoc)
      setEditingBlock(null)
      setCurrentContent(nextDoc?.content || '')
    }
  }

  const handleRenameDocument = (id: string, newTitle: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === id ? { ...doc, title: newTitle, updatedAt: new Date() } : doc
    ))

    if (activeDocument?.id === id) {
      setActiveDocument(prev => prev ? { ...prev, title: newTitle, updatedAt: new Date() } : null)
    }
  }

  // Создать новый блок
  const handleCreateBlock = () => {
    if (!activeDocument) return
    const documentBlocks = blocks.filter(block => block.documentId === activeDocument.id)
    const newBlock: TextBlock = {
      id: generateId(),
      title: `Блок ${documentBlocks.length + 1}`,
      content: '<p>Новый текстовый блок</p>',
      documentId: activeDocument.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setBlocks(prev => [newBlock, ...prev])
    setEditingBlock(newBlock)
    setCurrentContent(newBlock.content)
  }

  // Удалить блок
  const handleDeleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id))
    if (editingBlock && editingBlock.id === id) {
      setEditingBlock(null)
      setCurrentContent(activeDocument?.content || '')
    }
  }

  // Переименовать блок
  const handleRenameBlock = (id: string, newTitle: string) => {
    setBlocks((prev: TextBlock[]) => prev.map(block =>
      block.id === id ? { ...block, title: newTitle } : block
    ))
    if (editingBlock && editingBlock.id === id) {
      setEditingBlock((prev: TextBlock | null) => prev ? { ...prev, title: newTitle } : null)
    }
  }

  // Редактировать блок (выбрать для редактирования)
  const handleEditBlock = (block: TextBlock) => {
    // Сохраняем изменения документа перед переключением на блок, но только если контент изменился
    if (activeDocument && !editingBlock && currentContent !== activeDocument.content) {
      const updatedDocument = {
        ...activeDocument,
        content: currentContent
      }
      setDocuments((prev: Document[]) => prev.map(doc =>
        doc.id === activeDocument.id ? updatedDocument : doc
      ))
      setActiveDocument(updatedDocument)
    }
    setEditingBlock(block)
    setCurrentContent(block.content)
  }

  // Сохранить изменения текста
  const handleContentChange = (content: string) => {
    if (content === currentContent) return; // Пропускаем если контент не изменился
    
    setCurrentContent(content)
    if (editingBlock) {
      setBlocks((prev: TextBlock[]) => prev.map(block =>
        block.id === editingBlock.id ? { ...block, content, updatedAt: new Date() } : block
      ))
      setEditingBlock(prev => prev ? { ...prev, content, updatedAt: new Date() } : null)
    } else if (activeDocument) {
      // Обновляем время документа только если контент действительно изменился
      const updatedDocument = {
        ...activeDocument,
        content,
        updatedAt: new Date()
      }
      setDocuments(prev => prev.map(doc =>
        doc.id === activeDocument.id ? updatedDocument : doc
      ))
      setActiveDocument(updatedDocument)
    }
  }

  return (
    <div className="app-layout">
      <div className="editor-container">
        <SimpleEditor
          initialContent={editingBlock?.content || activeDocument?.content || '<p>Выберите документ или создайте новый</p>'}
          onContentChange={handleContentChange}
          onFocusRequest={focusEditor > 0 ? () => setFocusEditor(0) : undefined}
        />
      </div>
      <Resizer
        onResize={handleResize}
        minWidth={250}
        maxWidth={500}
        initialWidth={sidebarWidth}
      />
      <div
        className="sidebar"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="sidebar-content">
          <Sidebar
            blocks={blocks}
            onCreateBlock={handleCreateBlock}
            onDeleteBlock={handleDeleteBlock}
            onRenameBlock={handleRenameBlock}
            onEditBlock={handleEditBlock}
            activeDocument={activeDocument}
            documents={documents}
            onSelectDocument={handleSelectDocument}
            onCreateDocument={handleCreateDocument}
            onDeleteDocument={handleDeleteDocument}
            onRenameDocument={handleRenameDocument}
            editingBlock={editingBlock}
          />
        </div>
      </div>
    </div>
  )
}

export default App
