import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgramForm } from '../../src/features/programs/ProgramForm';
import { createDefaultData } from '../../src/data/defaults';
import { ExerciseContributionForm } from '../../src/features/programs/ExerciseContributionForm';

describe('ProgramForm', () => {
  it('edits program details, adds a workout, and saves', async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    const onSave = vi.fn();
    render(<ProgramForm initialValue={data.programs[0]!} exerciseCatalog={data.exercises} onSave={onSave} onCancel={() => undefined} />);

    const name = screen.getByLabelText('Program name');
    await user.clear(name);
    await user.type(name, 'My Strength Plan');
    await user.clear(screen.getByLabelText('Rest seconds for Dumbbell Chest Press'));
    await user.type(screen.getByLabelText('Rest seconds for Dumbbell Chest Press'), '120');
    await user.click(screen.getByRole('button', { name: 'Add workout' }));
    expect(screen.getAllByLabelText(/Workout name/)).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: 'Save program' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'My Strength Plan' }));
  });

  it('shows validation errors and does not save invalid data', async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    const onSave = vi.fn();
    render(<ProgramForm initialValue={data.programs[0]!} exerciseCatalog={data.exercises} onSave={onSave} onCancel={() => undefined} />);
    await user.clear(screen.getByLabelText('Program name'));
    await user.click(screen.getByRole('button', { name: 'Save program' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/program name/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('requires and saves fractional muscle contributions', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ExerciseContributionForm exercise={{ id: 'custom', name: 'Cable press', equipment: 'cable', muscleContribution: {}, isCustom: true }} onSave={onSave} onCancel={() => undefined} />);
    await user.click(screen.getByRole('button', { name: 'Save exercise' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least one muscle/i);
    await user.click(screen.getByRole('button', { name: 'Chest contribution' }));
    await user.click(screen.getByRole('option', { name: '1' }));
    await user.click(screen.getByRole('button', { name: 'Triceps contribution' }));
    await user.click(screen.getByRole('option', { name: '0.5' }));
    await user.click(screen.getByRole('button', { name: 'Save exercise' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ muscleContribution: { chest: 1, triceps: 0.5 } }));
  });

  it('replaces removed workout references with rest days in a repeating cycle', async () => {
    const data = createDefaultData();
    const original = data.programs[0]!;
    const program = { ...original, volumePlan: { goal: 'custom' as const, targets: [], cycle: { slots: [original.workouts[0]!.id, original.workouts[1]!.id, null] } } };
    const save = vi.fn();
    render(<ProgramForm initialValue={program} exerciseCatalog={data.exercises} onSave={save} onCancel={vi.fn()} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Remove workout' })[0]!);
    expect(screen.getByLabelText('Day 1')).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: 'Save program' }));
    expect(save.mock.calls[0]![0].volumePlan.cycle.slots).toEqual([null, original.workouts[1]!.id, null]);
    expect(program.workouts).toHaveLength(3);
  });

  it('duplicates a maximum-length workout name without blocking save', async () => {
    const data = createDefaultData();
    const original = data.programs[0]!;
    const program = { ...original, workouts: [{ ...original.workouts[0]!, name: 'W'.repeat(60) }] };
    const save = vi.fn();
    render(<ProgramForm initialValue={program} exerciseCatalog={data.exercises} onSave={save} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate workout' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save program' }));
    expect(save.mock.calls[0]![0].workouts[1].name).toHaveLength(60);
  });

  it('stops adding and duplicating workouts at the editor limit', () => {
    const data = createDefaultData();
    const original = data.programs[0]!;
    const exercise = original.workouts[0]!.exercises[0]!;
    const program = { ...original, workouts: Array.from({ length: 14 }, (_, index) => ({ ...original.workouts[0]!, id: `w-${index}`, exercises: [{ ...exercise, id: `e-${index}` }] })) };
    render(<ProgramForm initialValue={program} exerciseCatalog={data.exercises.filter(item => item.id === exercise.exerciseId)} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Add workout', { selector: 'button' })).toBeDisabled();
    const duplicateButtons = screen.getAllByText('Duplicate workout', { selector: 'button' });
    expect(duplicateButtons).toHaveLength(14);
    duplicateButtons.forEach(button => expect(button).toBeDisabled());
  });

  it('stops adding exercises at the workout limit', () => {
    const data = createDefaultData();
    const original = data.programs[0]!;
    const exercise = original.workouts[0]!.exercises[0]!;
    const program = { ...original, workouts: [{ ...original.workouts[0]!, exercises: Array.from({ length: 20 }, (_, index) => ({ ...exercise, id: `e-${index}` })) }] };
    render(<ProgramForm initialValue={program} exerciseCatalog={data.exercises.filter(item => item.id === exercise.exerciseId)} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Add exercise', { selector: 'button' })).toBeDisabled();
  });
});
