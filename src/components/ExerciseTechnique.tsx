import { useEffect, useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { exerciseVideos } from '../data/exerciseVideos';
import { DialogSurface } from './DialogSurface';
import './exercise-technique.css';

type Props = { exerciseId: string; exerciseName: string; isCustom?: boolean; compact?: boolean };

function TechniquePlayer({ exerciseName, video, onClose }: {
  exerciseName: string; video: (typeof exerciseVideos)[string]; onClose: () => void;
}) {
  const [online, setOnline] = useState(() => navigator.onLine);
  const parameters = new URLSearchParams({ rel: '0', playsinline: '1', enablejsapi: '1', origin: window.location.origin });
  if (video.startSeconds) parameters.set('start', String(video.startSeconds));
  if (video.endSeconds) parameters.set('end', String(video.endSeconds));
  const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}${video.startSeconds ? `&t=${video.startSeconds}s` : ''}`;
  const tutorialSeconds = (video.endSeconds ?? video.durationSeconds) - (video.startSeconds ?? 0);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return <DialogSurface title={exerciseName} eyebrow="Technique tutorial" closeLabel="Close technique video" onClose={onClose} className="confirm-dialog technique-dialog" initialFocusSelector="a[href]">
    {online ? <iframe
      className="technique-player"
      src={`https://www.youtube-nocookie.com/embed/${video.videoId}?${parameters}`}
      title={`${exerciseName} technique demonstration`}
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    /> : <p role="status" className="technique-offline">You're offline. Connect to the internet to watch this demonstration.</p>}
    <p className="technique-credit">{video.title}<br /><span>By {video.creator}</span> · <span>{Math.floor(tutorialSeconds / 60)} min {tutorialSeconds % 60} sec{video.startSeconds ? ' section' : ''}</span></p>
    {video.note && <p className="field-help">{video.note}</p>}
    <p className="field-help">YouTube videos need an internet connection. If the player is unavailable, open the video on YouTube.</p>
    <a className="secondary-action technique-external" href={watchUrl} target="_blank" rel="noopener noreferrer">Open on YouTube<ExternalLink size={15} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
  </DialogSurface>;
}

export function ExerciseTechnique({ exerciseId, exerciseName, isCustom = false, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const video = !isCustom && Object.hasOwn(exerciseVideos, exerciseId) ? exerciseVideos[exerciseId] : undefined;
  const className = `text-action exercise-technique-trigger${compact ? ' technique-compact' : ''}`;
  if (!video) return <a className={className} title="Find technique on YouTube" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} exercise technique tutorial`)}`} target="_blank" rel="noopener noreferrer" aria-label={`Find technique on YouTube for ${exerciseName} (opens in a new tab)`}><Play size={14} aria-hidden="true" /><span>Find technique</span></a>;

  return <>
    <button type="button" className={className} title="Watch technique" aria-label={`Watch technique for ${exerciseName}`} aria-haspopup="dialog" onClick={() => setOpen(true)}><Play size={14} aria-hidden="true" /><span>Watch technique</span></button>
    {open && <TechniquePlayer exerciseName={exerciseName} video={video} onClose={() => setOpen(false)} />}
  </>;
}
