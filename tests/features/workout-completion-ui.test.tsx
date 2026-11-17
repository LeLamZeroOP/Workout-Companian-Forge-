import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import { WorkoutPage } from '../../src/features/workout/WorkoutPage';

function Fixture({ reject = false, updateRecord = true }: { reject?: boolean; updateRecord?: boolean }) {
  const data = createDefaultData();
  const [sessions, setSessions] = useState(() => {
    const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, '2026-10-09T10:00:00Z');
    Object.assign(session.exercises[0]!.sets[0]!, { weightKg: 30, reps: 10, completed: true });
    Object.assign(session.exercises[0]!.sets[1]!, { weightKg: 15, reps: 5, completed: true, kind: 'warmup' });
    session.guide.currentSetId = session.exercises[0]!.sets[2]!.id;
    return [session];
  });
  return <WorkoutPage programs={data.programs} catalog={data.exercises} sessions={sessions} lastSelectedProgramId={null} keepScreenAwake={false} onStart={vi.fn()} onChange={() => true} onDiscard={vi.fn()} saveStatus="Saved on this device · waiting to sync" onFinish={() => {
    if (reject) return false;
    if (updateRecord) setSessions(current => current.map(session => ({ ...session, completedAt: '2026-10-09T10:12:30Z' })));
    return true;
  }} />;
}

async function finish() {
  await userEvent.click(screen.getByRole('button', { name: 'Finish early' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save and finish' }));
}

it('summarizes only valid working sets after an accepted finish and keeps sync pending visible', async () => {
  render(<Fixture />); await finish();
  const summary = screen.getByRole('region', { name: 'Finished workout' });
  expect(within(summary).getByRole('heading', { name: 'Push' })).toHaveFocus();
  expect(within(summary).getByText('Working set').parentElement).toHaveTextContent('1');
  expect(within(summary).getByText('Recorded volume').parentElement).toHaveTextContent('300 kg');
  expect(within(summary).getByText('Duration').parentElement).toHaveTextContent('12:30');
  expect(summary).toHaveTextContent('1 completed warm-up set is also retained');
  expect(within(summary).getByRole('status')).toHaveTextContent('waiting to sync');
  expect(within(summary).getByRole('link', { name: 'View history' })).toHaveAttribute('href', '#history');
  await userEvent.click(within(summary).getByRole('button', { name: 'Choose next workout' }));
  expect(screen.getByRole('button', { name: 'Begin guided workout' })).toBeInTheDocument();
});

it('preserves the review and avoids a completion summary when finishing is rejected', async () => {
  render(<Fixture reject />); await finish();
  expect(screen.queryByRole('region', { name: 'Finished workout' })).not.toBeInTheDocument();
  expect(within(screen.getByRole('alertdialog')).getByRole('alert')).toHaveTextContent('could not be finished');
});

it('waits for the authoritative finished record even if the callback accepts', async () => {
  render(<Fixture updateRecord={false} />); await finish();
  expect(screen.queryByRole('region', { name: 'Finished workout' })).not.toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Workout completion' })).toBeInTheDocument();
});
