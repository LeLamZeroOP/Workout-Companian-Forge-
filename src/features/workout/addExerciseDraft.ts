import { defaultAddExerciseOptions, type AddExerciseOptions, type AddExercisePosition } from '../../domain/sessionEditing';

/** Editable text for the add-exercise choices; numbers are parsed when the form is submitted. */
export type AddExerciseDraft = { sets: string; min: string; max: string; rest: string; position: string; saveToProgram: boolean };
export type AddExerciseChoice = { options: AddExerciseOptions; saveToProgram: boolean };

export const initialAddExerciseDraft: AddExerciseDraft = {
  sets: String(defaultAddExerciseOptions.targetSets), min: String(defaultAddExerciseOptions.targetRepMin), max: String(defaultAddExerciseOptions.targetRepMax),
  rest: String(defaultAddExerciseOptions.restSeconds), position: 'end', saveToProgram: false,
};

const amount = (text: string) => text.trim() ? Number(text) : NaN;

export function readAddExerciseDraft(draft: AddExerciseDraft): AddExerciseChoice {
  const position: AddExercisePosition = draft.position === 'start' || draft.position === 'end' ? draft.position : { afterExerciseId: draft.position.replace(/^after:/, '') };
  return { options: { targetSets: amount(draft.sets), targetRepMin: amount(draft.min), targetRepMax: amount(draft.max), restSeconds: amount(draft.rest), position }, saveToProgram: draft.saveToProgram };
}
