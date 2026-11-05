// MET de la musculation (effort modéré) : valeur de référence du Compendium of Physical Activities.
export const STRENGTH_TRAINING_MET = 5

// kcal = MET × poids (kg) × durée (h)
export function computeCalories(weightKg: number, durationSeconds: number): number {
  return Math.round(STRENGTH_TRAINING_MET * weightKg * (durationSeconds / 3600))
}
