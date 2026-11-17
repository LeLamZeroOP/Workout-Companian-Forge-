import fs from 'node:fs';

function generated(path) {
  const source = fs.readFileSync(path, 'utf8');
  return JSON.parse(source.slice(source.indexOf(' = ') + 3).trim().replace(/;$/, ''));
}
const originalSource = fs.readFileSync('src/data/exerciseVideos.ts', 'utf8');
const original = JSON.parse(originalSource.slice(originalSource.indexOf('= {', originalSource.indexOf('export const exerciseVideos')) + 2).trim().replace(/;$/, '').replace('...expandedExerciseVideos,', ''));
const videos = { ...generated('src/data/expandedExerciseVideos.ts'), ...original };
const entries = ['push', 'pull', 'lower'].flatMap(group => JSON.parse(fs.readFileSync(`output/library-expansion-${group}.json`, 'utf8')));
const evidence = ['output/exercise-video-playback-verified.json', 'output/expansion-playback-evidence.json', 'output/exercise-video-playback-audit.json'].flatMap(path => fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : []);
const latest = new Map();
for (const item of evidence) if (item.state === 1 || latest.get(item.videoId)?.state !== 1) latest.set(item.videoId, item);
const coverage = Object.entries(videos).map(([exerciseId, video]) => {
  const actual = latest.get(video.videoId);
  const problems = [];
  if (!actual || actual.error !== null || actual.state !== 1 || actual.data?.video_id !== video.videoId || actual.data?.isLive !== false) problems.push('playback');
  if (!actual || actual.width <= actual.height || !actual.height) problems.push('orientation');
  if (Math.ceil(actual?.durationSeconds ?? 0) < (video.shorterTutorialReason ? 80 : 180)) problems.push('duration');
  if (Math.abs(video.durationSeconds - Math.ceil(actual?.durationSeconds ?? 0)) > 1) problems.push('metadata');
  if ((video.startSeconds ?? 0) >= video.durationSeconds || (video.endSeconds !== undefined && (video.endSeconds <= (video.startSeconds ?? 0) || video.endSeconds > video.durationSeconds))) problems.push('chapter');
  return { exerciseId, videoId: video.videoId, title: video.title, creator: video.creator, durationSeconds: video.durationSeconds, startSeconds: video.startSeconds, endSeconds: video.endSeconds, width: actual?.width, height: actual?.height, checkedAt: actual?.checkedAt, passed: !problems.length, problems };
});
fs.writeFileSync('output/library-video-coverage.json', JSON.stringify(coverage, null, 2) + '\n');
console.log(JSON.stringify({ exercises: coverage.length, uniqueSources: new Set(coverage.map(item => item.videoId)).size, passed: coverage.filter(item => item.passed).length, unresolved: coverage.filter(item => !item.passed).map(item => ({ id: item.exerciseId, videoId: item.videoId, actualSeconds: Math.ceil(latest.get(item.videoId)?.durationSeconds ?? 0), problems: item.problems })), researchedEntries: entries.length }, null, 2));
if (coverage.some(item => !item.passed) || coverage.length !== 200) {
  process.exitCode = 1;
} else {
  const rows = entries.map(exercise => {
    const video = videos[exercise.id];
    const url = `https://www.youtube.com/watch?v=${video.videoId}${video.startSeconds ? `&t=${video.startSeconds}s` : ''}`;
    return `| ${exercise.name} | ${exercise.equipment} | [${video.creator}](${url}) | ${Math.floor(video.durationSeconds / 60)}:${String(video.durationSeconds % 60).padStart(2, '0')} |`;
  });
  fs.writeFileSync('docs/exercise-library-expansion.md', `# Exercise library expansion\n\nReviewed 2026-10-16. The library contains 200 built-in exercises: the original 57 plus 143 common repetition-based movements. New entries include bodyweight, band, kettlebell, barbell, dumbbell, cable and machine exercises.\n\nAll 200 entries have a selected demonstration. Every unique selected source (${new Set(coverage.map(item => item.videoId)).size}) played inside the app using the official YouTube IFrame API, with matching video ID, PLAYING state, no reported player error, prerecorded metadata and landscape intrinsic video dimensions. Full evidence is in [the coverage report](../output/library-video-coverage.json) and [playback records](../output/expansion-playback-evidence.json). Sources are available as checked on this date; availability can change.\n\nFull tutorials of at least three minutes are preferred. Selected focused landscape lessons of at least 80 seconds have an explicit selection reason in the source data. Shared tutorials carry variation notes and published chapter starts where available. Portrait Shorts, microclips and sources that block embedding were replaced.\n\nExisting saved definitions take precedence over built-ins. Opening the library does not rewrite saved mappings, programs or workout history. Saving a program adds only missing referenced definitions. Active-workout additions keep independent exercise snapshots.\n\nContributions and muscle roles are editable tracking estimates within the existing 13-muscle model. Kettlebells, trap bars, balls and ab wheels use Other equipment plus searchable names/aliases. Repetition-based bodyweight and band movements explain how to log added external load; unilateral movements explain the per-side convention. Timed holds and carries were excluded because the logger records repetitions.\n\nThe library initially shows 24 entries and exposes more in batches of 24. Search and equipment/muscle filters cover the complete library, including entries beyond the visible batch.\n\n## New selections\n\nDurations below describe the full source; the app displays the selected section where a chapter is bounded. Detailed source research and variation rationales: [push and bodyweight](library-expansion-push.md), [pull and arms](library-expansion-pull.md), [lower body and core](library-expansion-lower.md).\n\n| Exercise | Equipment | Tutorial creator / source | Full duration |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n`);
}
