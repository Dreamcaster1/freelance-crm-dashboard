import cors from 'cors'
import express from 'express'
import sessionMiddleware from './config/session.js'
import authRoutes from './routes/authRoutes.js'
import healthRoutes from './routes/healthRoutes.js'

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())
app.use(sessionMiddleware)

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)

export default app
