import { useCallback } from "react";

let audioCtx: AudioContext | null = null;
const buffers = new Map<string, AudioBuffer>();
const loops = new Map<string, { src: AudioBufferSourceNode; gain: GainNode }>();

const stopLoop = (key: string) => {
  const entry = loops.get(key);
  if (entry) {
    try { entry.src.stop(); } catch {}
    loops.delete(key);
  }
};

export const useAudioManager = () => {
  const unlock = useCallback(() => {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }, []);

  const load = useCallback(async (key: string, url: string) => {
    if (!audioCtx || buffers.has(key)) return;
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    buffers.set(key, await audioCtx.decodeAudioData(arr));
  }, []);

  const play = useCallback((key: string, volume = 1.0) => {
    if (!audioCtx || !buffers.has(key)) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buffers.get(key)!;
    const gain = audioCtx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(audioCtx.destination);
    src.start();
  }, []);

  const loop = useCallback((key: string, volume = 1.0): (() => void) => {
    if (!audioCtx || !buffers.has(key)) return () => {};
    stopLoop(key);
    const src = audioCtx.createBufferSource();
    src.buffer = buffers.get(key)!;
    src.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(audioCtx.destination);
    src.start();
    loops.set(key, { src, gain });
    return () => stopLoop(key);
  }, []);

  const setLoopVolume = useCallback((key: string, volume: number) => {
    const entry = loops.get(key);
    if (entry) entry.gain.gain.value = volume;
  }, []);

  const stopAllLoops = useCallback(() => {
    loops.forEach(({ src }) => {
      try { src.stop(); } catch {}
    });
    loops.clear();
  }, []);

  return { unlock, load, play, loop, setLoopVolume, stopAllLoops };
};
