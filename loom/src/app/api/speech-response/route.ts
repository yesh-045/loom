import { NextResponse } from 'next/server';
import { getGeminiResponse } from '@/utils/getGeminiResponse';
import axios from 'axios';

export async function POST(req: Request) {
  const { text, voice = 'pNInz6obpgDQGcFmaJgB' } = await req.json(); // Default to Adam voice

  try {
    // Generate AI response first if text is a prompt rather than direct text
    let responseText = text;
    
    if (text.startsWith('AI:')) {
      // This is a prompt for AI response
      const prompt = text.substring(3).trim();
      responseText = await getGeminiResponse([{
        role: 'user',
        content: prompt
      }]);
    }

    // Convert to speech using ElevenLabs REST API
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        text: responseText,
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
    console.error('Error generating speech response:', error);
    return NextResponse.json({ error: 'Error generating speech response' }, { status: 500 });
  }
}
