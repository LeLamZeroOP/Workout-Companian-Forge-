import { render, screen } from '@testing-library/react';
import { GuidedWorkout } from '../../src/features/workout/GuidedWorkout';
import { ExerciseTechnique } from '../../src/components/ExerciseTechnique';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';

describe('workout polish', () => {
  it('explains draft saving only until the first set is completed', () => {
    const data = createDefaultData(); const startedAt = '2026-10-09T10:00:00Z';
    const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, startedAt);
    const view = render(<GuidedWorkout session={session} onChange={vi.fn()} onFinish={vi.fn()} onDiscard={vi.fn()} now={() => startedAt} />);
    expect(screen.getByText(/Drafts save on this device as you type/)).toBeInTheDocument();
    view.unmount();

    const done = structuredClone(session);
    Object.assign(done.exercises[0]!.sets[0]!, { weightKg: 30, reps: 10, completed: true });
    done.guide.currentSetId = done.exercises[0]!.sets[1]!.id;
    render(<GuidedWorkout session={done} onChange={vi.fn()} onFinish={vi.fn()} onDiscard={vi.fn()} now={() => startedAt} />);
    expect(screen.queryByText(/Drafts save on this device as you type/)).not.toBeInTheDocument();
  });

  it('keeps a full accessible name while offering a short visible label for compact layouts', () => {
    render(<ExerciseTechnique exerciseId="db-chest-press" exerciseName="Dumbbell Chest Press" compact />);
    const trigger = screen.getByRole('button', { name: 'Watch technique for Dumbbell Chest Press' });
    expect(trigger.querySelector('.technique-label-full')).toHaveTextContent('Watch technique');
    expect(trigger.querySelector('.technique-label-short')).toHaveTextContent('Technique');
    expect(trigger.querySelector('.technique-label-short')).toHaveAttribute('aria-hidden', 'true');
  });
});
