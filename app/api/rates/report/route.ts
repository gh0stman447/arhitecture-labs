import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * @swagger
 * /api/rates/report:
 *   get:
 *     tags: [Rates]
 *     summary: Получить отчёт по курсам валют (min/max/avg)
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *       - in: query
 *         name: currencies
 *         required: false
 *         schema:
 *           type: string
 *         description: Список валют через запятую
 *         example: "USD,EUR"
 *     responses:
 *       200:
 *         description: Отчёт с min/max/avg за 1 единицу валюты
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: object
 *                 currencies:
 *                   type: object
 *       400:
 *         description: Отсутствуют обязательные параметры
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const currenciesParam = searchParams.get('currencies')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('exchange_rates')
    .select('currency, amount, rate, date')
    .gte('date', startDate)
    .lte('date', endDate)

  if (currenciesParam) {
    const currencies = currenciesParam.split(',').map(c => c.trim())
    query = query.in('currency', currencies)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data || data.length === 0) {
    return NextResponse.json({ period: { startDate, endDate }, currencies: {} })
  }

  // Group by currency and calculate min/max/avg for 1 unit
  const grouped: Record<string, number[]> = {}
  for (const row of data) {
    const ratePerUnit = row.rate / row.amount
    if (!grouped[row.currency]) grouped[row.currency] = []
    grouped[row.currency].push(ratePerUnit)
  }

  const result: Record<string, { min: number; max: number; avg: number; days: number }> = {}
  for (const [currency, values] of Object.entries(grouped)) {
    const min = Math.min(...values)
    const max = Math.max(...values)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    result[currency] = {
      min: Math.round(min * 10000) / 10000,
      max: Math.round(max * 10000) / 10000,
      avg: Math.round(avg * 10000) / 10000,
      days: values.length,
    }
  }

  return NextResponse.json({ period: { startDate, endDate }, currencies: result })
}
