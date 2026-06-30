import { Router } from 'express'
import * as activityController from '../controllers/activityController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.get('/recent', asyncHandler(activityController.listRecentActivity))

export default router
