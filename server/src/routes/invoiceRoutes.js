import { Router } from 'express'
import * as invoiceController from '../controllers/invoiceController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(invoiceController.listInvoices))
router.post('/', asyncHandler(invoiceController.createInvoiceHandler))
router.post('/:id/mark-sent', asyncHandler(invoiceController.markInvoiceSentHandler))
router.post('/:id/mark-paid', asyncHandler(invoiceController.markInvoicePaidHandler))
router.get('/:id', asyncHandler(invoiceController.getInvoice))
router.patch('/:id', asyncHandler(invoiceController.updateInvoiceHandler))
router.delete('/:id', asyncHandler(invoiceController.deleteInvoiceHandler))

export default router
