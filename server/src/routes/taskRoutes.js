import { Router } from 'express'
import * as taskController from '../controllers/taskController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', taskController.listTasks)
router.post('/', taskController.createTaskHandler)
router.get('/:id', taskController.getTask)
router.patch('/:id', taskController.updateTaskHandler)
router.delete('/:id', taskController.deleteTaskHandler)

export default router
