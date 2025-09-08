import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  const { 
    text, 
    voice = 'pNInz6obpgDQGcFmaJgB', // Default to Adam voice
    stability = 0.5,
    similarity_boost = 0.5,
    model = 'eleven_monolingual_v1'
  } = await req.json();

  // Validate input
  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
  }

  try {
    // For speech training, we might want different voice settings
    const voiceSettings = {
      stability: Math.max(0, Math.min(1, stability)),
      similarity_boost: Math.max(0, Math.min(1, similarity_boost)),
      style: 0.0,
      use_speaker_boost: true
    };

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      {
        text: text.trim(),
        model_id: model,
        voice_settings: voiceSettings
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout
      }
    );

    return new Response(response.data, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': response.data.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse = (error as { response?: { data?: unknown; status?: number } }).response;
      const errorCode = (error as { code?: string }).code;
      
      console.error('Error generating speech:', errorResponse?.data || errorMessage);
      
      // Provide more specific error messages
      if (errorResponse?.status === 401) {
        return NextResponse.json({ error: 'Invalid ElevenLabs API key' }, { status: 401 });
      } else if (errorResponse?.status === 429) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
      } else if (errorCode === 'ECONNABORTED') {
        return NextResponse.json({ error: 'Request timeout. Please try again.' }, { status: 408 });
      }
      
      return NextResponse.json({ 
        error: 'Error generating speech', 
        details: (errorResponse?.data as { detail?: string })?.detail || errorMessage 
      }, { status: 500 });
    }
}