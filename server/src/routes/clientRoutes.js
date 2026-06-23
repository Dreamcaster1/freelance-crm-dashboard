import { Router } from 'express'
import * as clientController from '../controllers/clientController.js'
import * as clientNoteController from '../controllers/clientNoteController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(clientController.listClients))
router.post('/', asyncHandler(clientController.createClientHandler))
router.get('/:id/notes', asyncHandler(clientNoteController.listClientNotes))
router.post('/:id/notes', asyncHandler(clientNoteController.createClientNoteHandler))
router.delete(
  '/:id/notes/:noteId',
  asyncHandler(clientNoteController.deleteClientNoteHandler),
)
router.get('/:id', asyncHandler(clientController.getClient))
router.patch('/:id', asyncHandler(clientController.updateClientHandler))
router.delete('/:id', asyncHandler(clientController.deleteClientHandler))

export default router
