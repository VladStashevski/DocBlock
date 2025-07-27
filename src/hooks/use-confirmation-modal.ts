import { useState, useCallback } from 'react'

interface ConfirmationOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const useConfirmationModal = () => {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Подтвердить',
    cancelText: 'Отменить',
    variant: 'danger',
    onConfirm: () => {},
    onCancel: () => {}
  })

  const showConfirmation = useCallback((
    options: ConfirmationOptions
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Подтвердить',
        cancelText: options.cancelText || 'Отменить',
        variant: options.variant || 'danger',
        onConfirm: () => {
          setState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setState(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }, [])

  const hideConfirmation = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }))
  }, [])

  return {
    confirmationState: state,
    showConfirmation,
    hideConfirmation
  }
}