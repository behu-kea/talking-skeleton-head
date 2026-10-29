import { characterPrompt } from './character.js';

export function conversationInput(body) {
  if (!body || typeof body.text !== 'string' || !body.text.trim() || body.text.length > 1500) throw new Error('Skriv eller sig mellem 1 og 1500 tegn.');
  const history = body.history ?? [];
  if (!Array.isArray(history) || history.length > 12 || history.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 2500)) throw new Error('Ugyldig samtalehistorik. Start en ny samtale.');
  return [...history.map(({ role, content }) => ({ role, content })), { role: 'user', content: body.text.trim() }];
}
export function responseText(data) {
  const text = (data.output ?? []).filter(item => item.type === 'message').flatMap(item => item.content ?? []).filter(item => item.type === 'output_text').map(item => item.text).join('\n').trim();
  if (!text || data.status === 'incomplete') throw new Error('OpenAI gav ikke et færdigt svar. Prøv igen med en kortere replik.');
  return text.slice(0, 2500);
}
export function responseBody(input, model) {
  return {
    model, store: false, input, max_output_tokens: 300,
    instructions: characterPrompt + '\nSvar kun med den replik, der skal læses højt. Altid dansk, også hvis gæsten taler engelsk. Højst 2 korte sætninger og normalt under 45 ord. Ingen markdown eller beskrivelser af handlinger. Brug højst ét af lydmærkerne [laughs], [whispers], [shouts], når det passer. Besvar gæstens konkrete replik, og husk samtalens sammenhæng.',
  };
}
