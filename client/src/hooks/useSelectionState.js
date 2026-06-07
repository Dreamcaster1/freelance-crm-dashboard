import { useState } from 'react'

export default function useSelectionState() {
  const [selectedItem, setSelectedItem] = useState(null)

  function openSelection(item) {
    setSelectedItem(item)
  }

  function closeSelection() {
    setSelectedItem(null)
  }

  return {
    selectedItem,
    setSelectedItem,
    openSelection,
    closeSelection,
  }
}
