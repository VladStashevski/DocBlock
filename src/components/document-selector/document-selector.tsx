import React, { useState, useCallback } from 'react'
import type { Document } from '@/types/document'
import { ConfirmationModal } from '../confirmation-modal/confirmation-modal'
import { useConfirmationModal } from '@/hooks/use-confirmation-modal'
import './document-selector.css'

interface DocumentSelectorProps {
	documents: Document[]
	activeDocumentId: string | null
	onSelectDocument: (document: Document, shouldFocus?: boolean) => void
	onCreateDocument: () => void
	onDeleteDocument: (id: string) => void
	onRenameDocument: (id: string, newTitle: string) => void
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
	documents,
	activeDocumentId,
	onSelectDocument,
	onCreateDocument,
	onDeleteDocument,
	onRenameDocument
}) => {
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editTitle, setEditTitle] = useState('')
	const [hoveredId, setHoveredId] = useState<string | null>(null)
	const [clickedId, setClickedId] = useState<string | null>(null)
	
	const { confirmationState, showConfirmation } = useConfirmationModal()

	const handleStartEdit = useCallback((doc: Document) => {
		setEditingId(doc.id)
		setEditTitle(doc.title)
	}, [])

	const handleSaveEdit = useCallback(() => {
		if (editingId && editTitle.trim()) {
			onRenameDocument(editingId, editTitle.trim())
		}
		setEditingId(null)
		setEditTitle('')
	}, [editingId, editTitle, onRenameDocument])

	const handleCancelEdit = useCallback(() => {
		setEditingId(null)
		setEditTitle('')
	}, [])

	const handleDelete = useCallback(async (doc: Document) => {
		const confirmed = await showConfirmation({
			title: 'Удаление документа',
			message: `Вы уверены, что хотите удалить документ "${doc.title}"? Все связанные блоки также будут удалены.`,
			confirmText: 'Удалить',
			cancelText: 'Отменить',
			variant: 'danger'
		})
		
		if (confirmed) {
			onDeleteDocument(doc.id)
		}
	}, [onDeleteDocument, showConfirmation])

	const handleDocumentClick = useCallback((doc: Document, e: React.MouseEvent) => {
		if (
			e.target instanceof HTMLElement &&
			(e.target.closest('.document-actions') || e.target.closest('.document-title-input'))
		) {
			return
		}

		setClickedId(doc.id)
		// Добавляем небольшую задержку для визуальной обратной связи
		setTimeout(() => {
			// Если это активный документ, фокусируемся на редакторе
			const shouldFocus = activeDocumentId === doc.id
			onSelectDocument(doc, shouldFocus)
			setClickedId(null)
		}, 100)
	}, [activeDocumentId, onSelectDocument])

	const handleDocumentKeyDown = useCallback((doc: Document, e: React.KeyboardEvent) => {
		if ((e.key === 'Enter' || e.key === ' ') && editingId !== doc.id) {
			e.preventDefault()

			setClickedId(doc.id)
			// Добавляем небольшую задержку для визуальной обратной связи
			setTimeout(() => {
				// Если это активный документ, фокусируемся на редакторе
				const shouldFocus = activeDocumentId === doc.id
				onSelectDocument(doc, shouldFocus)
				setClickedId(null)
			}, 100)
		}
	}, [activeDocumentId, onSelectDocument, editingId])

	return (
		<div className="document-selector">
			<div className="document-selector-header">
				<h3>Документы</h3>
				<button
					className="create-doc-button"
					onClick={onCreateDocument}
					title="Создать новый документ"
				>
					<PlusIcon />
				</button>
			</div>

			<div className="documents-list">
				{documents.length === 0 ? null : (
					documents.map(doc => (
						<div
							key={doc.id}
							className={`document-item ${activeDocumentId === doc.id ? 'active' : ''} ${clickedId === doc.id ? 'clicking' : ''}`}
							onClick={(e) => handleDocumentClick(doc, e)}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => handleDocumentKeyDown(doc, e)}
							onMouseEnter={() => setHoveredId(doc.id)}
							onMouseLeave={() => setHoveredId(null)}
						>
							{editingId === doc.id ? (
								<div className="document-edit">
									<input
										type="text"
										value={editTitle}
										onChange={(e) => setEditTitle(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') handleSaveEdit()
											if (e.key === 'Escape') handleCancelEdit()
										}}
										className="document-title-input"
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
								<div className="document-content">
									<div
										className="document-title"
									// hover только на тексте, но клик теперь на всём блоке
									>
										{doc.title}
									</div>
									<div className="document-actions">
										{activeDocumentId === doc.id && hoveredId === doc.id && (
											<>
												<button
													className="edit-doc-button"
													onClick={() => handleStartEdit(doc)}
													title="Переименовать"
												>
													<EditIcon />
												</button>
												<button
													className="delete-doc-button"
													onClick={() => handleDelete(doc)}
													title="Удалить"
												>
													<DeleteIcon />
												</button>
											</>
										)}
									</div>
								</div>
							)}
							<div className="document-date">
								{doc.updatedAt.toLocaleDateString('ru-RU', {
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
			
			<ConfirmationModal
				isOpen={confirmationState.isOpen}
				title={confirmationState.title}
				message={confirmationState.message}
				confirmText={confirmationState.confirmText}
				cancelText={confirmationState.cancelText}
				variant={confirmationState.variant}
				onConfirm={confirmationState.onConfirm}
				onCancel={confirmationState.onCancel}
			/>
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