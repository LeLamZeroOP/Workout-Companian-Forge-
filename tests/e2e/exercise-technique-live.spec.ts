import { readFile, writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { exerciseVideos } from '../../src/data/exerciseVideos';
import { commonExercises } from '../../src/domain/exerciseCatalog';

type ReviewPlayer = {
  mute: () => void; playVideo: () => void; getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number; getVideoData: () => { title: string; author: string; video_id: string; isLive?: boolean };
};
declare global {
  interface Window {
    YT: { Player: new (element: HTMLIFrameElement, options: { events: {
      onReady: (event: { target: ReviewPlayer }) => void;
      onStateChange: (event: { data: number }) => void;
      onError: (event: { data: number }) => void;
    } }) => ReviewPlayer };
    videoReview: { player?: ReviewPlayer; error: number | null; state: number };
  }
}

test.use({ serviceWorkers: 'block' });

// Explicit, live-source acceptance check. Normal CI uses deterministic iframe stubs.
test('plays every selected technique tutorial inside the app', async ({ page }) => {
  test.skip(process.env.VERIFY_YOUTUBE_PLAYBACK !== '1', 'Opt in to live YouTube playback verification');
  const requestedIds = process.env.VIDEO_REVIEW_IDS?.split(',');
  const candidates = Object.entries(exerciseVideos).filter(([id]) => (!requestedIds || requestedIds.includes(id)) && commonExercises.some(exercise => exercise.id === id));
  const unique = candidates.filter(([, video], index, all) => all.findIndex(([, candidate]) => candidate.videoId === video.videoId) === index);
  const limit = Number(process.env.VIDEO_REVIEW_LIMIT ?? unique.length);
  const evidence: Record<string, unknown>[] = [];
  for (const path of ['output/exercise-video-playback-verified.json', 'output/expansion-playback-evidence.json']) {
    try { evidence.push(...JSON.parse(await readFile(path, 'utf8'))); } catch { /* An initial review has no cached evidence. */ }
  }
  const selections = unique.filter(([id, video]) => (!requestedIds || requestedIds.includes(id))
    && !(process.env.VIDEO_REVIEW_SKIP_VERIFIED === '1' && evidence.some(item => item.videoId === video.videoId && item.passed === true))).slice(0, limit);
  test.setTimeout(selections.length * 45000 + 60000);
  const results: Record<string, unknown>[] = [];
  let consecutiveLoadFailures = 0;
  await page.goto('/#programs');
  await page.addScriptTag({ url: 'https://www.youtube.com/iframe_api' });
  await page.waitForFunction(() => typeof window.YT?.Player === 'function');

  for (const [exerciseId, video] of selections) {
    try {
      const exercise = commonExercises.find(item => item.id === exerciseId)!;
      await page.getByLabel('Search exercises').fill(exercise.name);
      await page.getByRole('button', { name: `Watch technique for ${exercise.name}`, exact: true }).click();
      const dialog = page.getByRole('dialog', { name: exercise.name });
      await dialog.locator('iframe').evaluate(frame => {
        window.videoReview = { error: null, state: -1 };
        new window.YT.Player(frame as HTMLIFrameElement, { events: {
          onReady: ({ target }) => { window.videoReview.player = target; target.mute(); target.playVideo(); },
          onStateChange: ({ data }) => { window.videoReview.state = data; },
          onError: ({ data }) => { window.videoReview.error = data; },
        } });
      });
      await expect.poll(() => page.evaluate(() => window.videoReview.error !== null ? 'error' : window.videoReview.state === 1 ? 'playing' : 'loading'), { timeout: 25000 }).not.toBe('loading');
      const playback = await page.evaluate(() => {
        const data = window.videoReview.player?.getVideoData();
        return { error: window.videoReview.error, state: window.videoReview.state, durationSeconds: window.videoReview.player?.getDuration(), currentTime: window.videoReview.player?.getCurrentTime(), data: data ? { title: data.title, author: data.author, video_id: data.video_id, isLive: data.isLive } : undefined };
      });
      let dimensions = { width: 0, height: 0 };
      if (playback.state === 1) {
        const media = page.frameLocator('iframe.technique-player').locator('video');
        await expect.poll(() => media.evaluate(element => (element as HTMLVideoElement).videoWidth), { timeout: 5000 }).toBeGreaterThan(0);
        dimensions = await media.evaluate(element => ({ width: (element as HTMLVideoElement).videoWidth, height: (element as HTMLVideoElement).videoHeight }));
      }
      const longEnough = Math.ceil(playback.durationSeconds ?? 0) >= (video.shorterTutorialReason ? 80 : 180);
      const startsAtChapter = (playback.currentTime ?? 0) >= (video.startSeconds ?? 0) - 2;
      const result = { exerciseId, videoId: video.videoId, ...playback, ...dimensions, passed: playback.error === null && playback.state === 1 && playback.data?.video_id === video.videoId && playback.data.isLive === false && dimensions.width > dimensions.height && longEnough && startsAtChapter, checkedAt: new Date().toISOString() };
      results.push(result);
      consecutiveLoadFailures = 0;
      console.log(JSON.stringify(result));
      if (result.passed && process.env.VIDEO_REVIEW_CAPTURE_IDS?.split(',').includes(exerciseId)) {
        const start = video.startSeconds ?? 0;
        const end = video.endSeconds ?? playback.durationSeconds!;
        for (const fraction of [0.3, 0.6]) {
          const seconds = start + (end - start) * fraction;
          await page.evaluate(time => window.videoReview.player?.seekTo(time, true), seconds);
          await expect.poll(() => page.evaluate(() => window.videoReview.player?.getCurrentTime() ?? 0)).toBeGreaterThan(seconds - 2);
          await dialog.screenshot({ path: `output/playwright/video-review-${exerciseId}-${fraction}.png` });
        }
      }
    } catch (error) {
      const result = { exerciseId, videoId: video.videoId, passed: false, error: String(error), checkedAt: new Date().toISOString() };
      results.push(result);
      consecutiveLoadFailures += 1;
      console.log(JSON.stringify(result));
    } finally {
      await writeFile('output/exercise-video-playback-audit.json', JSON.stringify(results, null, 2) + '\n');
      const latest = new Map(evidence.map(result => [result.videoId, result]));
      for (const result of results) {
        if (result.state === 1 || latest.get(result.videoId)?.state !== 1) latest.set(result.videoId, result);
      }
      await writeFile('output/expansion-playback-evidence.json', JSON.stringify([...latest.values()], null, 2) + '\n');
      const close = page.getByRole('button', { name: 'Close technique video' });
      if (await close.isVisible()) await close.click();
    }
    if (consecutiveLoadFailures >= 2) break;
  }
  expect(results.filter(result => !result.passed)).toEqual([]);
});
