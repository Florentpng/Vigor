'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ErrorMessage, Input, Label, Select, Textarea } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { MUSCLE_GROUPS, EQUIPMENTS, type MuscleGroup, type Equipment } from '@vigor/shared/constants'
import type { Exercise } from '@vigor/shared/types'
import { storagePathFromUrl } from '@/lib/storage'

const BUCKET = 'exercise-media'

export default function ExerciseForm({ exercise }: { exercise?: Exercise }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [formData, setFormData] = useState<{
    name: string
    description: string
    muscle_group: MuscleGroup
    equipment: Equipment
  }>({
    name: exercise?.name ?? '',
    description: exercise?.description ?? '',
    muscle_group: exercise?.muscle_group ?? MUSCLE_GROUPS[0],
    equipment: exercise?.equipment ?? EQUIPMENTS[0],
  })
  const [file, setFile] = useState<File | null>(null)

  const currentUrl = exercise?.video_url ?? null
  const isGif = currentUrl?.toLowerCase().endsWith('.gif') ?? false

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    let uploadedPath: string | null = null

    try {
      let videoUrl = currentUrl

      // 1. Upload du nouveau média dans le bucket exercise-media
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `exercises/${fileName}`

        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file)
        if (uploadError) throw uploadError
        uploadedPath = filePath

        videoUrl = supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl
      }

      // 2. Création ou mise à jour de l'exercice
      const values = {
        name: formData.name,
        description: formData.description,
        muscle_group: formData.muscle_group,
        equipment: formData.equipment,
        video_url: videoUrl,
      }

      const { error: saveError } = exercise
        ? await supabase.from('exercises').update(values).eq('id', exercise.id)
        : await supabase.from('exercises').insert(values)
      if (saveError) throw saveError

      // 3. Le remplacement a réussi : on supprime l'ancien média du bucket
      if (file && currentUrl) {
        const oldPath = storagePathFromUrl(currentUrl)
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath])
      }

      router.push('/admin/exercises')
      router.refresh()
    } catch (err: unknown) {
      // L'enregistrement a échoué : on retire le fichier envoyé pour ne pas laisser d'orphelin
      if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath])

      const message =
        err && typeof err === 'object' && 'message' in err ? String(err.message) : ''
      setErrorMsg(
        message.includes('duplicate key')
          ? 'Un exercice porte déjà ce nom.'
          : message || 'Une erreur est survenue.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto glass p-8 rounded-xl shadow-sm border">
      <h2 className="text-3xl sm:text-4xl font-extrabold leading-none mb-6 text-gray-900">
        {exercise ? 'Modifier l’exercice' : 'Ajouter un exercice'}
      </h2>

      {errorMsg && (
        <div className="mb-4">
          <ErrorMessage>{errorMsg}</ErrorMessage>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name">Nom de l&apos;exercice *</Label>
          <Input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Développé couché à la barre"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="muscle_group">Groupe Musculaire</Label>
            <Select
              id="muscle_group"
              value={formData.muscle_group}
              onChange={(e) =>
                setFormData({ ...formData, muscle_group: e.target.value as MuscleGroup })
              }
            >
              {MUSCLE_GROUPS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="equipment">Équipement</Label>
            <Select
              id="equipment"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value as Equipment })}
            >
              {EQUIPMENTS.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description / Instructions</Label>
          <Textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Consignes d'exécution..."
          />
        </div>

        <div>
          <p id="media-label" className="block text-sm font-medium text-gray-700 mb-1">
            Média de démonstration (Vidéo MP4 ou GIF)
          </p>

          {currentUrl && (
            <div className="mb-3">
              {isGif ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUrl} alt={formData.name} className="max-h-48 rounded-lg border" />
              ) : (
                <video src={currentUrl} controls className="max-h-48 rounded-lg border" />
              )}
              <p className="mt-1 text-xs text-gray-500">
                Média actuel : {currentUrl.split('/').pop()}. Choisis un fichier ci-dessous pour le
                remplacer, sinon il est conservé.
              </p>
            </div>
          )}

          <input
            id="media"
            aria-labelledby="media-label"
            type="file"
            accept="video/*,image/gif"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-fit max-w-full cursor-pointer text-sm text-gray-500 file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => router.push('/admin/exercises')}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : exercise ? 'Enregistrer' : 'Créer l’exercice'}
          </Button>
        </div>
      </form>
    </div>
  )
}
