'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ReportEntry {
  min: number
  max: number
  avg: number
  days: number
}

export default function RatesPage() {
  const router = useRouter()

  // Sync state
  const [syncStart, setSyncStart] = useState('2024-01-01')
  const [syncEnd, setSyncEnd] = useState('2024-01-31')
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number; skipped: number; message?: string } | null>(null)

  // Report state
  const [reportStart, setReportStart] = useState('2024-01-01')
  const [reportEnd, setReportEnd] = useState('2024-01-31')
  const [reportCurrencies, setReportCurrencies] = useState('USD,EUR,GBP')
  const [reportLoading, setReportLoading] = useState(false)
  const [report, setReport] = useState<{ period: { startDate: string; endDate: string }; currencies: Record<string, ReportEntry> } | null>(null)

  async function syncToday() {
    setSyncLoading(true)
    setSyncResult(null)
    const res = await fetch('/api/rates/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    setSyncResult(await res.json())
    setSyncLoading(false)
  }

  async function syncPeriod() {
    setSyncLoading(true)
    setSyncResult(null)
    const res = await fetch('/api/rates/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: syncStart, endDate: syncEnd }),
    })
    setSyncResult(await res.json())
    setSyncLoading(false)
  }

  async function fetchReport() {
    setReportLoading(true)
    setReport(null)
    const params = new URLSearchParams({ startDate: reportStart, endDate: reportEnd, currencies: reportCurrencies })
    const res = await fetch(`/api/rates/report?${params}`)
    setReport(await res.json())
    setReportLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </button>
          <h1 className="text-2xl font-bold">Exchange Rates (ЧНБ)</h1>
        </div>

        {/* Sync */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Sync from CNB</h2>

          <button
            onClick={syncToday}
            disabled={syncLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {syncLoading ? 'Syncing...' : 'Sync Today'}
          </button>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Sync date range</p>
            <div className="flex gap-2 items-center flex-wrap">
              <input type="date" value={syncStart} onChange={e => setSyncStart(e.target.value)}
                className="border rounded px-3 py-2 text-sm" />
              <span className="text-gray-500 text-sm">—</span>
              <input type="date" value={syncEnd} onChange={e => setSyncEnd(e.target.value)}
                className="border rounded px-3 py-2 text-sm" />
              <button
                onClick={syncPeriod}
                disabled={syncLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {syncLoading ? 'Syncing...' : 'Sync Period'}
              </button>
            </div>
          </div>

          {syncResult && (
            <div className="p-3 bg-green-50 text-green-800 rounded text-sm">
              {syncResult.message ?? `Synced: ${syncResult.synced}, Skipped: ${syncResult.skipped}`}
            </div>
          )}
        </div>

        {/* Report */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Report — min/max/avg per currency</h2>

          <div className="space-y-3">
            <div className="flex gap-2 items-center flex-wrap">
              <input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)}
                className="border rounded px-3 py-2 text-sm" />
              <span className="text-gray-500 text-sm">—</span>
              <input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)}
                className="border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currencies (comma-separated)</label>
              <input
                value={reportCurrencies}
                onChange={e => setReportCurrencies(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
                placeholder="USD,EUR,GBP"
              />
            </div>
            <button
              onClick={fetchReport}
              disabled={reportLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {reportLoading ? 'Loading...' : 'Get Report'}
            </button>
          </div>

          {report && (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Period: {report.period.startDate} — {report.period.endDate}
              </p>
              {Object.keys(report.currencies).length === 0 ? (
                <p className="text-sm text-gray-500">No data for selected period. Sync first.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Currency</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Min (CZK)</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Max (CZK)</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Avg (CZK)</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(report.currencies).map(([currency, data]) => (
                      <tr key={currency}>
                        <td className="px-3 py-2 font-medium">{currency}</td>
                        <td className="px-3 py-2 text-right">{data.min}</td>
                        <td className="px-3 py-2 text-right">{data.max}</td>
                        <td className="px-3 py-2 text-right">{data.avg}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{data.days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
