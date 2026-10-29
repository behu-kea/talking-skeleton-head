import 'dotenv/config';
import { thinkingClips } from './voice-cache.mjs';
import { openAIError, elevenError } from './src/api-errors.js';
import http from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { speechText } from './src/audio.js';
import { conversationInput, responseBody, responseText } from './src/chat.js';

const port = Number(process.env.PORT || 5173);
const production = process.argv.includes('--production');
const key = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;
const openaiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_v3';
const client = key ? new ElevenLabsClient({ apiKey: key }) : null;
// Build once on startup: no dev WebSocket/HMR connection needed for this local appliance.
if (!production) await (await import('vite')).build();
const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
async function readJson(req) {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 40000) throw Object.assign(new Error('Teksten er for lang.'), { statusCode: 413 });
  }
  try { return JSON.parse(data); } catch { throw Object.assign(new Error('Ugyldig forespørgsel.'), { statusCode: 400 }); }
}
const server = http.createServer(async (req, res) => {
  // Local-only server: protect cost-incurring routes against other websites.
  const host = req.headers.host;
  const allowedHosts = [`localhost:${port}`, `127.0.0.1:${port}`];
  if (!allowedHosts.includes(host)) return json(res, 403, { error: 'Local access only.' });
  const path = new URL(req.url, `http://${host}`).pathname;
  if (path.startsWith('/api/')) {
    if (req.headers.origin && !allowedHosts.some(h => req.headers.origin === `http://${h}`)) return json(res, 403, { error: 'Origin not allowed.' });
    try {
      if (path === '/api/config' && req.method === 'GET') return json(res, 200, { version: 3, hasKey: Boolean(key), hasVoice: Boolean(voiceId), hasOpenAI: Boolean(openaiKey), modelId });
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
      if (!client) return json(res, 503, { error: 'Tilføj ELEVENLABS_API_KEY i .env og genstart appen.' });
      if (path === '/api/murmurs') {
        if (!voiceId) return json(res, 503, { error: 'Voice ID mangler.' });
        return json(res, 200, { clips: await thinkingClips(client, voiceId, modelId) });
      }
      if (path === '/api/transcribe') {
        if (!openaiKey) return json(res, 503, { error: 'Tilføj OPENAI_API_KEY i .env og genstart appen.' });
        const mime = (req.headers['content-type'] || '').split(';')[0];
        if (!['audio/webm', 'audio/mp4'].includes(mime)) return json(res, 415, { error: 'Lydformatet understøttes ikke.' });
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 5 * 1024 * 1024) return json(res, 413, { error: 'Optagelsen er for stor. Prøv en kortere replik.' });
          chunks.push(chunk);
        }
        if (!size) return json(res, 400, { error: 'Optagelsen var tom. Prøv igen.' });
        const form = new FormData();
        form.append('file', new Blob(chunks, { type: mime }), mime === 'audio/mp4' ? 'speech.mp4' : 'speech.webm');
        form.append('model', 'gpt-4o-mini-transcribe'); form.append('language', 'da');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 45000);
        const cancel = () => { if (!res.writableEnded) controller.abort(); }; res.on('close', cancel);
        try {
          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${openaiKey}` }, body: form, signal: controller.signal });
          if (!response.ok) return json(res, 502, { error: await openAIError(response) });
          const data = await response.json();
          return json(res, 200, { text: typeof data.text === 'string' ? data.text.trim().slice(0,1500) : '' });
        } catch { if (!res.destroyed) return json(res, 502, { error: 'Transskription mislykkedes eller tog for lang tid. Tjek internet og prøv igen.' }); }
        finally { clearTimeout(timer); res.removeListener('close', cancel); }
        return;
      }
      if (path === '/api/speak') {
        if (!voiceId) return json(res, 503, { error: 'Tilføj ELEVENLABS_VOICE_ID i .env og genstart appen.' });
        const body = await readJson(req);
        if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 2500) return json(res, 400, { error: 'Skriv mellem 1 og 2500 tegn.' });
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 90000);
        const cancel = () => { if (!res.writableEnded) controller.abort(); }; res.on('close', cancel);
        try {
          const audio = await client.textToSpeech.stream(voiceId, {
            text: speechText(body.text, modelId), modelId, languageCode: 'da', outputFormat: 'pcm_24000',
            voiceSettings: { stability: 0.5, similarityBoost: 0.75, ...(modelId === 'eleven_multilingual_v2' ? { style: 0.7, useSpeakerBoost: true } : {}) },
          }, { abortSignal: controller.signal });
          if (res.destroyed) return;
          res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'X-Audio-Sample-Rate': '24000', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
          // Forward each generated chunk immediately, with backpressure and cancellation.
          await pipeline(Readable.fromWeb(audio), res, { signal: controller.signal });
        } finally { clearTimeout(timer); res.removeListener('close', cancel); }
        return;
      }
      if (path === '/api/chat') {
        if (!openaiKey) return json(res, 503, { error: 'Tilføj OPENAI_API_KEY i .env og genstart appen.' });
        let input;
        try { input = conversationInput(await readJson(req)); }
        catch (error) { return json(res, 400, { error: error.message }); }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 45000);
        const cancel = () => { if (!res.writableEnded) controller.abort(); };
        res.on('close', cancel);
        try {
          const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST', headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(responseBody(input, openaiModel)), signal: controller.signal,
          });
          if (!response.ok) return json(res, 502, { error: await openAIError(response) });
          return json(res, 200, { text: responseText(await response.json()) });
        } catch (error) {
          if (!res.destroyed) return json(res, 502, { error: controller.signal.aborted ? 'OpenAI svarede ikke i tide. Prøv igen.' : 'Kunne ikke hente et svar fra OpenAI. Tjek internet og prøv igen.' });
        } finally { clearTimeout(timer); res.removeListener('close', cancel); }
        return;
      }
      return json(res, 404, { error: 'Not found.' });
    } catch (error) {
      if (res.headersSent || res.destroyed) { res.destroy(); return; }
      const status = error.statusCode;
      // Return actionable messages without exposing provider request details.
      return json(res, status === 413 ? 413 : 502, { error: status === 413 ? 'Optagelsen eller teksten er for stor.' : elevenError(error) });
    }
  }

  const root = resolve('dist');
  let file;
  try { file = resolve(root, '.' + decodeURIComponent(path === '/' ? '/index.html' : path)); } catch { res.writeHead(400); return res.end(); }
  if (!file.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
  try { const data = await readFile(file); res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); }
  catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Kaptajn Knogle → http://localhost:${port}`));
