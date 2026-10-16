import { createClient } from '@/lib/supabase/server'
import DeleteUserButton from './delete-button'
import RoleButton from './role-button'

export const revalidate = 0

type AdminUser = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  is_admin: boolean
  weight_kg: number | null
  workout_count: number
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : 'Jamais'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const [{ data, error }, { data: auth }, { data: isOwner }] = await Promise.all([
    supabase.rpc('admin_list_users'),
    supabase.auth.getUser(),
    supabase.rpc('is_owner'),
  ])

  const users = (data ?? []) as AdminUser[]
  const currentUserId = auth.user?.id

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Utilisateurs</h2>
        <p className="text-sm text-gray-500">
          {users.length} compte{users.length > 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error.message}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Email</th>
              <th className="p-4">Rôle</th>
              <th className="p-4">Inscription</th>
              <th className="p-4">Dernière connexion</th>
              <th className="p-4">Séances</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Aucun compte.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelf = user.id === currentUserId

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">
                      {user.email}
                      {isSelf && <span className="ml-2 text-xs text-gray-500">(toi)</span>}
                    </td>
                    <td className="p-4">
                      {user.is_admin ? (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-medium">
                          Admin
                        </span>
                      ) : (
                        <span className="text-gray-600">Utilisateur</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">{formatDate(user.created_at)}</td>
                    <td className="p-4 text-gray-600">{formatDate(user.last_sign_in_at)}</td>
                    <td className="p-4 text-gray-600">{user.workout_count}</td>
                    <td className="p-4 text-right space-x-3">
                      {isSelf ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <>
                          {isOwner === true && (
                            <RoleButton id={user.id} email={user.email} isAdmin={user.is_admin} />
                          )}
                          <DeleteUserButton id={user.id} email={user.email} />
                        </>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
