import cron from 'node-cron'
import { fetchDailyRates } from './cnb'
import { supabaseAdmin } from './supabase'
import { CURRENCIES, CRON_SCHEDULE } from './rates-config'

let started = false

export function startCron() {
  if (started) return
  started = true

  console.log(`[cron] Starting exchange rate sync. Schedule: "${CRON_SCHEDULE}", currencies: ${CURRENCIES.join(', ')}`)

  cron.schedule(CRON_SCHEDULE, async () => {
    console.log(`[cron] Running exchange rate sync at ${new Date().toISOString()}`)
    try {
      const rates = await fetchDailyRates(new Date())
      const filtered = rates.filter(r => CURRENCIES.includes(r.currency))

      if (filtered.length === 0) {
        console.log('[cron] No data from CNB (possibly a holiday or weekend)')
        return
      }

      const { error } = await supabaseAdmin
        .from('exchange_rates')
        .upsert(
          filtered.map(r => ({ date: r.date, currency: r.currency, amount: r.amount, rate: r.rate })),
          { onConflict: 'date,currency', ignoreDuplicates: false }
        )

      if (error) {
        console.error('[cron] Supabase error:', error.message)
      } else {
        console.log(`[cron] Synced ${filtered.length} rates`)
      }
    } catch (err) {
      console.error('[cron] Fetch error:', err)
    }
  })
}
