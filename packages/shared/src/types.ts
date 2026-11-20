import type { MuscleGroup, Equipment } from './constants'

export type Exercise = {
  id: string
  name: string
  description: string | null
  muscle_group: MuscleGroup
  equipment: Equipment
  video_url: string | null
  thumbnail_url: string | null
}

export type Workout = {
  id: string
  name: string
  description: string | null
  user_id: string | null
}

export type SessionExercise = {
  name: string
  description: string | null
  muscle_group: string
  equipment: string
  video_url: string | null
  thumbnail_url: string | null
  target_sets: number
  target_reps: number | null
  rest_time: number
  // Enchaîné avec l'exercice précédent (superset) : même tour, sans repos entre les deux
  linked_to_previous: boolean
}

export type SessionWorkout = {
  id: string
  name: string
  description: string | null
  user_id: string | null
  exercises: SessionExercise[]
}

export type WorkoutExerciseInput = {
  exercise_id: string
  target_sets: number
  target_reps: number | null
  rest_time: number
  linked_to_previous: boolean
}

export type WorkoutInput = {
  name: string
  description: string
  exercises: WorkoutExerciseInput[]
}
