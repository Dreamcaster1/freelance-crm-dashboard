import { Router } from 'express'
import * as taskController from '../controllers/taskController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(taskController.listTasks))
router.post('/', asyncHandler(taskController.createTaskHandler))
router.get('/:id', asyncHandler(taskController.getTask))
router.patch('/:id', asyncHandler(taskController.updateTaskHandler))
router.delete('/:id', asyncHandler(taskController.deleteTaskHandler))

export default router
