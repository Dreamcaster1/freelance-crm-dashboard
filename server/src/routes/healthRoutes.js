import { Router } from 'express'
import pool from '../config/db.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'clientflow-api',
    timestamp: new Date().toISOString(),
  })
})

router.get('/db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok')
    res.json({
      ok: true,
      database: 'connected',
      result: rows[0],
    })
  } catch (error) {
    res.status(503).json({
      ok: false,
      database: 'disconnected',
      error: error.message,
    })
  }
})

export default router
