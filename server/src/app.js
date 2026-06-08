import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import healthRoutes from './routes/healthRoutes.js'

dotenv.config()

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())

app.use('/api/health', healthRoutes)

export default app
