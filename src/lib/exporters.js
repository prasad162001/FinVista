function downloadBlob(filename, contents, type) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function quoteCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export function exportPlansToCsv(plans) {
  const rows = [
    ['Name', 'Type', 'Description', 'Created At'],
    ...plans.map((plan) => [plan.name, plan.type, plan.description, plan.createdAt || plan.updatedAt || '']),
  ]

  const csv = rows.map((row) => row.map(quoteCsv).join(',')).join('\n')
  downloadBlob('finvista-plans.csv', csv, 'text/csv;charset=utf-8')
}

export function exportExpensesToCsv(expensesPlan) {
  const rows = [
    ['Category', 'Monthly Amount', 'Budget'],
    ...(expensesPlan?.summary?.categories || []).map((item) => [item.label, item.amount, item.budget]),
  ]

  const csv = rows.map((row) => row.map(quoteCsv).join(',')).join('\n')
  downloadBlob('finvista-expenses.csv', csv, 'text/csv;charset=utf-8')
}

export function openPrintableReport({ title, sections }) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768')
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #172554; }
          h1 { margin-bottom: 24px; }
          section { margin-bottom: 24px; padding: 16px; border: 1px solid #dbe4f0; border-radius: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${sections
          .map(
            (section) => `
            <section>
              <h2>${section.title}</h2>
              ${section.body}
            </section>
          `,
          )
          .join('')}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

export function shareSummaryByEmail({ subject, body }) {
  const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = href
}

export async function shareSummary({ title, text, url = window.location.href }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return true
    } catch {
      return false
    }
  }

  return false
}
