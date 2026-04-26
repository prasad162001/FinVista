import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, 'data')
const dbPath = process.env.FINVISTA_DB_PATH || path.join(dataDir, 'finvista.db')

mkdirSync(dataDir, { recursive: true })

const db = new DatabaseSync(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    inputs TEXT NOT NULL,
    summary TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`)

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all()
  const hasColumn = columns.some((item) => item.name === column)

  if (!hasColumn) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

ensureColumn('plans', 'user_id', 'TEXT')
ensureColumn('plans', 'is_demo', 'INTEGER NOT NULL DEFAULT 0')

const seedPlans = [
  {
    type: 'loan',
    name: 'Starter Home Loan',
    description: 'A baseline 20-year home loan scenario.',
    inputs: {
      name: 'Starter Home Loan',
      amount: 3200000,
      rate: 8.4,
      years: 20,
      extraPayment: 1500,
    },
    summary: {
      monthlyPayment: 29169,
      totalInterest: 3800581,
      totalPayment: 7000581,
    },
  },
  {
    type: 'insurance',
    name: 'Core Term Protection',
    description: 'Family coverage estimate with critical illness rider.',
    inputs: {
      name: 'Core Term Protection',
      age: 30,
      coverage: 7500000,
      term: 25,
      smoker: 'no',
      riders: 'critical',
    },
    summary: {
      monthlyPremium: 1406,
      annualPremium: 16877,
      totalPolicyCost: 421936,
    },
  },
  {
    type: 'sip',
    name: 'Retirement SIP',
    description: 'Long-term SIP plan with yearly step-up.',
    inputs: {
      name: 'Retirement SIP',
      monthlyContribution: 10000,
      annualReturn: 12,
      years: 18,
      stepUp: 6,
    },
    summary: {
      futureValue: 9190168,
      investedAmount: 4299576,
      wealthGain: 4890592,
    },
  },
]

function mapPlan(row) {
  return {
    _id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    description: row.description,
    inputs: JSON.parse(row.inputs),
    summary: JSON.parse(row.summary),
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapUser(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function summarizePlans(plans) {
  const summary = {
    totalPlans: plans.length,
    loanPlans: 0,
    insurancePlans: 0,
    sipPlans: 0,
    monthlyCommitment: 0,
    projectedWealth: 0,
    protectionCover: 0,
    payoffSavings: 0,
  }

  plans.forEach((plan) => {
    if (plan.type === 'loan') {
      summary.loanPlans += 1
      summary.monthlyCommitment += Number(plan.summary?.monthlyPayment) || 0
      summary.payoffSavings += Number(plan.summary?.interestSaved) || 0
    }

    if (plan.type === 'insurance') {
      summary.insurancePlans += 1
      summary.monthlyCommitment += Number(plan.summary?.monthlyPremium) || 0
      summary.protectionCover += Number(plan.inputs?.coverage) || 0
    }

    if (plan.type === 'sip') {
      summary.sipPlans += 1
      summary.monthlyCommitment += Number(plan.inputs?.monthlyContribution) || 0
      summary.projectedWealth += Number(plan.summary?.futureValue) || 0
    }
  })

  return summary
}

export async function ensureSeedData() {
  const count = db
    .prepare('SELECT COUNT(*) AS count FROM plans WHERE is_demo = 1')
    .get().count

  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO plans (id, user_id, type, name, description, inputs, summary, is_demo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const now = new Date().toISOString()

    for (const plan of seedPlans) {
      insert.run(
        randomUUID(),
        null,
        plan.type,
        plan.name,
        plan.description,
        JSON.stringify(plan.inputs),
        JSON.stringify(plan.summary),
        1,
        now,
        now,
      )
    }
  }
}

export async function listPlans(userId) {
  const rows = userId
    ? db
        .prepare('SELECT * FROM plans WHERE user_id = ? ORDER BY datetime(created_at) DESC')
        .all(userId)
    : db
        .prepare('SELECT * FROM plans WHERE is_demo = 1 ORDER BY datetime(created_at) DESC')
        .all()

  return rows.map(mapPlan)
}

export async function createPlan(plan, userId) {
  const now = new Date().toISOString()
  const id = randomUUID()

  db.prepare(`
    INSERT INTO plans (id, user_id, type, name, description, inputs, summary, is_demo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    plan.type,
    plan.name,
    plan.description,
    JSON.stringify(plan.inputs),
    JSON.stringify(plan.summary),
    0,
    now,
    now,
  )

  return {
    _id: id,
    userId,
    ...plan,
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  }
}

export async function removePlan(id, userId) {
  const result = userId
    ? db.prepare('DELETE FROM plans WHERE id = ? AND user_id = ?').run(id, userId)
    : { changes: 0 }

  return result.changes
}

export async function createUser({ name, email, passwordHash }) {
  const now = new Date().toISOString()
  const id = randomUUID()

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, email.toLowerCase(), passwordHash, now, now)

  return {
    id,
    name,
    email: email.toLowerCase(),
    createdAt: now,
    updatedAt: now,
  }
}

export async function findUserByEmail(email) {
  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase())

  return row
    ? {
        ...mapUser(row),
        passwordHash: row.password_hash,
      }
    : null
}

export async function findUserById(userId) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  return mapUser(row)
}
