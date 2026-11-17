import fs from 'node:fs';
const entries=['push','pull','lower'].flatMap(group=>{const file='output/library-expansion-'+group+'.json';return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[]});
const evidence=['output/exercise-video-playback-verified.json','output/exercise-video-playback-audit.json','output/expansion-playback-evidence.json'].flatMap(p=>fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):[]);
const metadata=new Map(evidence.filter(e=>e.state===1&&e.data?.video_id===e.videoId).map(e=>[e.videoId,e]));
const exercises=entries.map(({video,sourceUrl,rationale,...exercise})=>exercise);
const videos=Object.fromEntries(entries.filter(e=>e.video).map(e=>{const video={durationSeconds:0,...e.video};const actual=metadata.get(video.videoId);if(actual){video.durationSeconds=Math.ceil(actual.durationSeconds);video.creator=actual.data.author;}return [e.id,video]}));
fs.writeFileSync('src/domain/expandedExercises.ts',"import type { ExerciseDefinition } from './models';\n\n// Common repetition-based movements; saved user definitions take precedence.\nexport const expandedExercises: ExerciseDefinition[] = "+JSON.stringify(exercises,null,2)+';\n');
fs.writeFileSync('src/data/expandedExerciseVideos.ts',"import type { ExerciseVideo } from './exerciseVideos';\n\n// Sources and selection notes are recorded in docs/library-expansion-*.md.\nexport const expandedExerciseVideos: Record<string, ExerciseVideo> = "+JSON.stringify(videos,null,2)+';\n');
console.log(JSON.stringify({exercises:exercises.length,videos:Object.keys(videos).length,uniqueVideos:new Set(Object.values(videos).map(v=>v.videoId)).size}));
