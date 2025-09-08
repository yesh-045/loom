"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Minimal Web Speech API typings
declare global {
  interface Window {
    webkitSpeechRecognition: new () => any;
    SpeechRecognition: new () => any;
  }
}

type Mode = "pronunciation" | "fluency" | "accent" | "vocabulary";

interface SpeechExercise {
  id: string;
  text: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  targetWords?: string[];
  phonetics?: string;
}

interface SpeechTrainingProps {
  exercises?: SpeechExercise[];
  mode?: Mode;
}

interface Result {
  transcript: string;
  accuracy: number; // 0-100
}

// New: prosody metrics interface
interface ProsodyMetrics {
  durationSec: number;
  wpm?: number;
  avgDb: number; // average loudness in dBFS
  volStdDb: number; // loudness variability
  pitchHzMedian?: number;
  pitchHzIQR?: number;
  pauseCount: number;
  avgPauseMs: number;
  tips: string[];
}

const DEFAULT_EXERCISES: SpeechExercise[] = [
  {
    id: "1",
    text: "The quick brown fox jumps over the lazy dog",
    difficulty: "beginner",
    category: "Pronunciation",
    targetWords: ["quick", "brown", "jumps"],
    phonetics: "/ðə kwɪk braʊn fɒks dʒʌmps ˈoʊvər ðə ˈleɪzi dɒg/",
  },
  {
    id: "2",
    text: "She sells seashells by the seashore",
    difficulty: "intermediate",
    category: "Alliteration",
    targetWords: ["sells", "seashells", "seashore"],
    phonetics: "/ʃi sɛlz ˈsiʃɛlz baɪ ðə ˈsiʃɔr/",
  },
  {
    id: "3",
    text: "Artificial intelligence revolutionizes technological advancement",
    difficulty: "advanced",
    category: "Technical Terms",
    targetWords: ["artificial", "intelligence", "revolutionizes", "technological"],
    phonetics: "/ˌɑrtəˈfɪʃəl ɪnˈtɛlədʒəns rɛvəˈluʃəˌnaɪzəz ˌtɛknəˈlɑdʒɪkəl ədˈvænsmənt/",
  },
];

function normalize(text: string) {
  return text.replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function accuracyScore(target: string, spoken: string) {
  const t = normalize(target).split(" ").filter(Boolean);
  const s = new Set(normalize(spoken).split(" ").filter(Boolean));
  if (t.length === 0) return 0;
  let hit = 0;
  for (const w of t) if (s.has(w)) hit++;
  return Math.round((hit / t.length) * 100);
}

// Pitch estimation via simple autocorrelation
function estimatePitchHz(buf: Float32Array, sampleRate: number): number | null {
  const size = buf.length;
  // Remove DC offset
  let mean = 0;
  for (let i = 0; i < size; i++) mean += buf[i];
  mean /= size;
  for (let i = 0; i < size; i++) buf[i] -= mean;
  // Energy check
  let energy = 0;
  for (let i = 0; i < size; i++) energy += buf[i] * buf[i];
  if (energy / size < 1e-5) return null; // too quiet

  const minHz = 50, maxHz = 400;
  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.floor(sampleRate / minHz);
  let bestLag = -1;
  let bestCorr = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < size - lag; i++) corr += buf[i] * buf[i + lag];
    // Normalize by energy
    corr = corr / energy;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  if (bestLag > 0 && bestCorr > 0.3) {
    return sampleRate / bestLag;
  }
  return null;
}

