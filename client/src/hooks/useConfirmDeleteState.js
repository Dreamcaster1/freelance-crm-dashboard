import { useState } from 'react'

export default function useConfirmDeleteState() {
  const [deletingItem, setDeletingItem] = useState(null)

  function openDelete(item) {
    setDeletingItem(item)
  }

  function closeDelete() {
    setDeletingItem(null)
  }

  return {
    deletingItem,
    openDelete,
    closeDelete,
  }
}
