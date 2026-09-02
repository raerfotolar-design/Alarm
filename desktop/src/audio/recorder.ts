/**
 * Captures the microphone as 16 kHz mono WAV segments — the format whisper.cpp wants,
 * built here so the app needs no ffmpeg. MediaRecorder is deliberately not used: its
 * webm/opus output would have to be transcoded before whisper could read it.
 */

const TARGET_SAMPLE_RATE = 16_000;
const SEGMENT_SECONDS = 12;
/** Below this the segment is silence or room noise and is not worth transcribing. */
const SILENCE_RMS = 0.006;

export interface RecorderHandle {
  stop: () => void;
}

function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return new Uint8Array(buffer);
}

export function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

export function isSilent(samples: Float32Array): boolean {
  return rms(samples) < SILENCE_RMS;
}

/**
 * Starts listening and hands each finished segment to `onSegment`. Resolves once the
 * microphone is live, or rejects when permission is refused or no device exists.
 */
export async function startRecording(onSegment: (wav: Uint8Array) => void): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });

  const context = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);

  let chunks: Float32Array[] = [];
  let collected = 0;
  const samplesPerSegment = TARGET_SAMPLE_RATE * SEGMENT_SECONDS;

  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    collected += event.inputBuffer.length;
    if (collected < samplesPerSegment) return;

    const segment = new Float32Array(collected);
    let offset = 0;
    for (const chunk of chunks) {
      segment.set(chunk, offset);
      offset += chunk.length;
    }
    chunks = [];
    collected = 0;

    if (!isSilent(segment)) onSegment(encodeWav(segment, context.sampleRate));
  };

  source.connect(processor);
  // A ScriptProcessor only runs while connected to the graph; a zero-gain sink keeps
  // it alive without playing the microphone back through the speakers.
  const silentGain = context.createGain();
  silentGain.gain.value = 0;
  processor.connect(silentGain);
  silentGain.connect(context.destination);

  return {
    stop: () => {
      processor.disconnect();
      silentGain.disconnect();
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      void context.close();
    },
  };
}

export const __test__ = { encodeWav, TARGET_SAMPLE_RATE, SEGMENT_SECONDS };
