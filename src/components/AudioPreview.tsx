import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import {
  AUDIO_ERROR_DESCRIPTION,
  AUDIO_ERROR_TITLE,
  AUDIO_UNAVAILABLE_DESCRIPTION,
  AUDIO_UNAVAILABLE_TITLE,
} from "../lib/stateCopy";

export interface AudioPreviewProps {
  /** Source URL for the audio asset. When `null`, renders the disabled state. */
  src: string | null;
  /** Title used for the visible label + the audio element's accessible name. */
  title: string;
  /** Optional one-line explanation shown when `src` is null. */
  disabledNote?: string;
}

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Audio preview with play/pause, scrub, duration, and replay. Falls back to
 * a polished "not connected" surface when no `src` is provided — used in the
 * Voice Studio output panel today, since this build has no synthesis backend.
 *
 * Self-contained: owns its `<audio>` element and the playback state it derives
 * from native media events. Cleans up listeners and `pause()`s on unmount.
 */
export function AudioPreview({ src, title, disabledNote }: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setDuration(0);
    setCurrent(0);
    setErrored(false);
  }, [src]);

  useEffect(() => {
    const node = audioRef.current;
    if (!node) return undefined;

    const onLoaded = () => setDuration(node.duration);
    const onTime = () => setCurrent(node.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(node.duration);
    };
    const onError = () => {
      setPlaying(false);
      setErrored(true);
    };

    node.addEventListener("loadedmetadata", onLoaded);
    node.addEventListener("timeupdate", onTime);
    node.addEventListener("play", onPlay);
    node.addEventListener("pause", onPause);
    node.addEventListener("ended", onEnded);
    node.addEventListener("error", onError);

    return () => {
      node.pause();
      node.removeEventListener("loadedmetadata", onLoaded);
      node.removeEventListener("timeupdate", onTime);
      node.removeEventListener("play", onPlay);
      node.removeEventListener("pause", onPause);
      node.removeEventListener("ended", onEnded);
      node.removeEventListener("error", onError);
    };
  }, [src]);

  if (!src) {
    return (
      <div
        className="rounded-lg border border-border bg-card p-5"
        aria-label={`${title} — audio not connected`}
        role="group"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
          Audio preview
        </p>
        <p className="mt-2 font-display text-lg leading-tight text-text">
          {AUDIO_UNAVAILABLE_TITLE}
        </p>
        <p className="mt-2 max-w-prose font-body text-sm text-textsub">
          {disabledNote ?? AUDIO_UNAVAILABLE_DESCRIPTION}
        </p>
        <div className="mt-4 flex items-center gap-3" aria-hidden="true">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-bordermid bg-panel text-textmuted">
            ▶
          </div>
          <div className="h-1.5 flex-1 rounded-full bg-panel" />
          <span className="font-mono text-[11px] text-textmuted">--:--</span>
        </div>
      </div>
    );
  }

  if (errored) {
    return (
      <div
        className="rounded-lg border border-danger/30 bg-dangerfaint p-4"
        role="alert"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-danger">
          {AUDIO_ERROR_TITLE}
        </p>
        <p className="mt-2 font-body text-sm text-text">
          {AUDIO_ERROR_DESCRIPTION}
        </p>
        <div className="mt-3 flex justify-start">
          <Button
            type="button"
            size="small"
            variant="secondary"
            onClick={() => {
              setErrored(false);
              const node = audioRef.current;
              if (node) {
                node.load();
              }
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const togglePlay = () => {
    const node = audioRef.current;
    if (!node) return;
    if (node.paused) void node.play();
    else node.pause();
  };

  const handleReplay = () => {
    const node = audioRef.current;
    if (!node) return;
    node.currentTime = 0;
    void node.play();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const node = audioRef.current;
    if (!node) return;
    const next = Number(e.target.value);
    node.currentTime = next;
    setCurrent(next);
  };

  const safeDuration = duration > 0 ? duration : 0;

  return (
    <div
      className="rounded-lg border border-border bg-card p-5"
      aria-label={`${title} — audio preview`}
      role="group"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
          Audio preview
        </p>
        <p className="font-mono text-[11px] text-textsub">
          {formatClock(current)} / {formatClock(safeDuration)}
        </p>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" aria-label={title} />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="small"
          variant={playing ? "secondary" : "primary"}
          onClick={togglePlay}
          aria-pressed={playing}
        >
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          type="button"
          size="small"
          variant="ghost"
          onClick={handleReplay}
          aria-label="Replay from start"
        >
          Replay
        </Button>
        <label className="flex flex-1 items-center gap-2">
          <span className="sr-only">Seek</span>
          <input
            type="range"
            min={0}
            max={Math.max(safeDuration, 0.01)}
            step={0.01}
            value={current}
            onChange={handleSeek}
            className="h-1.5 flex-1 cursor-pointer accent-gold"
            aria-label={`Seek ${title}`}
          />
        </label>
      </div>
    </div>
  );
}
