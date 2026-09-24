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
    await user.selectOptions(screen.getByLabelText('Chest'), '1');
    await user.selectOptions(screen.getByLabelText('Triceps'), '0.5');
    await user.click(screen.getByRole('button', { name: 'Save exercise' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ muscleContribution: { chest: 1, triceps: 0.5 } }));
  });
});
