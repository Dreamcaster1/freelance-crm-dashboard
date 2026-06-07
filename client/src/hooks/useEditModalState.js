import { useState } from 'react'

export default function useEditModalState() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  function openAdd() {
    setEditingItem(null)
    setIsOpen(true)
  }

  function openEdit(item) {
    setEditingItem(item)
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
    setEditingItem(null)
  }

  return {
    isOpen,
    editingItem,
    openAdd,
    openEdit,
    close,
  }
}
