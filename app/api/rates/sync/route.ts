import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchDailyRates, fetchRatesForDateRange } from '@/lib/cnb'
import { CURRENCIES } from '@/lib/rates-config'

/**
 * @swagger
 * /api/rates/sync:
 *   post:
 *     tags: [Rates]
 *     summary: Синхронизировать курсы валют из ЧНБ
 *     description: Без тела запроса синхронизирует курсы за сегодня. С параметрами startDate/endDate — за указанный период.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-31"
 *               currencies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["USD", "EUR"]
 *     responses:
 *       200:
 *         description: Результат синхронизации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 synced:
 *                   type: integer
 *                 skipped:
 *                   type: integer
 */
export async function POST(req: NextRequest) {
  let body: { startDate?: string; endDate?: string; currencies?: string[] } = {}
  try { body = await req.json() } catch { /* no body */ }

  const currencies = body.currencies ?? CURRENCIES

  let rates
  if (body.startDate && body.endDate) {
    rates = await fetchRatesForDateRange(new Date(body.startDate), new Date(body.endDate))
  } else {
    rates = await fetchDailyRates(new Date())
  }

  // Filter by configured currencies
  const filtered = rates.filter(r => currencies.includes(r.currency))

  if (filtered.length === 0) {
    return NextResponse.json({ synced: 0, skipped: 0, message: 'No data from CNB (possibly a holiday)' })
  }

  // Upsert — skip duplicates
  const { data, error } = await supabaseAdmin
    .from('exchange_rates')
    .upsert(
      filtered.map(r => ({ date: r.date, currency: r.currency, amount: 1, rate: r.rate })),
      { onConflict: 'date,currency', ignoreDuplicates: false }
    )
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ synced: data?.length ?? 0, skipped: filtered.length - (data?.length ?? 0) })
}
