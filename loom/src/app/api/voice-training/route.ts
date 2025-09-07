import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const { name, description, files } = await req.json();

    if (!name || !files || files.length === 0) {
      return NextResponse.json({ error: 'Name and audio files are required' }, { status: 400 });
    }

    // Clone a voice using ElevenLabs API
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/voices/add',
      {
        name: name,
        description: description || `Custom voice created for ${name}`,
        files: files, // Array of audio file data
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
      }
    );

    return NextResponse.json({
      voice_id: response.data.voice_id,
      message: 'Voice cloned successfully',
    });
  } catch (error) {
    console.error('Error cloning voice:', error);
    return NextResponse.json({ error: 'Error cloning voice' }, { status: 500 });
  }
}

// Get list of available voices
export async function GET() {
  try {
    const response = await axios.get(
      'https://api.elevenlabs.io/v1/voices',
      {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching voices:', error);
    return NextResponse.json({ error: 'Error fetching voices' }, { status: 500 });
  }
}