const SpeechTraining: React.FC<SpeechTrainingProps> = ({ exercises }) => {
  const list = Array.isArray(exercises) && exercises.length > 0 ? exercises : DEFAULT_EXERCISES;
  const [idx, setIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  // Mic devices and permissions
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  // TTS reference playback (ElevenLabs)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // New: audio analysis refs/state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sampleTimerRef = useRef<number | null>(null);
  const [metrics, setMetrics] = useState<ProsodyMetrics | null>(null);

  // Buffers for analysis during recording
  const rmsSamplesRef = useRef<number[]>([]);
  const pitchSamplesRef = useRef<number[]>([]);
  const pauseDurMsRef = useRef<number[]>([]);
  const isSilentRef = useRef<boolean>(false);
  const lastStateChangeRef = useRef<number>(0);
  const startTsRef = useRef<number>(0);

  const current = list[idx];

  // Sync reset of metrics on exercise change
  useEffect(() => {
    setMetrics(null);
  }, [idx]);

  // Initialize recognition once
  useEffect(() => {
    const SR = (typeof window !== "undefined" && (window.webkitSpeechRecognition || window.SpeechRecognition)) as
      | (new () => any)
      | undefined;
    if (!SR) {
      setError("Speech recognition is not supported in this browser. Use Chrome, Edge, or Safari.");
      return;
    }
    const rec = new SR();
    rec.continuous = false; // single pass -> less noise
    rec.interimResults = false; // final only
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      try {
        const final = e.results?.[e.results.length - 1]?.[0];
        const transcript = String(final?.transcript || "").trim();
        const acc = accuracyScore(current.text, transcript);
        setResult({ transcript, accuracy: acc });
      } finally {
        setRecording(false);
      }
    };

    rec.onerror = () => {
      setRecording(false);
      setError("Couldn’t capture audio. Please check mic permissions and try again.");
    };

    rec.onend = () => setRecording(false);

    recRef.current = rec;
    return () => {
      try { rec.stop?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load mic permission state and devices
  useEffect(() => {
    (async () => {
      try {
        if (typeof navigator !== 'undefined' && (navigator as any).permissions?.query) {
          try {
            const status = await (navigator as any).permissions.query({ name: 'microphone' } as any);
            setPermissionState(status.state);
            status.onchange = () => setPermissionState(status.state);
          } catch {
            setPermissionState('unknown');
          }
        }
        if (navigator.mediaDevices?.enumerateDevices) {
          const all = await navigator.mediaDevices.enumerateDevices();
          setDevices(all.filter((d) => d.kind === 'audioinput'));
          if (!selectedDeviceId) {
            const first = all.find((d) => d.kind === 'audioinput');
            if (first) setSelectedDeviceId(first.deviceId);
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const start = async () => {
    setError(null);
    setResult(null);
    setMetrics(null);
    rmsSamplesRef.current = [];
    pitchSamplesRef.current = [];
    pauseDurMsRef.current = [];
    isSilentRef.current = false;
    lastStateChangeRef.current = performance.now();

    try {
      // Start SR (optional)
      recRef.current?.start?.();
      setRecording(true);

      // Start audio capture with selected device
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } as MediaTrackConstraints,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      const sampleMs = 50;
      const timeData = new Float32Array(analyser.fftSize);
      startTsRef.current = performance.now();

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(timeData);
        // RMS
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) sum += timeData[i] * timeData[i];
        const rms = Math.sqrt(sum / timeData.length);
        const db = 20 * Math.log10(rms + 1e-8);
        rmsSamplesRef.current.push(db);
        // Silence detection
        const silent = rms < 0.01; // threshold
        const now = performance.now();
        if (silent !== isSilentRef.current) {
          // state change
          if (silent === false) {
            // ended a pause
            const dur = now - lastStateChangeRef.current;
            if (isSilentRef.current && dur > 200) pauseDurMsRef.current.push(dur);
          }
          isSilentRef.current = silent;
          lastStateChangeRef.current = now;
        }
        // Pitch (only if not silent)
        if (!silent && audioCtxRef.current) {
          const bufCopy = new Float32Array(timeData); // copy before mutation
          const hz = estimatePitchHz(bufCopy, audioCtxRef.current.sampleRate);
          if (hz && hz >= 50 && hz <= 400) pitchSamplesRef.current.push(hz);
        }
        sampleTimerRef.current = window.setTimeout(tick, sampleMs) as any;
      };
      tick();
    } catch (e) {
      setRecording(false);
      let msg = "Unable to access microphone. Check permissions and try again.";
      if (e && typeof e === 'object') {
        const name = (e as any).name as string | undefined;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          msg = "Microphone access blocked by the browser. Allow mic in site settings and reload.";
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          msg = "No microphone detected. Plug in a mic or check Windows privacy settings.";
        } else if (name === 'NotReadableError') {
          msg = "Microphone is in use by another app. Close apps like Zoom/Discord and retry.";
        } else if (name === 'OverconstrainedError') {
          msg = "Selected microphone is unavailable. Choose a different device.";
        } else if ((e as any).message) {
          msg = (e as any).message;
        }
      }
      setError(msg);
    }
  };

  const stop = () => {
    try { recRef.current?.stop?.(); } catch {}
    setRecording(false);

    // Stop sampling
    if (sampleTimerRef.current) {
      window.clearTimeout(sampleTimerRef.current);
      sampleTimerRef.current = null;
    }
    // Close audio
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    // Finalize last pause if ended silent
    const now = performance.now();
    if (isSilentRef.current) {
      const dur = now - lastStateChangeRef.current;
      if (dur > 200) pauseDurMsRef.current.push(dur);
    }

    // Compute metrics
    const durationMs = now - startTsRef.current;
    const avgDb = rmsSamplesRef.current.length
      ? rmsSamplesRef.current.reduce((a, b) => a + b, 0) / rmsSamplesRef.current.length
      : -60;
    const mean = avgDb;
    const variance = rmsSamplesRef.current.length
      ? rmsSamplesRef.current.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / rmsSamplesRef.current.length
      : 0;
    const volStdDb = Math.sqrt(variance);

    const sortedPitch = [...pitchSamplesRef.current].sort((a, b) => a - b);
    const median = sortedPitch.length ? sortedPitch[Math.floor(sortedPitch.length / 2)] : undefined;
    const q1 = sortedPitch.length ? sortedPitch[Math.floor(sortedPitch.length * 0.25)] : undefined;
    const q3 = sortedPitch.length ? sortedPitch[Math.floor(sortedPitch.length * 0.75)] : undefined;
    const iqr = q1 !== undefined && q3 !== undefined ? q3 - q1 : undefined;

    const words = (result?.transcript || "").trim().split(/\s+/).filter(Boolean).length;
    const wpm = durationMs > 0 ? Math.round((words / durationMs) * 60000) : undefined;

    const pauseCount = pauseDurMsRef.current.length;
    const avgPauseMs = pauseCount ? Math.round(pauseDurMsRef.current.reduce((a, b) => a + b, 0) / pauseCount) : 0;

    const tips: string[] = [];
    if (wpm && wpm > 180) tips.push("Slow down slightly (target ~130–160 WPM).");
    if (wpm && wpm < 110) tips.push("Speed up a bit to improve fluency (target ~130–160 WPM).");
    if (avgDb < -35) tips.push("Increase volume; you’re quite soft.");
    if (avgDb > -10) tips.push("Reduce volume; you’re quite loud.");
    if (volStdDb < 3) tips.push("Add more dynamic range (vary loudness).");
    if (iqr !== undefined && iqr < 20) tips.push("Increase pitch variation for better modulation.");
    if (avgPauseMs > 800) tips.push("Shorten long pauses to keep flow.");

    setMetrics({
      durationSec: Math.max(1, Math.round(durationMs / 1000)),
      wpm,
      avgDb: Math.round(avgDb * 10) / 10,
      volStdDb: Math.round(volStdDb * 10) / 10,
      pitchHzMedian: median ? Math.round(median) : undefined,
      pitchHzIQR: iqr ? Math.round(iqr) : undefined,
      pauseCount,
      avgPauseMs,
      tips,
    });
  };

  const playReference = async () => {
    setTtsError(null);
    setTtsLoading(true);
    try {
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: current.text, voice: 'pNInz6obpgDQGcFmaJgB' }) // Adam
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err?.error || 'TTS request failed');
      }
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: 'audio/mpeg' });
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      // play
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play().catch(() => {});
        }
      }, 0);
    } catch (e) {
      setTtsError(e instanceof Error ? e.message : 'Failed to play reference');
    } finally {
      setTtsLoading(false);
    }
  };

  const next = () => {
    setIdx((i) => Math.min(i + 1, list.length - 1));
    setResult(null);
    setError(null);
  };
  const prev = () => {
    setIdx((i) => Math.max(i - 1, 0));
    setResult(null);
    setError(null);
  };
  const reset = () => {
    setResult(null);
    setError(null);
    setMetrics(null);
    setTtsError(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Speech Training</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Minimal header: nav + mic device */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-muted-foreground">
              {permissionState === 'denied' && 'Mic blocked. Allow access in browser settings.'}
              {permissionState === 'prompt' && 'Mic permission not yet granted.'}
            </div>
            <div className="flex items-center gap-2">
              
              <Button variant="outline" onClick={prev} disabled={idx === 0}>Prev</Button>
              <Button variant="outline" onClick={next} disabled={idx === list.length - 1}>Next</Button>
            </div>
          </div>

          {/* Prompt */}
          <div className="p-4 rounded-lg border border-border bg-background">
            <p className="text-lg font-medium text-center">{current.text}</p>
            {current.phonetics && (
              <p className="text-xs text-center text-muted-foreground mt-2">{current.phonetics}</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {!recording ? (
              <Button onClick={start} className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-accent">
                <Mic className="h-4 w-4" /> Start
              </Button>
            ) : (
              <Button onClick={stop} className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700">
                <MicOff className="h-4 w-4" /> Stop
              </Button>
            )}
            <Button variant="outline" onClick={reset} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button variant="outline" onClick={playReference} disabled={ttsLoading || recording}>
              {ttsLoading ? 'Loading reference…' : 'Play reference'}
            </Button>
            <audio ref={audioRef} className="hidden" />
          </div>

          {ttsError && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{ttsError}</div>
          )}

          {/* Results */}
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-border bg-background min-h-[48px]">
              <p className="text-sm whitespace-pre-wrap">{result?.transcript || (recording ? "Listening..." : "Your speech will appear here...")}</p>
            </div>
            {result && (
              <div className="p-4 rounded-lg border border-border bg-isabelline-600">
                <div className="text-sm">Accuracy: <span className="font-semibold">{result.accuracy}%</span></div>
              </div>
            )}
          </div>

          {/* Prosody metrics (no AI, no edit) */}
          {metrics && (
            <div className="p-4 rounded-lg border border-border bg-background space-y-2">
              <div className="text-sm font-medium">Delivery feedback</div>
              <ul className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
                <li>Duration: {metrics.durationSec}s</li>
                {typeof metrics.wpm === 'number' && <li>Speaking rate: {metrics.wpm} WPM</li>}
                <li>Avg loudness: {metrics.avgDb} dBFS</li>
                <li>Loudness variation: {metrics.volStdDb} dB</li>
                {typeof metrics.pitchHzMedian === 'number' && <li>Median pitch: {metrics.pitchHzMedian} Hz</li>}
                {typeof metrics.pitchHzIQR === 'number' && <li>Pitch range (IQR): {metrics.pitchHzIQR} Hz</li>}
                <li>Pauses: {metrics.pauseCount} (avg {metrics.avgPauseMs} ms)</li>
              </ul>
              {metrics.tips.length > 0 && (
                <div className="text-sm text-muted-foreground">Tips: {metrics.tips.join("  •  ")}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SpeechTraining;
