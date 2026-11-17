export type Id = string;
export interface WorkoutPreferences { restAlertSound: boolean; restAlertVibration: boolean; keepScreenAwake: boolean }
export type MuscleGroup = 'chest' | 'lats' | 'upperBack' | 'frontDelts' | 'sideDelts' | 'rearDelts' | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'abs';
export type MuscleContribution = Partial<Record<MuscleGroup, number>>;
export interface MuscleRoles { direct: MuscleGroup[]; indirect: MuscleGroup[]; reviewedAt: string; source: 'forge-reviewed' | 'user' }
export type ChestEmphasis = 'upper' | 'mid' | 'mixed';
export interface TrainingCycle { slots: Array<Id | null> }
export interface MuscleSetTarget { muscle: MuscleGroup; lower: number; upper: number; basis: 'direct' | 'weighted'; period: 'cycle' | 'sevenDayAverage'; priority: 'focus' | 'maintain' }
export interface VolumePlan { goal: 'hypertrophy' | 'strength' | 'maintenance' | 'custom'; cycle?: TrainingCycle; targets: MuscleSetTarget[] }
export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'band' | 'other';

export interface ExerciseDefinition { id: Id; name: string; equipment: Equipment; muscleContribution: MuscleContribution; isCustom: boolean; muscleRoles?: MuscleRoles; chestEmphasis?: ChestEmphasis; aliases?: string[]; setupNotes?: string; unilateral?: boolean }
export interface TemplateExercise { id: Id; exerciseId: Id; targetSets: number; targetRepMin: number; targetRepMax: number; restSeconds: number; notes: string }
export interface WorkoutTemplate { id: Id; name: string; notes: string; exercises: TemplateExercise[] }
export interface Program { id: Id; name: string; notes: string; workouts: WorkoutTemplate[]; createdAt: string; updatedAt: string; volumePlan?: VolumePlan }
export interface WorkoutSet { id: Id; weightKg: number | null; reps: number | null; kind: 'working' | 'warmup'; completed: boolean }
export interface WorkoutExercise { targetRepMin?: number; targetRepMax?: number; id: Id; exerciseId: Id; exerciseName: string; muscleContribution: MuscleContribution; muscleRoles?: MuscleRoles; chestEmphasis?: ChestEmphasis; restSeconds: number; notes: string; sets: WorkoutSet[] }
export interface RestTimerState { exerciseId: Id; afterSetId: Id; startedAt: string; endsAt: string; durationSeconds: number }
export interface GuidedWorkoutState { currentExerciseId: Id | null; currentSetId: Id | null; restTimer: RestTimerState | null }
export interface WorkoutSession { id: Id; programId: Id | null; programName: string; workoutTemplateId: Id | null; workoutName: string; startedAt: string; completedAt: string | null; notes: string; exercises: WorkoutExercise[]; guide: GuidedWorkoutState }
export interface AppDataV1 { version: 1; exercises: ExerciseDefinition[]; programs: Program[]; sessions: WorkoutSession[]; settings: { weightUnit: 'kg'; lastSelectedProgramId: Id | null; restAlertSound: boolean; restAlertVibration: boolean; keepScreenAwake: boolean } }
export interface BodyProfile { estimateEligibilityConfirmed?: boolean; birthDate: string; heightCm: number; equationSex: 'female' | 'male'; activityLevel: 'sedentary' | 'light' | 'moderate' | 'veryActive'; goal: 'lose' | 'maintain' | 'gain'; targetMode: 'calculated' | 'manual' }
export interface BodyMeasurement { id: Id; recordedAt: string; localDate?: string; entryOrder?: number; weightKg: number; bodyFatPercent: number | null; waistCm: number | null; chestCm: number | null; hipsCm: number | null; upperArmCm: number | null; thighCm: number | null; notes: string }
export interface NutritionTarget { id: Id; effectiveFrom: string; mode: 'calculated' | 'manual'; caloriesKcal: number; proteinG: number; carbsG: number; fatG: number; formulaVersion: string | null }
export interface Nutrients { caloriesKcal: number; proteinG: number | null; carbsG: number | null; fatG: number | null; fiberG: number | null; sodiumMg: number | null }
export interface FoodDefinition { id: Id; name: string; brand: string | null; category: string; preparation: string; source: 'usda' | 'custom'; sourceId: string | null; dataVersion: string; nutrientsPer100g: Nutrients | null; portion?: { name: string; nutrients: Nutrients }; favorite?: boolean; archived?: boolean; servings: Array<{ name: string; grams: number }> }
export interface FoodLogEntry { id: Id; localDate: string; meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'; foodId: Id | null; foodName: string; grams: number | null; portionQuantity?: number; preparation?: string; servingDescription: string; nutrients: Nutrients; source: FoodDefinition['source']; sourceId: string | null }
export type MergeCategory = 'exercises' | 'programs' | 'sessions' | 'measurements' | 'foods' | 'diary';
export interface MergeMapping { key: string; sourceContent: string; destinationId: string; resultContent: string }
export interface MergeCounts { added: number; replaced: number; copied: number; skipped: number; linked: number }
export interface MergeReceipt { id: string; at: string; counts: MergeCounts }
export interface AppDataV4 extends Omit<AppDataV1, 'version'> { version: 4; body: { profile: BodyProfile | null; measurements: BodyMeasurement[] }; nutrition: { targets: NutritionTarget[]; customFoods: FoodDefinition[]; diary: FoodLogEntry[] }; mergeLedger?: { mappings: MergeMapping[]; receipts: MergeReceipt[] } }
// Retained as a source-level alias for existing modules; persisted documents are v4.
export type AppDataV2 = AppDataV4;
