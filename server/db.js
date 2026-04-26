import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import mongoose from 'mongoose'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, 'data')
const sqlitePath = process.env.FINVISTA_DB_PATH || path.join(dataDir, 'finvista.db')
const mongoUri = process.env.MONGODB_URI

mkdirSync(dataDir, { recursive: true })

let sqliteDb = null
let storageMode = mongoUri ? 'mongo' : 'sqlite'

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
      interestSaved: 0,
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

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
)

const planSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null, index: true },
    type: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    inputs: { type: Object, required: true },
    summary: { type: Object, required: true },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

const UserModel = mongoose.models.FinVistaUser || mongoose.model('FinVistaUser', userSchema)
const PlanModel = mongoose.models.FinVistaPlan || mongoose.model('FinVistaPlan', planSchema)

function getSqliteDb() {
  if (sqliteDb) return sqliteDb

  sqliteDb = new DatabaseSync(sqlitePath)
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  sqliteDb.exec(`
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

  ensureSqliteColumn('plans', 'user_id', 'TEXT')
  ensureSqliteColumn('plans', 'is_demo', 'INTEGER NOT NULL DEFAULT 0')

  return sqliteDb
}

function ensureSqliteColumn(table, column, definition) {
  const db = getSqliteDb()
  const columns = db.prepare(`PRAGMA table_info(${table})`).all()
  const hasColumn = columns.some((item) => item.name === column)

  if (!hasColumn) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

function mapMongoPlan(doc) {
  return {
    _id: doc._id.toString(),
    userId: doc.userId,
    type: doc.type,
    name: doc.name,
    description: doc.description,
    inputs: doc.inputs,
    summary: doc.summary,
    isDemo: Boolean(doc.isDemo),
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
  }
}

function mapMongoUser(doc) {
  if (!doc) return null

  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
  }
}

function mapSqlitePlan(row) {
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

function mapSqliteUser(row) {
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
    pfPlans: 0,
    termPlans: 0,
    healthPlans: 0,
    propertyPlans: 0,
    taxPlans: 0,
    expensePlans: 0,
    monthlyCommitment: 0,
    monthlyDebt: 0,
    monthlyInsurance: 0,
    monthlyInvestments: 0,
    monthlyTaxes: 0,
    monthlyExpenses: 0,
    monthlyIncome: 0,
    annualExpenses: 0,
    projectedWealth: 0,
    protectionCover: 0,
    payoffSavings: 0,
    taxLiability: 0,
    taxSavings: 0,
    expenseTotal: 0,
    surplus: 0,
    savingsRate: 0,
    debtRatio: 0,
    healthScore: 0,
  }

  plans.forEach((plan) => {
    if (plan.type === 'loan') {
      summary.loanPlans += 1
      summary.monthlyDebt += Number(plan.summary?.monthlyPayment) || 0
      summary.payoffSavings += Number(plan.summary?.interestSaved) || 0
    }

    if (plan.type === 'insurance') {
      summary.insurancePlans += 1
      summary.monthlyInsurance += Number(plan.summary?.monthlyPremium) || 0
      summary.protectionCover += Number(plan.inputs?.coverage) || 0
    }

    if (plan.type === 'sip') {
      summary.sipPlans += 1
      summary.monthlyInvestments += Number(plan.inputs?.monthlyContribution) || 0
      summary.projectedWealth += Number(plan.summary?.futureValue) || 0
    }

    if (plan.type === 'pf-vpf') {
      summary.pfPlans += 1
      summary.monthlyInvestments += Number(plan.summary?.totalMonthlyContribution) || 0
      summary.projectedWealth += Number(plan.summary?.maturityAmount) || 0
    }

    if (plan.type === 'term-plan') {
      summary.termPlans += 1
      summary.monthlyInsurance += Number(plan.summary?.monthlyPremium) || 0
      summary.protectionCover += Number(plan.summary?.sumAssured) || Number(plan.inputs?.sumAssured) || 0
    }

    if (plan.type === 'health-insurance') {
      summary.healthPlans += 1
      summary.monthlyInsurance += Number(plan.summary?.monthlyPremium) || 0
      summary.protectionCover += Number(plan.summary?.totalCoverage) || 0
    }

    if (plan.type === 'property-insurance') {
      summary.propertyPlans += 1
      summary.monthlyInsurance += Number(plan.summary?.monthlyPremium) || 0
      summary.protectionCover += Number(plan.summary?.insuredValue) || 0
    }

    if (plan.type === 'tax') {
      summary.taxPlans += 1
      summary.monthlyTaxes += Number(plan.summary?.monthlyTaxProvision) || 0
      summary.taxLiability += Number(plan.summary?.taxLiability) || 0
      summary.taxSavings += Number(plan.summary?.savingsFromDeductions) || 0
    }

    if (plan.type === 'expenses') {
      summary.expensePlans += 1
      summary.monthlyExpenses += Number(plan.summary?.totalMonthlyExpenses) || 0
      summary.expenseTotal += Number(plan.summary?.totalMonthlyExpenses) || 0
      summary.annualExpenses += Number(plan.summary?.totalAnnualExpenses) || 0
      summary.monthlyIncome = Math.max(summary.monthlyIncome, Number(plan.inputs?.monthlyIncome) || 0)
    }
  })

  summary.monthlyCommitment =
    summary.monthlyDebt +
    summary.monthlyInsurance +
    summary.monthlyInvestments +
    summary.monthlyTaxes +
    summary.monthlyExpenses

  if (summary.monthlyIncome > 0) {
    summary.surplus = summary.monthlyIncome - summary.monthlyCommitment
    summary.savingsRate = summary.monthlyInvestments / summary.monthlyIncome
    summary.debtRatio = summary.monthlyDebt / summary.monthlyIncome
  }

  const annualIncome = summary.monthlyIncome * 12
  const debtComponent = Math.min(Math.max((1 - summary.debtRatio / 0.4) * 25, 0), 25)
  const savingsComponent = Math.min(Math.max((summary.savingsRate / 0.2) * 25, 0), 25)
  const coverageBase = annualIncome > 0 ? annualIncome * 10 : Math.max(summary.monthlyCommitment * 120, 1)
  const coverageComponent = Math.min(Math.max((summary.protectionCover / coverageBase) * 25, 0), 25)
  const expenseComponent =
    summary.monthlyIncome > 0
      ? Math.min(Math.max(((summary.surplus / summary.monthlyIncome) + 0.1) * 100, 0), 25)
      : summary.surplus > 0
        ? 20
        : 5

  summary.healthScore = Math.round(
    debtComponent + savingsComponent + coverageComponent + expenseComponent,
  )

  return summary
}

async function connectMongoIfNeeded() {
  if (!mongoUri) return
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  })
}

export async function ensureSeedData() {
  if (storageMode === 'mongo') {
    await connectMongoIfNeeded()
    const count = await PlanModel.countDocuments({ isDemo: true })

    if (count === 0) {
      await PlanModel.insertMany(seedPlans.map((plan) => ({ ...plan, isDemo: true })))
    }

    return
  }

  const db = getSqliteDb()
  const count = db.prepare('SELECT COUNT(*) AS count FROM plans WHERE is_demo = 1').get().count

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
  if (storageMode === 'mongo') {
    await connectMongoIfNeeded()
    const docs = userId
      ? await PlanModel.find({ userId }).sort({ createdAt: -1 }).lean()
      : await PlanModel.find({ isDemo: true }).sort({ createdAt: -1 }).lean()
    return docs.map(mapMongoPlan)
  }

  const db = getSqliteDb()
  const rows = userId
    ? db.prepare('SELECT * FROM plans WHERE user_id = ? ORDER BY datetime(created_at) DESC').all(userId)
    : db.prepare('SELECT * FROM plans WHERE is_demo = 1 ORDER BY datetime(created_at) DESC').all()

  return rows.map(mapSqlitePlan)
}

export async function createPlan(plan, userId) {
  if (storageMode === 'mongo') {
    await connectMongoIfNeeded()
    const doc = await PlanModel.create({
      userId,
      type: plan.type,
      name: plan.name,
      description: plan.description,
      inputs: plan.inputs,
      summary: plan.summary,
      isDemo: false,
    })
    return mapMongoPlan(doc)
  }

  const db = getSqliteDb()
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
  if (storageMode === 'mongo') {
    await connectMongoIfNeeded()
    const result = await PlanModel.deleteOne({ _id: id, userId })
    return result.deletedCount
  }

  const db = getSqliteDb()
  const result = userId
    ? db.prepare('DELETE FROM plans WHERE id = ? AND user_id = ?').run(id, userId)
    : { changes: 0 }

  return result.changes
}

export async function createUser({ name, email, passwordHash }) {
  if (storageMode === 'mongo') {
    await connectMongoIfNeeded()
    const doc = await UserModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    })
    return mapMongoUser(doc)
  }

  const db = getSqliteDb()
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
  if (storageMode === 'mongo') {
    await connectMongoIfNeeded()
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean()
    return doc
      ? {
          ...mapMongoUser(doc),
          passwordHash: doc.passwordHash,
        }
      : null
  }

  const db = getSqliteDb()
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase())

  return row
    ? {
        ...mapSqliteUser(row),
        passwordHash: row.password_hash,
      }
    : null
}

export async function findUserById(userId) {
  if (storageMode === 'mongo') {
    await connectMongoIfNeeded()
    const doc = await UserModel.findById(userId).lean()
    return mapMongoUser(doc)
  }

  const db = getSqliteDb()
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  return mapSqliteUser(row)
}

export function getStorageMode() {
  return storageMode
}
