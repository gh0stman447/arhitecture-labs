'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [me, setMe] = useState<Profile | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    async function load() {
      const headers = { Authorization: `Bearer ${token}` }

      const meRes = await fetch('/api/auth/me', { headers })
      if (!meRes.ok) { router.push('/login'); return }
      const meData = await meRes.json()
      setMe(meData)

      if (meData.role === 'admin' || meData.role === 'moderator') {
        const usersRes = await fetch('/api/users', { headers })
        if (usersRes.ok) setUsers(await usersRes.json())
      }

      setLoading(false)
    }

    load()
  }, [router])

  async function changeRole(userId: string, role: string) {
    const token = localStorage.getItem('token')
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as Profile['role'] } : u))
  }

  async function deleteUser(userId: string) {
    if (!confirm('Delete this user?')) return
    const token = localStorage.getItem('token')
    await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  function logout() {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) return <div className="p-8 text-gray-900">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-700">{me?.email} — <span className="font-semibold capitalize">{me?.role}</span></p>
          </div>
          <div className="flex gap-3">
            <a href="/dashboard/rates" className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium text-gray-800">Курсы</a>
            <a href="/dashboard/signature" className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium text-gray-800">ЭЦП</a>
            <a href="/docs" className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium text-gray-800">API Docs</a>
            <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">
              Logout
            </button>
          </div>
        </div>

        {(me?.role === 'admin' || me?.role === 'moderator') && (
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Created</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      {me?.role === 'admin' ? (
                        <select
                          value={user.role}
                          onChange={e => changeRole(user.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"
                        >
                          <option value="admin">admin</option>
                          <option value="moderator">moderator</option>
                          <option value="viewer">viewer</option>
                        </select>
                      ) : (
                        <span className="capitalize text-gray-900">{user.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 flex gap-3">
                      <a href={`/dashboard/users/${user.id}`} className="text-blue-600 text-sm font-medium hover:underline">
                        View
                      </a>
                      {me?.role === 'admin' && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={user.id === me.id}
                          className="text-red-600 text-sm font-medium hover:underline disabled:opacity-30"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {me?.role === 'viewer' && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <p className="text-gray-800">You have viewer access. Contact an admin to change your role.</p>
          </div>
        )}
      </div>
    </div>
  )
}
