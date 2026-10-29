// RMS follows the audio actually being played, including pauses and laughter.
export function jawFromSamples(samples, sensitivity = 2.4) {
  if (!samples.length) return 0;
  let energy = 0;
  for (const sample of samples) energy += sample * sample;
  const rms = Math.sqrt(energy / samples.length);
  return Math.min(1, Math.max(0, (rms - 0.008) * 9 * sensitivity));
}
export function speechText(text, model) {
  return model === 'eleven_multilingual_v2' ? text.replace(/\[[^\]]*\]/g, '').trim() : text.trim();
}
