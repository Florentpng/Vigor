// Supersets : des exercices consécutifs « liés » (linked_to_previous) forment un groupe.
// On enchaîne tous les exercices du groupe, puis on se repose ; le repos du groupe est celui du dernier.

// Regroupe les exercices : un exercice lié rejoint le groupe de l'exercice précédent.
export function groupSupersets<T extends { linked_to_previous: boolean }>(items: T[]): T[][] {
  const groups: T[][] = []
  items.forEach((item, index) => {
    if (index > 0 && item.linked_to_previous) groups[groups.length - 1].push(item)
    else groups.push([item])
  })
  return groups
}

// Nombre de séries du groupe (les exercices d'un superset ont tous le même)
export function groupSets(group: { target_sets: number }[]): number {
  return group[0].target_sets
}

// Repos après chaque tour du groupe : celui de son dernier exercice
export function groupRest(group: { rest_time: number }[]): number {
  return group[group.length - 1].rest_time
}

// Répétitions d'un groupe : « 8 » si elles sont identiques, sinon « 10 / 8 » dans l'ordre des exercices
export function groupRepsLabel(group: { target_reps: number | null }[]): string {
  const labels = group.map((e) => (e.target_reps === null ? 'max' : String(e.target_reps)))
  return labels.every((label) => label === labels[0]) ? labels[0] : labels.join(' / ')
}

export const SUPERSET_SETS_ERROR = "Les exercices d'un superset doivent avoir le même nombre de séries."
