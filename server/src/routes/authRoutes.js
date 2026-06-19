import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/register', asyncHandler(authController.register))
router.post('/login', asyncHandler(authController.login))
router.post('/logout', asyncHandler(authController.logout))
router.get('/me', requireAuth, asyncHandler(authController.me))

export default router
