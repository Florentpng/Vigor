'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionResult = { error: string } | { ok: true }

export async function setUserRole(id: string, makeAdmin: boolean): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('admin_set_role', { target: id, make_admin: makeAdmin })
  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { ok: true }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('admin_delete_user', { target: id })
  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { ok: true }
}
