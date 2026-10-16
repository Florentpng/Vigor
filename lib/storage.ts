// "https://xxx.supabase.co/storage/v1/object/public/exercise-media/exercises/a.mp4" -> "exercises/a.mp4"
export function storagePathFromUrl(url: string, bucket = 'exercise-media'): string | null {
  const marker = `/${bucket}/`
  const index = url.indexOf(marker)
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length))
}
