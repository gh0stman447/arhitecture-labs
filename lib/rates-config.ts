// Configurable list of currencies to sync
export const CURRENCIES = (process.env.SYNC_CURRENCIES ?? 'USD,EUR,GBP,JPY,CHF').split(',').map(c => c.trim())

// Cron schedule (default: every day at 00:01)
export const CRON_SCHEDULE = process.env.SYNC_CRON ?? '1 0 * * *'
