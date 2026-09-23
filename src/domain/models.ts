export type Id = string;
export type MuscleGroup = 'chest' | 'lats' | 'upperBack' | 'frontDelts' | 'sideDelts' | 'rearDelts' | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'abs';
export type MuscleContribution = Partial<Record<MuscleGroup, number>>;
export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'band' | 'other';

export interface ExerciseDefinition { id: Id; name: string; equipment: Equipment; muscleContribution: MuscleContribution; isCustom: boolean }
export interface TemplateExercise { id: Id; exerciseId: Id; targetSets: number; targetRepMin: number; targetRepMax: number; restSeconds: number; notes: string }
export interface WorkoutTemplate { id: Id; name: string; notes: string; exercises: TemplateExercise[] }
export interface Program { id: Id; name: string; notes: string; workouts: WorkoutTemplate[]; createdAt: string; updatedAt: string }
export interface WorkoutSet { id: Id; weightKg: number | null; reps: number | null; kind: 'working' | 'warmup'; completed: boolean }
export interface WorkoutExercise { id: Id; exerciseId: Id; exerciseName: string; muscleContribution: MuscleContribution; restSeconds: number; notes: string; sets: WorkoutSet[] }
export interface RestTimerState { exerciseId: Id; afterSetId: Id; startedAt: string; endsAt: string; durationSeconds: number }
export interface GuidedWorkoutState { currentExerciseId: Id | null; currentSetId: Id | null; restTimer: RestTimerState | null }
export interface WorkoutSession { id: Id; programId: Id | null; programName: string; workoutTemplateId: Id | null; workoutName: string; startedAt: string; completedAt: string | null; notes: string; exercises: WorkoutExercise[]; guide: GuidedWorkoutState }
export interface AppDataV1 { version: 1; exercises: ExerciseDefinition[]; programs: Program[]; sessions: WorkoutSession[]; settings: { weightUnit: 'kg'; lastSelectedProgramId: Id | null; restAlertSound: boolean; restAlertVibration: boolean; keepScreenAwake: boolean } }
