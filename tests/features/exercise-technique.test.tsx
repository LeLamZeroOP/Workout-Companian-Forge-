import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseTechnique } from '../../src/components/ExerciseTechnique';
import { commonExercises } from '../../src/domain/exerciseCatalog';
import { exerciseVideos } from '../../src/data/exerciseVideos';
import { ProgramsPage } from '../../src/features/programs/ProgramsPage';
import { createDefaultData } from '../../src/data/defaults';

it('provides a named YouTube demonstration for every built-in exercise', () => {
  expect(Object.keys(exerciseVideos).sort()).toEqual(commonExercises.map(exercise => exercise.id).sort());
  for (const exercise of commonExercises) {
    const video = exerciseVideos[exercise.id]!;
    expect(video.videoId).toMatch(/^[\w-]{11}$/);
    expect(video.title.trim()).not.toBe('');
    expect(video.creator.trim()).not.toBe('');
    if (video.shorterTutorialReason) {
      expect(video.shorterTutorialReason.length).toBeGreaterThan(40);
      expect(video.durationSeconds).toBeGreaterThanOrEqual(80);
    } else expect(video.durationSeconds).toBeGreaterThanOrEqual(180);
    if (video.startSeconds !== undefined) expect(video.startSeconds).toBeLessThan(video.durationSeconds);
    if (video.endSeconds !== undefined) {
      expect(video.endSeconds).toBeGreaterThan(video.startSeconds ?? 0);
      expect(video.endSeconds).toBeLessThanOrEqual(video.durationSeconds);
    }
  }
});

it('loads a player only on request, attributes the source and restores focus on dismissal', async () => {
  const { container } = render(<ExerciseTechnique exerciseId="db-chest-press" exerciseName="Dumbbell Chest Press" />);
  expect(document.querySelector('iframe')).toBeNull();
  const trigger = screen.getByRole('button', { name: 'Watch technique for Dumbbell Chest Press' });
  await userEvent.click(trigger);
  expect(screen.getByRole('dialog', { name: 'Dumbbell Chest Press' })).toBeInTheDocument();
  const player = screen.getByTitle('Dumbbell Chest Press technique demonstration');
  const url = new URL(player.getAttribute('src')!);
  expect(url.pathname).toBe('/embed/t1iaVBMItPo');
  expect(url.searchParams.get('origin')).toBe(window.location.origin);
  expect(url.searchParams.get('playsinline')).toBe('1');
  expect(player).toHaveAttribute('referrerPolicy', 'strict-origin-when-cross-origin');
  expect(screen.getByText('By Fit Father Project - Fitness For Busy Fathers')).toBeInTheDocument();
  expect(screen.getByText('4 min 27 sec')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Open on YouTube/ })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=t1iaVBMItPo');
  expect(container.querySelector('iframe')).toBeNull();
  await userEvent.keyboard('{Escape}');
  expect(document.querySelector('iframe')).toBeNull();
  expect(trigger).toHaveFocus();
});

it('shows an offline message and recovers when the connection returns', async () => {
  const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  render(<ExerciseTechnique exerciseId="squat" exerciseName="Barbell Back Squat" />);
  await userEvent.click(screen.getByRole('button', { name: /Watch technique/ }));
  expect(screen.getByRole('status')).toHaveTextContent("You're offline");
  expect(document.querySelector('iframe')).toBeNull();
  online.mockReturnValue(true);
  fireEvent(window, new Event('online'));
  expect(screen.getByTitle('Barbell Back Squat technique demonstration')).toBeInTheDocument();
  online.mockRestore();
});

it.each([{ id: 'custom-row', isCustom: true }, { id: 'db-row', isCustom: true }, { id: 'constructor', isCustom: false }])('offers an exercise-specific search when no curated video applies: $id', ({ id, isCustom }) => {
  render(<ExerciseTechnique exerciseId={id} exerciseName="My row & press" isCustom={isCustom} />);
  const link = screen.getByRole('link', { name: /Find technique on YouTube for My row & press/ });
  expect(link).toHaveAttribute('href', 'https://www.youtube.com/results?search_query=My%20row%20%26%20press%20exercise%20technique%20tutorial');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(document.querySelector('iframe')).toBeNull();
});

it('explains when an incline variation uses a general demonstration', async () => {
  render(<ExerciseTechnique exerciseId="db-press-15" exerciseName="15-degree Dumbbell Chest Press" />);
  await userEvent.click(screen.getByRole('button', { name: /Watch technique/ }));
  expect(screen.getByText(/15-degree angle specified in your plan/)).toBeInTheDocument();
});

it('opens the exact machine-row chapter and limits playback to the relevant section', async () => {
  render(<ExerciseTechnique exerciseId="machine-row" exerciseName="Machine Row" />);
  await userEvent.click(screen.getByRole('button', { name: /Watch technique/ }));
  const url = new URL(screen.getByTitle('Machine Row technique demonstration').getAttribute('src')!);
  expect(url.searchParams.get('start')).toBe('577');
  expect(url.searchParams.get('end')).toBe('780');
  expect(screen.getByText('3 min 23 sec section')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Open on YouTube/ })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=6eBwGki2JuU&t=577s');
});

it('opens the exercise library video without opening the editor or saving data', async () => {
  const data = createDefaultData();
  const save = vi.fn();
  render(<ProgramsPage programs={data.programs} exerciseCatalog={data.exercises} onSave={save} onDelete={vi.fn()} onSaveExercise={save} />);
  await userEvent.click(screen.getByRole('button', { name: 'Watch technique for Dumbbell Chest Press' }));
  expect(screen.getByRole('dialog', { name: 'Dumbbell Chest Press' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Exercise name')).not.toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
});
