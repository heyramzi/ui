/** How many peaks a second of audio becomes. Enough that a zoom to 400px a second stays sharp. */
export const PEAKS_PER_SECOND = 100;
const MAX_PEAKS = 60_000;
/** A larger file is a long-form render. Downloading it whole to draw one lane isn't worth it. */
const MAX_BYTES = 200 * 1024 * 1024;

/** The loudest sample in each slice of `data`, `PEAKS_PER_SECOND` slices to the second. */
export function peaksOf(data: Float32Array, seconds: number): Float32Array {
  const count = Math.min(MAX_PEAKS, Math.max(1, Math.ceil(seconds * PEAKS_PER_SECOND)));
  const peaks = new Float32Array(count);
  const size = Math.max(1, Math.floor(data.length / count));
  // WHY: every 8th sample is plenty to find a peak, and a minute of audio has millions.
  const stride = Math.max(1, Math.min(8, size));
  for (let i = 0; i < count; i++) {
    let max = 0;
    for (let j = i * size; j < Math.min(data.length, (i + 1) * size); j += stride)
      max = Math.max(max, Math.abs(data[j] ?? 0));
    peaks[i] = max;
  }
  return peaks;
}

/** Decode a video's audio into peaks. Null on any failure: the lane just stays empty. */
export async function decodePeaks(src: string, signal: AbortSignal): Promise<Float32Array | null> {
  try {
    const response = await fetch(src, { signal });
    if (!response.ok || Number(response.headers.get("content-length") ?? 0) > MAX_BYTES)
      return null;
    const audio = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(
      await response.arrayBuffer(),
    );
    return signal.aborted ? null : peaksOf(audio.getChannelData(0), audio.duration);
  } catch {
    return null;
  }
}
