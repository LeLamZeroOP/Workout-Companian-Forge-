import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createDefaultData } from '../../src/data/defaults';
import { CustomWorkoutForm } from '../../src/features/workout/CustomWorkoutForm';
import { useAppData } from '../../src/hooks/useAppData';
import { App } from '../../src/app/App';

it('builds, orders, and starts exercises without a program', async () => {
  const data = createDefaultData();
  const start = vi.fn();
  const user = userEvent.setup();
  render(<CustomWorkoutForm catalog={data.exercises.slice(0, 2)} onStart={start} onCancel={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Start custom workout' }));
  expect(start).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent(/choose an exercise/i);
  fireEvent.change(screen.getByLabelText('Workout name'), { target: { value: 'My session' } });
  await user.click(screen.getByRole('button', { name: 'Exercise 1' }));
  await user.click(screen.getByRole('option', { name: /Dumbbell Chest Press/ }));
  fireEvent.change(screen.getByLabelText('Sets for exercise 1'), { target: { value: '2' } });
  await user.click(screen.getByRole('button', { name: 'Add exercise' }));
  await user.click(screen.getByRole('button', { name: 'Exercise 2' }));
  await user.click(screen.getByRole('option', { name: /Lat Pulldown/ }));
  await user.click(screen.getByRole('button', { name: 'Move exercise 2 up' }));
  await user.click(screen.getByRole('button', { name: 'Start custom workout' }));
  expect(start).toHaveBeenCalledWith(expect.objectContaining({ name: 'My session', exercises: [expect.objectContaining({ exerciseId: 'lat-pulldown', targetSets: 3 }), expect.objectContaining({ exerciseId: 'db-chest-press', targetSets: 2 })] }));
});

it('keeps the custom workout draft when saving fails', async () => {
  const data = createDefaultData();
  render(<CustomWorkoutForm catalog={data.exercises.slice(0, 1)} onStart={() => false} onCancel={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Exercise 1' }));
  await userEvent.click(screen.getByRole('option', { name: /Dumbbell Chest Press/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Start custom workout' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Your draft is still here');
  expect(screen.getByLabelText('Workout name')).toHaveValue('Custom workout');
});

it('offers custom workouts with no programs and guards the setup draft', async () => {
  const data = createDefaultData();
  data.programs = [];
  data.settings.lastSelectedProgramId = null;
  localStorage.setItem('workout-tracker:data', JSON.stringify(data));
  window.history.replaceState(null, '', '#workout');
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: 'Custom workout' }));
  fireEvent.change(screen.getByLabelText('Workout name'), { target: { value: 'Draft session' } });
  await userEvent.click(screen.getByRole('button', { name: 'Today' }));
  expect(screen.getByRole('alertdialog', { name: 'Save your changes?' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
  expect(screen.getByLabelText('Workout name')).toHaveValue('Draft session');
});

it('persists a standalone workout, resumes it, and completes it into history', () => {
  const data = createDefaultData();
  const template = { ...data.programs[0]!.workouts[0]!, name: 'Free session' };
  data.programs = [];
  localStorage.setItem('workout-tracker:data', JSON.stringify(data));
  const first = renderHook(() => useAppData());
  act(() => { first.result.current.startCustomWorkout(template); });
  expect(first.result.current.data.programs).toHaveLength(0);
  const id = first.result.current.data.sessions[0]!.id;
  first.unmount();
  const second = renderHook(() => useAppData());
  expect(second.result.current.data.sessions[0]).toMatchObject({ id, programId: null, workoutName: 'Free session' });
  const session = structuredClone(second.result.current.data.sessions[0]!);
  Object.assign(session.exercises[0]!.sets[0]!, { weightKg: 20, reps: 10, completed: true });
  act(() => { second.result.current.updateSession(session); });
  act(() => { second.result.current.finishWorkout(id); });
  expect(second.result.current.data.sessions[0]!.completedAt).not.toBeNull();
  expect(second.result.current.data.programs).toHaveLength(0);
});
