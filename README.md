# Kaptajn Knogle

Kun kraniet og én knap: **Start samtale / Stop samtale**.

## Start
Kopier `.env.example` og omdøb til `.env`
Du skal bare ændre de her nøgler:

```dotenv
ELEVENLABS_API_KEY=din_nøgle
OPENAI_API_KEY=din_nøgle
```

OpenAI-nøglen skal have adgang til **Responses** og **Audio Transcriptions**. ElevenLabs-nøglen behøver kun **Text to Speech**. Ingen agent eller Ollama er nødvendig.

```sh
npm install
npm run dev
```

Åbn http://localhost:5173 i en opdateret Firefox, Chrome, Edge eller Safari. Klik **Start samtale**, tillad mikrofonen, og tal dansk. Hold cirka to tredjedele sekunds pause, når du er færdig. Han svarer med din ElevenLabs-stemme og lytter derefter igen. Maksimalt 15 sekunder pr. replik.

**Efter en opdatering eller ændring i `.env`:** Stop den gamle server med Ctrl+C, kør `npm run dev` igen, og genindlæs siden. Appen bygges ved opstart og bruger ingen Vite WebSocket eller hot reload. Genstart også efter kodeændringer.

## Mikrofon og tale

Appen bruger `getUserMedia` og `MediaRecorder`, ikke browserens `SpeechRecognition`. Det gør mikrofonfunktionen tilgængelig i Firefox. Den registrerer taleaktivitet ud fra lydstyrken og sender en kort optagelse til OpenAI med sprog `da`. Stilhed sendes ikke. Meget baggrundsstøj kan udløse en optagelse; brug appen et roligt sted med mikrofonen tæt på gæsten.

OpenAI transskriberer med `gpt-4o-mini-transcribe` og laver danske svar med karakterprompten fra `src/character.js`. ElevenLabs læser svarene højt. Kæben følger den faktisk afspillede lyd. Transskription og svar laves først. Stemmen streames derefter direkte som 24 kHz PCM og afspilles, så snart de første lydpakker kommer, mens resten stadig genereres. Voice ID, stemmemodel og stemmeindstillinger er uændrede. Der ventes 650 ms stilhed for at afslutte din replik og 180 ms efter hans svar, før mikrofonen aktiveres igen. Længere pauser midt i din sætning kan derfor afslutte din tur. Browserkonsollen viser transskriptionstid, svartid og tid til første lydpakke uden at logge tekst eller nøgler. Netværk og API-belastning påvirker stadig svartiden.

Mikrofonsporet deaktiveres under behandling og afspilning, så kaptajnen ikke svarer sig selv. Du kan ikke afbryde ham med stemmen under afspilning. **Stop samtale** eller **Escape** stopper mikrofon, ventende browserforespørgsler og lyd. En API-forespørgsel, der allerede er sendt, kan stadig koste credits.

**F** eller den lille knap øverst til højre skifter til fuldskærm. Her vises kun kraniet på sort baggrund, uden knapper, status eller musemarkør. Mens et svar forberedes, vises en lille animeret tankeboble uden ord. Ingen tænkelyde eller undertekster. Du kan afbryde svaret ved at tale; mikrofonen forbliver aktiv, og igangværende lyd og forespørgsler stoppes. Browserens ekkofjernelse hjælper med at undgå, at han afbryder sig selv; høj højttalerlyd tæt på mikrofonen kan stadig give falske afbrydelser. Fejl forlader fuldskærm, så fejlbeskeden kan læses. Browseren kan bruge første Escape til at forlade fuldskærm; tryk igen for at stoppe samtalen.

## Fejlfinding

- **Gammel Vite/WebSocket-fejl:** Stop og genstart serveren, og genindlæs siden. Den nye app har ingen udviklings-WebSocket. `/api/config` skal vise `"version":3`.
- **Mikrofon afvist:** Tillad mikrofonen i browserens tilladelser for localhost.
- **OpenAI afviser transskription:** Tillad Audio Transcriptions på nøglen, og kontrollér API-saldo/modeladgang.
- **Ingen reaktion på tale:** Tjek browserens valgte mikrofon og OS-mikrofontilladelse. Tal tættere på mikrofonen, og hold pause efter replikken.
- **Manglende nøgler:** Udfyld `.env`, og genstart serveren. Nøgler vises aldrig i browseren.

Mikrofonoptagelser sendes til OpenAI. Svartekst sendes til ElevenLabs. Begge bruger API-betaling og kræver internet. Appen gemmer ikke lyd eller samtaler på disk; de seneste seks udvekslinger ligger i browserens hukommelse under samtalen. Provideres datavilkår gælder stadig. OpenAI Responses kaldes med `store: false`.

## Kontrol

```sh
npm test
npm run build
npm start
```

`npm start` bruger det eksisterende build. Serveren binder kun til `127.0.0.1`.
