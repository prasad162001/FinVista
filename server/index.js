import cors from 'cors'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import {
  createPlan,
  createUser,
  ensureSeedData,
  findUserByEmail,
  findUserById,
  listPlans,
  removePlan,
  summarizePlans,
} from './db.js'

const defaultPort = Number(process.env.PORT) || 4000
const jwtSecret = process.env.JWT_SECRET || 'finvista-dev-secret'
const allowedPlanTypes = new Set([
  'loan',
  'insurance',
  'sip',
  'pf-vpf',
  'term-plan',
  'health-insurance',
  'property-insurance',
  'tax',
  'expenses',
])
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizePlanPayload(payload) {
  const { type, name, description, inputs, summary } = payload || {}

  if (!type || !name || !inputs || !summary) {
    return {
      error: 'Plan type, name, inputs, and summary are required.',
      status: 400,
    }
  }

  if (!allowedPlanTypes.has(type)) {
    return {
      error: 'Unsupported plan type.',
      status: 400,
    }
  }

  const normalizedName = String(name).trim()

  if (normalizedName.length < 2) {
    return {
      error: 'Plan name must be at least 2 characters long.',
      status: 400,
    }
  }

  if (!isPlainObject(inputs)) {
    return {
      error: 'Plan inputs must be a valid object.',
      status: 400,
    }
  }

  if (!isPlainObject(summary)) {
    return {
      error: 'Plan summary must be a valid object.',
      status: 400,
    }
  }

  return {
    value: {
      type,
      name: normalizedName,
      description: String(description || 'Saved financial scenario').trim() || 'Saved financial scenario',
      inputs,
      summary,
    },
  }
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: '7d' },
  )
}

async function authMiddleware(request, response, next) {
  const authHeader = request.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Authentication required.' })
    return
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const payload = jwt.verify(token, jwtSecret)
    const user = await findUserById(payload.sub)

    if (!user) {
      response.status(401).json({ message: 'User not found.' })
      return
    }

    request.user = user
    next()
  } catch {
    response.status(401).json({ message: 'Invalid or expired session.' })
  }
}

function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.static('dist'))

  app.get('/', (_request, response) => {
    response.sendFile(path.join(process.cwd(), 'dist', 'index.html'))
  })

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, app: 'FinVista API' })
  })

  app.post('/api/auth/register', async (request, response) => {
    const { name, email, password } = request.body || {}

    if (!name || !email || !password) {
      response.status(400).json({ message: 'Name, email, and password are required.' })
      return
    }

    if (name.trim().length < 2) {
      response.status(400).json({ message: 'Name must be at least 2 characters long.' })
      return
    }

    if (!emailPattern.test(email)) {
      response.status(400).json({ message: 'Enter a valid email address.' })
      return
    }

    if (String(password).length < 6) {
      response.status(400).json({ message: 'Password must be at least 6 characters long.' })
      return
    }

    const existingUser = await findUserByEmail(email)

    if (existingUser) {
      response.status(409).json({ message: 'An account with this email already exists.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
    })
    const token = signToken(user)

    response.status(201).json({ user, token })
  })

  app.post('/api/auth/login', async (request, response) => {
    const { email, password } = request.body || {}

    if (!email || !password) {
      response.status(400).json({ message: 'Email and password are required.' })
      return
    }

    const user = await findUserByEmail(email.trim().toLowerCase())

    if (!user) {
      response.status(401).json({ message: 'Invalid email or password.' })
      return
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
      response.status(401).json({ message: 'Invalid email or password.' })
      return
    }

    const token = signToken(user)

    response.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  })

  app.get('/api/auth/me', authMiddleware, async (request, response) => {
    response.json({ user: request.user })
  })

  app.get('/api/dashboard', authMiddleware, async (request, response) => {
    const plans = await listPlans(request.user.id)
    const summary = summarizePlans(plans)

    response.json({ summary })
  })

  app.get('/api/plans', authMiddleware, async (request, response) => {
    const plans = await listPlans(request.user.id)
    response.json({ plans })
  })

  app.post('/api/plans', authMiddleware, async (request, response) => {
    const normalized = normalizePlanPayload(request.body)

    if (normalized.error) {
      response.status(normalized.status).json({ message: normalized.error })
      return
    }

    try {
      const plan = await createPlan(normalized.value, request.user.id)
      response.status(201).json({ plan })
    } catch (error) {
      console.error('Failed to save plan', {
        message: error.message,
        userId: request.user.id,
        type: normalized.value.type,
      })

      response.status(500).json({
        message: 'We could not save this plan right now. Please try again in a moment.',
      })
    }
  })

  app.delete('/api/plans/:id', authMiddleware, async (request, response) => {
    const removed = await removePlan(request.params.id, request.user.id)

    if (!removed) {
      response.status(404).json({ message: 'Plan not found.' })
      return
    }

    response.json({ ok: true })
  })

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'))
  })

  return app
}

const app = createApp()

async function start(port = defaultPort) {
  await ensureSeedData()

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Finance API running at http://localhost:${port}`)
      resolve(server)
    })
  })
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  await start()
}

export { app, createApp, start }
