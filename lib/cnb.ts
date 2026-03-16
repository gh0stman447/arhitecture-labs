// Czech National Bank exchange rate parser

export interface ExchangeRate {
  date: string      // YYYY-MM-DD
  currency: string  // e.g. USD, EUR
  amount: number    // CNB sometimes uses 100 units
  rate: number      // rate in CZK per 1 unit
}

function toIsoDate(cnbDate: string): string {
  const [d, m, y] = cnbDate.split('.')
  return `${y}-${m}-${d}`
}

// Yearly format:
// Date|1 AUD|1 BGN|...|1 USD|...
// 02.01.2024|15.278|12.621|...|22.526|...
function parseYearlyText(text: string): ExchangeRate[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  // Parse header: "1 AUD", "100 JPY", etc.
  const headers = lines[0].split('|').slice(1) // skip "Date" column
  const columns: { currency: string; amount: number }[] = headers.map(h => {
    const parts = h.trim().split(' ')
    return { amount: parseInt(parts[0]), currency: parts[1] }
  })

  const rates: ExchangeRate[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const parts = line.split('|')
    if (parts.length < 2) continue

    const date = toIsoDate(parts[0].trim())
    for (let j = 0; j < columns.length; j++) {
      const rateStr = parts[j + 1]?.trim().replace(',', '.')
      if (!rateStr) continue
      const rawRate = parseFloat(rateStr)
      if (isNaN(rawRate)) continue

      rates.push({
        date,
        currency: columns[j].currency,
        amount: columns[j].amount,
        rate: rawRate / columns[j].amount, // normalize to 1 unit
      })
    }
  }

  return rates
}

// Daily format:
// 17 Mar 2026 #55
// Country|Currency|Amount|Code|Rate
// Australia|dollar|1|AUD|14.728
function parseDailyText(text: string): ExchangeRate[] {
  const lines = text.trim().split('\n')
  if (lines.length < 3) return []

  // Extract date from first line
  const dateMatch = lines[0].match(/(\d{2})\s+\w+\s+(\d{4})/)
  let date = ''
  if (dateMatch) {
    const fullDate = new Date(lines[0].split('#')[0].trim())
    date = fullDate.toISOString().slice(0, 10)
  }

  const rates: ExchangeRate[] = []
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const parts = line.split('|')
    if (parts.length < 5) continue

    const amount = parseInt(parts[2])
    const currency = parts[3].trim()
    const rateStr = parts[4].trim().replace(',', '.')
    const rawRate = parseFloat(rateStr)

    if (!currency || isNaN(amount) || isNaN(rawRate)) continue

    rates.push({ date, currency, amount, rate: rawRate / amount })
  }

  return rates
}

export async function fetchDailyRates(date: Date): Promise<ExchangeRate[]> {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  const url = `https://www.cnb.cz/en/financial_markets/foreign_exchange_market/exchange_rate_fixing/daily.txt?date=${d}.${m}.${y}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return []
  return parseDailyText(await res.text())
}

export async function fetchRatesForDateRange(
  startDate: Date,
  endDate: Date
): Promise<ExchangeRate[]> {
  const years = new Set<number>()
  const cur = new Date(startDate)
  while (cur <= endDate) {
    years.add(cur.getFullYear())
    cur.setFullYear(cur.getFullYear() + 1)
  }

  const allRates: ExchangeRate[] = []
  for (const year of years) {
    const url = `https://www.cnb.cz/en/financial_markets/foreign_exchange_market/exchange_rate_fixing/year.txt?year=${year}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) continue
    const rates = parseYearlyText(await res.text())
    allRates.push(...rates)
  }

  const start = startDate.toISOString().slice(0, 10)
  const end = endDate.toISOString().slice(0, 10)
  return allRates.filter(r => r.date >= start && r.date <= end)
}
