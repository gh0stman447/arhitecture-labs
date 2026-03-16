import { NextRequest } from 'next/server'
import { supabaseAdmin, UserRole, Profile } from './supabase'

export async function getAuthUser(req: NextRequest): Promise<Profile | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile ?? null
}

export function requireRole(userRole: UserRole, ...allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}
