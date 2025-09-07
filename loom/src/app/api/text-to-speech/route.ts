import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  const { text, voice = 'pNInz6obpgDQGcFmaJgB' } = await req.json(); // Default to Adam voice

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        responseType: 'arraybuffer'
      }
    );

    return new Response(response.data, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': response.data.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json({ error: 'Error generating speech' }, { status: 500 });
  }
}