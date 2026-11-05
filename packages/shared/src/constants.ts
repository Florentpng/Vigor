export const MUSCLE_GROUPS = [
  "PECTORAUX",
  "GRAND_DORSAL",
  "TRAPEZES",
  "LOMBAIRES",
  "EPAULES",
  "BICEPS",
  "TRICEPS",
  "QUADRICEPS",
  "ISCHIOS",
  "FESSIERS",
  "MOLLETS",
  "ABDOMINAUX",
] as const;

export const EQUIPMENTS = [
  "HALTERES",
  "BARRE",
  "MACHINE",
  "PDC",
  "POULIE",
] as const;

// 1 = lundi ... 7 = dimanche (même convention que weekly_plan.weekday)
export const WEEKDAYS = [
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
  { value: 7, label: "Dimanche", short: "Dim" },
] as const;

export type MuscleGroup =(typeof MUSCLE_GROUPS)[number];
export type Equipment = (typeof EQUIPMENTS)[number];
