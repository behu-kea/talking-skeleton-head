export async function openAIError(response) {
  const body = await response.json().catch(() => ({}));
  if (body.error?.code === 'insufficient_quota') return 'OpenAI-kontoen mangler API-kredit eller har nået sin budgetgrænse. Tjek Billing på platform.openai.com. Et ChatGPT-abonnement betaler ikke API-forbruget.';
  if (response.status === 429) return 'OpenAI har nået en forbrugs- eller hastighedsgrænse. Tjek API-saldo og grænser, eller prøv igen om lidt.';
  if ([401,403].includes(response.status)) return 'OpenAI afviste adgang. Tjek API-nøglen og tilladelser til Responses og Audio Transcriptions.';
  return 'OpenAI kunne ikke behandle forespørgslen. Tjek modeladgang og prøv igen.';
}
export function elevenError(error) {
  const message = JSON.stringify(error.body ?? '') + String(error.message ?? '');
  if (/free_users_not_allowed|creator tier/i.test(message)) return 'Den valgte ElevenLabs-stemme kræver Creator-abonnement eller højere. Vælg en stemme, din konto har adgang til, og opdatér ELEVENLABS_VOICE_ID i .env. Genstart derefter appen.';
  if ([401,403].includes(error.statusCode)) return 'ElevenLabs afviste adgang. Tjek API-nøglen og Text to Speech-tilladelsen.';
  if (error.statusCode === 429) return 'ElevenLabs-grænsen er nået. Tjek saldoen eller prøv igen senere.';
  return 'ElevenLabs kunne ikke lave stemmen. Tjek stemmens adgang, model og API-saldo.';
}
