import { readFile, writeFile } from 'node:fs/promises';

function initialPlayerResponse(html) {
  const match = /ytInitialPlayerResponse\s*=\s*/.exec(html);
  if (!match) throw new Error('YouTube player metadata was not returned');
  const start = match.index + match[0].length;
  let depth = 0, quoted = false, escaped = false;
  for (let index = start; index < html.length; index++) {
    const character = html[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === '{') depth++;
    else if (character === '}' && --depth === 0) return JSON.parse(html.slice(start, index + 1));
  }
  throw new Error('YouTube player metadata was incomplete');
}

const input = process.argv[2];
async function currentSelections() {
  const source = await readFile(new URL('../src/data/exerciseVideos.ts', import.meta.url), 'utf8');
  const original = JSON.parse(source.slice(source.indexOf('= {', source.indexOf('export const exerciseVideos')) + 2).trim().replace(/;$/, '').replace('...expandedExerciseVideos,', ''));
  const expanded = await readFile(new URL('../src/data/expandedExerciseVideos.ts', import.meta.url), 'utf8');
  const additions = JSON.parse(expanded.slice(expanded.indexOf(' = ') + 3).trim().replace(/;$/, ''));
  return Object.entries({ ...additions, ...original }).map(([exerciseId, video]) => ({ exerciseId, ...video }));
}
const entries = input
  ? JSON.parse(await readFile(input, 'utf8'))
  : await currentSelections();
const uniqueIds = [...new Set(entries.map(video => video.videoId))];
const results = [];
const cachePath = 'output/youtube-video-metadata-cache.json';
let cached;
try { cached = JSON.parse(await readFile(cachePath, 'utf8')); } catch { cached = {}; }
// Bound concurrent page requests to avoid hammering the video provider.
let next = 0;
let rateLimited = false;
await Promise.all(Array.from({ length: 2 }, async () => {
  while (next < uniqueIds.length) {
    const videoId = uniqueIds[next++];
    try {
      if (rateLimited) throw new Error('Metadata request deferred after YouTube rate limiting. Use the opt-in live playback check.');
      if (cached[videoId] && Date.now() - Date.parse(cached[videoId].checkedAt) < 24 * 60 * 60 * 1000) {
        results.push({ ...cached[videoId], exerciseIds: entries.filter(video => video.videoId === videoId).map(video => video.exerciseId) });
        continue;
      }
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, { signal: AbortSignal.timeout(20000) });
      if (response.status === 429) rateLimited = true;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const player = initialPlayerResponse(await response.text());
      const details = player.videoDetails;
      const microformat = player.microformat?.playerMicroformatRenderer;
      const embed = microformat?.embed;
      const durationSeconds = Number(details?.lengthSeconds ?? 0);
      const checks = {
        available: player.playabilityStatus?.status === 'OK',
        embeddingAllowed: player.playabilityStatus?.playableInEmbed === true,
        substantialTutorial: durationSeconds >= 180 || (durationSeconds >= 80 && entries.filter(video => video.videoId === videoId).every(video => Boolean(video.shorterTutorialReason))),
        prerecorded: details?.isLiveContent === false,
      };
      const result = { videoId, exerciseIds: entries.filter(video => video.videoId === videoId).map(video => video.exerciseId), title: details?.title, creator: details?.author, durationSeconds, width: embed?.width, height: embed?.height, checks, passed: Object.values(checks).every(Boolean), reason: player.playabilityStatus?.reason, description: details?.shortDescription, checkedAt: new Date().toISOString() };
      results.push(result);
      cached[videoId] = result;
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      results.push({ videoId, passed: false, error: error.message });
    }
  }
}));
results.sort((a, b) => a.videoId.localeCompare(b.videoId));
const reportPath = process.argv[3] ?? 'output/exercise-video-audit.json';
await writeFile(reportPath, JSON.stringify(results, null, 2) + '\n');
await writeFile(cachePath, JSON.stringify(cached, null, 2) + '\n');
for (const result of results) console.log(JSON.stringify({ videoId: result.videoId, title: result.title, durationSeconds: result.durationSeconds, checks: result.checks, error: result.error }));
console.log(`${results.filter(result => result.passed).length}/${results.length} unique videos passed preliminary metadata screening. Actual orientation and playback require the opt-in browser check. Report: ${reportPath}`);
if (results.some(result => !result.passed)) process.exitCode = 1;
