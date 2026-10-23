import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
}))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant API is running',
    timestamp: new Date().toISOString(),
  })
})

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`)
})
