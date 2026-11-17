import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MuscleSummaryPage } from '../../src/features/muscles/MuscleSummaryPage';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import { getMuscleSetTotals } from '../../src/domain/muscleSets';

function savedSession() {
  const data = createDefaultData();
  const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, '2026-10-05T10:00:00Z');
  session.completedAt = '2026-10-05T11:00:00Z';
  Object.assign(session.exercises[0]!.sets[0]!, { completed: true, weightKg: 30, reps: 10 });
  return session;
}

it('does not silently show all sessions when a custom range endpoint is cleared', async () => {
  render(<MuscleSummaryPage sessions={[savedSession()]} now={new Date('2026-10-08T12:00:00Z')} />);
  await userEvent.click(screen.getByRole('button', { name: 'Custom' }));
  fireEvent.change(screen.getByLabelText('From'), { target: { value: '' } });
  expect(screen.getByRole('alert')).toHaveTextContent('Choose valid dates with the start on or before the end');
  expect(screen.queryByText('weighted contributions')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-10-01' } });
  expect(screen.getByText('weighted contributions')).toBeInTheDocument();
});

it('returns no muscle totals for invalid or inverted domain ranges', () => {
  const sessions = [savedSession()];
  expect(getMuscleSetTotals(sessions, new Date('invalid'), new Date('2026-10-08'))).toEqual({});
  expect(getMuscleSetTotals(sessions, new Date('2026-10-08'), new Date('2026-10-01'))).toEqual({});
});
