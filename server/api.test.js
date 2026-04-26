import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'

const tempDir = mkdtempSync(path.join(tmpdir(), 'finvista-test-'))
process.env.FINVISTA_DB_PATH = path.join(tempDir, 'finvista.test.db')
process.env.JWT_SECRET = 'test-secret'

const serverModule = await import(pathToFileURL(path.resolve('server/index.js')).href)
const { createApp } = serverModule
const { ensureSeedData } = await import(pathToFileURL(path.resolve('server/db.js')).href)

function createJsonRequest(server) {
  return async function json(pathname, options = {}) {
    const address = server.address()
    const url = `http://127.0.0.1:${address.port}${pathname}`
    const response = await fetch(url, options)
    const body = await response.json()
    return { response, body }
  }
}

test('auth and plan API flows work end-to-end', async () => {
  await ensureSeedData()
  const app = createApp()
  const server = app.listen(0)
  const json = createJsonRequest(server)

  try {
    const health = await json('/api/health')
    assert.equal(health.response.status, 200)
    assert.equal(health.body.ok, true)

    const register = await json('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test.user@example.com',
        password: 'secret123',
      }),
    })

    assert.equal(register.response.status, 201)
    assert.ok(register.body.token)

    const duplicate = await json('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test.user@example.com',
        password: 'secret123',
      }),
    })

    assert.equal(duplicate.response.status, 409)

    const badPassword = await json('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tiny',
        email: 'tiny@example.com',
        password: '123',
      }),
    })

    assert.equal(badPassword.response.status, 400)

    const me = await json('/api/auth/me', {
      headers: { Authorization: `Bearer ${register.body.token}` },
    })

    assert.equal(me.response.status, 200)
    assert.equal(me.body.user.email, 'test.user@example.com')

    const create = await json('/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${register.body.token}`,
      },
      body: JSON.stringify({
        type: 'loan',
        name: 'My Loan Plan',
        description: 'Testing plan creation',
        inputs: { amount: 1000000, rate: 9, years: 10, extraPayment: 0 },
        summary: { monthlyPayment: 12668, totalInterest: 520160, interestSaved: 0 },
      }),
    })

    assert.equal(create.response.status, 201)
    assert.equal(create.body.plan.name, 'My Loan Plan')

    const pfPlan = await json('/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${register.body.token}`,
      },
      body: JSON.stringify({
        type: 'pf-vpf',
        name: 'PF Test Plan',
        description: 'Testing PF creation',
        inputs: { monthlyContribution: 15000, contributionDay: 5 },
        summary: { totalMonthlyContribution: 18000, maturityAmount: 3200000 },
      }),
    })

    assert.equal(pfPlan.response.status, 201)
    assert.equal(pfPlan.body.plan.type, 'pf-vpf')

    const plans = await json('/api/plans', {
      headers: { Authorization: `Bearer ${register.body.token}` },
    })

    assert.equal(plans.response.status, 200)
    assert.equal(plans.body.plans.length, 2)

    const dashboard = await json('/api/dashboard', {
      headers: { Authorization: `Bearer ${register.body.token}` },
    })

    assert.equal(dashboard.response.status, 200)
    assert.equal(dashboard.body.summary.loanPlans, 1)
    assert.equal(dashboard.body.summary.monthlyCommitment, 30668)

    const unauthorizedPlans = await json('/api/plans')
    assert.equal(unauthorizedPlans.response.status, 401)

    const invalidType = await json('/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${register.body.token}`,
      },
      body: JSON.stringify({
        type: 'budget',
        name: 'Invalid',
        description: 'Bad type',
        inputs: { foo: 1 },
        summary: { foo: 1 },
      }),
    })

    assert.equal(invalidType.response.status, 400)

    const invalidInputs = await json('/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${register.body.token}`,
      },
      body: JSON.stringify({
        type: 'loan',
        name: 'Bad Inputs',
        description: 'Inputs should be an object',
        inputs: ['not', 'valid'],
        summary: { monthlyPayment: 1200 },
      }),
    })

    assert.equal(invalidInputs.response.status, 400)
    assert.equal(invalidInputs.body.message, 'Plan inputs must be a valid object.')

    const invalidSummary = await json('/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${register.body.token}`,
      },
      body: JSON.stringify({
        type: 'loan',
        name: 'Bad Summary',
        description: 'Summary should be an object',
        inputs: { amount: 100000 },
        summary: ['not', 'valid'],
      }),
    })

    assert.equal(invalidSummary.response.status, 400)
    assert.equal(invalidSummary.body.message, 'Plan summary must be a valid object.')

    const invalidTokenSave = await json('/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer not-a-real-token',
      },
      body: JSON.stringify({
        type: 'loan',
        name: 'Unauthorized Save',
        description: 'Should not save',
        inputs: { amount: 1000000, rate: 9, years: 10, extraPayment: 0 },
        summary: { monthlyPayment: 12668, totalInterest: 520160, interestSaved: 0 },
      }),
    })

    assert.equal(invalidTokenSave.response.status, 401)
    assert.equal(invalidTokenSave.body.message, 'Invalid or expired session.')

    const removed = await json(`/api/plans/${create.body.plan._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${register.body.token}` },
    })

    assert.equal(removed.response.status, 200)
    assert.equal(removed.body.ok, true)
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }
})
