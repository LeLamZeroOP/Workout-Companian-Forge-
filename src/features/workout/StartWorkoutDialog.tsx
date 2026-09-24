import type { Program } from '../../domain/models';
import { useState } from 'react';
import { Play } from 'lucide-react';
export function StartWorkoutDialog({ programs, onStart, initialProgramId = null }: { programs: Program[]; onStart: (programId: string, workoutId: string) => void; initialProgramId?: string | null }) {
  const [programId, setProgramId] = useState(() => programs.some((program) => program.id === initialProgramId) ? initialProgramId! : '');
  const [workoutId, setWorkoutId] = useState('');
  const program = programs.find((item) => item.id === programId);
  return <section className="start-panel"><p className="eyebrow">New session</p><h2>Choose today's workout</h2><p>Select the program and workout you want Forge to guide.</p>
    <div className="field"><label htmlFor="start-program">Program</label><select id="start-program" value={programId} onChange={(e) => { setProgramId(e.target.value); setWorkoutId(''); }}><option value="">Select program</option>{programs.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
    <div className="field"><label htmlFor="start-workout">Workout</label><select id="start-workout" value={workoutId} disabled={!program} onChange={(e) => setWorkoutId(e.target.value)}><option value="">Select workout</option>{program?.workouts.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
    <button className="primary-action" type="button" disabled={!programId || !workoutId} onClick={() => onStart(programId, workoutId)}><Play size={18}/>Begin guided workout</button>
  </section>;
}
