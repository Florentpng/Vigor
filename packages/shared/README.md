# @vigor/shared

Code commun au web (`apps/web`) et au mobile (`apps/mobile`) : types, constantes, calcul des calories, formatage, lecture des séances, et les actions utilisateur (`logs`, `profile`, `my-workouts`, `planning`) qui reçoivent le client Supabase en paramètre.

Règle : rien de spécifique à une plateforme ici (pas de `next/*`, `react-native`, DOM, `localStorage`…).

Import : `import { formatDuration } from '@vigor/shared/format'`
