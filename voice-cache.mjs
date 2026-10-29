import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const pending = new Map();
export async function thinkingClips(client, voiceId, modelId) {
  const id = createHash('sha256').update(`${voiceId}:${modelId}:murmurs-v1`).digest('hex');
  if (pending.has(id)) return pending.get(id);
  const job = (async () => {
    const folder = join(process.cwd(), '.cache', 'voice'); await mkdir(folder, { recursive: true });
    const clips = [];
    for (const [index, text] of ['Hmm…', 'Mmm…', 'Jaaa…', 'Jo jo…', 'Tjaaa…', 'Nååå…', 'Javel ja…', 'Nå, nå…', 'Måske…', 'Lad mig se…', 'Hør nu her…', 'Ja, for pokker…', 'Åh ja…', 'Mjo…'].entries()) {
      const path = join(folder, `${id}-${index}.mp3`); let bytes;
      try { bytes = await readFile(path); }
      catch (error) {
        if (error.code !== 'ENOENT') throw error;
        const audio = await client.textToSpeech.convert(voiceId, { text, modelId, outputFormat: 'mp3_44100_128', languageCode: 'da', voiceSettings: { stability: .5, similarityBoost: .75 } });
        const chunks = []; for await (const chunk of audio) chunks.push(Buffer.from(chunk));
        bytes = Buffer.concat(chunks); if (!bytes.length) throw new Error('Empty thinking clip');
        await writeFile(path, bytes);
      }
      clips.push(bytes.toString('base64'));
    }
    return clips;
  })();
  pending.set(id, job);
  try { return await job; } finally { pending.delete(id); }
}
