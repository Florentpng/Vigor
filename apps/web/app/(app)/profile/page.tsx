import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { getIdentity } from '@vigor/shared/profile'
import EmailForm from './email-form'
import IdentityForm from './identity-form'

export const revalidate = 0

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const identity = await getIdentity(supabase, user?.id ?? '')
  // Compte créé avec Google (ou autre) : l'adresse mail dépend de ce fournisseur
  const emailManaged = (user?.app_metadata?.provider ?? 'email') !== 'email'

  return (
    <div className="space-y-6">
      <h1 className="text-4xl sm:text-5xl font-extrabold leading-none text-gray-900">Profil</h1>

      <section>
        <h2 className="mb-3 text-3xl font-bold text-gray-900">Informations</h2>
        <Card>
          <IdentityForm firstName={identity.first_name ?? ''} lastName={identity.last_name ?? ''} />
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-3xl font-bold text-gray-900">Adresse mail</h2>
        <Card>
          {emailManaged ? (
            <p className="text-sm text-gray-600">
              {user?.email} · ton compte est connecté via {String(user?.app_metadata?.provider)}, l&apos;adresse ne
              peut pas être changée ici.
            </p>
          ) : (
            <EmailForm currentEmail={user?.email ?? ''} />
          )}
        </Card>
      </section>
    </div>
  )
}
