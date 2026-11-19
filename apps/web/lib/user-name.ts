// Nom affiché dans le menu utilisateur, s'il est connu (connexion Google, etc.)
export function userName(metadata: Record<string, unknown> | undefined): string | undefined {
  const value = metadata?.full_name ?? metadata?.name
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
