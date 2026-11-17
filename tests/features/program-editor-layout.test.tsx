import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgramsPage } from '../../src/features/programs/ProgramsPage';
import { ProgramForm } from '../../src/features/programs/ProgramForm';
import { createDefaultData } from '../../src/data/defaults';

describe('Programs page actions', () => {
  it('keeps Delete in the card menu and confirms before deleting', async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    const onDelete = vi.fn();
    render(<ProgramsPage programs={data.programs} exerciseCatalog={data.exercises} onSave={vi.fn()} onDelete={onDelete} onSaveExercise={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Delete Starter Strength' })).not.toBeInTheDocument();
    const more = screen.getByRole('button', { name: 'More actions for Starter Strength' });
    expect(more).toHaveAttribute('aria-expanded', 'false');

    await user.click(more);
    const item = within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Delete Starter Strength' });
    expect(item).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(more).toHaveFocus();

    await user.click(more);
    await user.click(screen.getByRole('menuitem', { name: 'Delete Starter Strength' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete program' }));
    expect(onDelete).toHaveBeenCalledWith(data.programs[0]!.id);
  });
});

describe('Program editor layout', () => {
  it('orders the sections, reports draft changes and keeps the muscle review collapsed with its total', async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    const { container } = render(<ProgramForm initialValue={data.programs[0]!} exerciseCatalog={data.exercises} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getAllByRole('heading', { level: 3 }).map(heading => heading.textContent)).toEqual(expect.arrayContaining([
      expect.stringContaining('Program'), expect.stringContaining('Workouts'), expect.stringContaining('Schedule and targets'), expect.stringContaining('Review'),
    ]));
    const titles = [...container.querySelectorAll('.editor-section-title')].map(title => title.firstChild?.nextSibling?.textContent);
    expect(titles).toEqual(['Program', 'Workouts', 'Schedule and targets', 'Review']);

    const review = container.querySelector<HTMLDetailsElement>('details.program-muscle-summary')!;
    expect(review.open).toBe(false);
    expect(within(review.querySelector('summary')!).getByText(/performed sets$/)).toBeInTheDocument();

    expect(screen.getByRole('status')).toHaveTextContent('No changes yet');
    await user.type(screen.getByLabelText('Program name'), ' v2');
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');
  });

  it('labels a program that has never been saved', () => {
    const data = createDefaultData();
    render(<ProgramForm isNew initialValue={data.programs[0]!} exerciseCatalog={data.exercises} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('New program · not saved yet');
  });
});
