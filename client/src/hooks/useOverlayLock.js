import { useEffect } from 'react'

let lockCount = 0
let previousOverflow = ''

function lockBody() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

function unlockBody() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow
  }
}

export default function useOverlayLock(isActive) {
  useEffect(() => {
    if (!isActive) return undefined

    lockBody()

    return () => {
      unlockBody()
    }
  }, [isActive])
}
