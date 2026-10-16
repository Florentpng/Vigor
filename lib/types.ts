import type { MuscleGroup, Equipment } from './constants'

export type Exercise = {
  id: string
  name: string
  description: string | null
  muscle_group: MuscleGroup
  equipment: Equipment
  video_url: string | null
}

export type Workout = {
  id: string
  name: string
  description: string | null
  user_id: string | null
}

export type WorkoutExerciseInput = {
  exercise_id: string
  target_sets: number
  target_reps: number
  rest_time: number
}

export type WorkoutInput = {
  name: string
  description: string
  exercises: WorkoutExerciseInput[]
}
