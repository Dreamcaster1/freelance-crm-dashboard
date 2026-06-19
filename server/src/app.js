import cors from 'cors'
import express from 'express'
import sessionMiddleware from './config/session.js'
import { errorMiddleware } from './middleware/errorMiddleware.js'
import authRoutes from './routes/authRoutes.js'
import clientRoutes from './routes/clientRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import taskRoutes from './routes/taskRoutes.js'

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
app.use('/api/clients', clientRoutes)
app.use('/api/tasks', taskRoutes)

app.use(errorMiddleware)

export default app
