'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Profile } from '@/lib/supabase'

export default function UserDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<Profile | null>(null)
  const [me, setMe] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    async function load() {
      const headers = { Authorization: `Bearer ${token}` }

      const meRes = await fetch('/api/auth/me', { headers })
      if (!meRes.ok) { router.push('/login'); return }
      const meData = await meRes.json()
      setMe(meData)

      // GET /api/users/[id]
      const res = await fetch(`/api/users/${id}`, { headers })
      if (!res.ok) { setError('User not found'); setLoading(false); return }
      const data = await res.json()
      setUser(data)
      setSelectedRole(data.role)
      setLoading(false)
    }

    load()
  }, [id, router])

  async function handleRoleUpdate() {
    setSaving(true)
    setSuccess('')
    const token = localStorage.getItem('token')
    // PATCH /api/users/[id]
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: selectedRole }),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      setUser(updated)
      setSuccess('Role updated successfully')
    } else {
      const data = await res.json()
      setError(data.error)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this user?')) return
    const token = localStorage.getItem('token')
    // DELETE /api/users/[id]
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) router.push('/dashboard')
    else {
      const data = await res.json()
      setError(data.error)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error && !user) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-bold mb-6">User Details</h1>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500 font-medium">ID</span>
              <span className="font-mono text-xs break-all">{user?.id}</span>

              <span className="text-gray-500 font-medium">Email</span>
              <span>{user?.email}</span>

              <span className="text-gray-500 font-medium">Role</span>
              <span className="capitalize">{user?.role}</span>

              <span className="text-gray-500 font-medium">Created at</span>
              <span>{user && new Date(user.created_at).toLocaleString()}</span>

              <span className="text-gray-500 font-medium">Updated at</span>
              <span>{user && new Date(user.updated_at).toLocaleString()}</span>
            </div>

            {me?.role === 'admin' && user?.id !== me.id && (
              <>
                <hr className="my-4" />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Change Role
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value)}
                      className="border rounded px-3 py-2 text-sm"
                    >
                      <option value="admin">admin</option>
                      <option value="moderator">moderator</option>
                      <option value="viewer">viewer</option>
                    </select>
                    <button
                      onClick={handleRoleUpdate}
                      disabled={saving || selectedRole === user?.role}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {success && <p className="mt-2 text-green-600 text-sm">{success}</p>}
                  {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
                </div>

                <hr className="my-4" />

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Delete User
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
