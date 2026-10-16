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

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export type Equipment = (typeof EQUIPMENTS)[number];
