import { Router } from 'express'
import * as clientController from '../controllers/clientController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', clientController.listClients)
router.post('/', clientController.createClientHandler)
router.get('/:id', clientController.getClient)
router.patch('/:id', clientController.updateClientHandler)
router.delete('/:id', clientController.deleteClientHandler)

export default router
