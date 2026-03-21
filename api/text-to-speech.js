// Text-to-Speech via ElevenLabs API
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
// Rachel voice — warm, professional French female
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!ELEVENLABS_KEY) return res.status(500).json({ error: 'ELEVENLABS_API_KEY missing' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });

  // Strip markdown formatting for cleaner speech
  const cleanText = text
    .replace(/\*\*/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/•/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs ${response.status}: ${errText}`);
    }

    // Stream the audio back as MP3
    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    return res.status(200).send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS error:', error);
    return res.status(500).json({ error: error.message });
  }
}
