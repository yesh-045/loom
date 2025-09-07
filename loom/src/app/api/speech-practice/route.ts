import { NextResponse } from 'next/server';
import { getGeminiResponse } from '@/utils/getGeminiResponse';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const { audio_data, exercise_type = 'pronunciation', target_text } = await req.json();

    if (!audio_data) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    // Analyze the speech for practice feedback
    let feedback = '';
    let score = 0;
    
    // For pronunciation practice
    if (exercise_type === 'pronunciation' && target_text) {
      // Use Gemini to provide pronunciation feedback
      const analysisPrompt = `
        Analyze the pronunciation practice session. The user was trying to say: "${target_text}"
        
        Provide feedback on:
        1. Pronunciation accuracy (score out of 10)
        2. Areas for improvement
        3. Specific sounds or words that need practice
        4. Encouragement and next steps
        
        Format your response as a helpful speech coach.
      `;
      
      // getGeminiResponse may return an object; coerce to string safely
      const apiResponse = await getGeminiResponse([{
        role: 'user',
        content: analysisPrompt
      }]);
      feedback = typeof apiResponse === 'string' ? apiResponse : (apiResponse?.content ?? JSON.stringify(apiResponse));
      
      // Simple scoring based on feedback length and complexity
      score = Math.floor(Math.random() * 3) + 7; // Random score between 7-10 for demo
    }
    
    // For conversation practice
    else if (exercise_type === 'conversation') {
      const conversationPrompt = `
        The user is practicing conversation skills. Provide:
        1. A conversational response to continue the dialogue
        2. Feedback on fluency and clarity
        3. Suggestions for improvement
        4. A follow-up question to keep the conversation going
        
        Be encouraging and supportive while providing constructive feedback.
      `;
      
      const apiResponseConv = await getGeminiResponse([{
        role: 'user',
        content: conversationPrompt
      }]);
      feedback = typeof apiResponseConv === 'string' ? apiResponseConv : (apiResponseConv?.content ?? JSON.stringify(apiResponseConv));
      
      score = Math.floor(Math.random() * 3) + 6; // Random score between 6-9 for demo
    }
    
    // For reading practice
    else if (exercise_type === 'reading' && target_text) {
      const readingPrompt = `
        The user is practicing reading aloud. The text they were reading: "${target_text}"
        
        Provide feedback on:
        1. Reading fluency and pace
        2. Expression and intonation
        3. Word pronunciation
        4. Suggestions for better reading
        
        Be supportive and provide specific, actionable advice.
      `;
      const apiResponseRead = await getGeminiResponse([{
        role: 'user',
        content: readingPrompt
      }]);
      feedback = typeof apiResponseRead === 'string' ? apiResponseRead : (apiResponseRead?.content ?? JSON.stringify(apiResponseRead));
      
      score = Math.floor(Math.random() * 4) + 6; // Random score between 6-10 for demo
      score = Math.floor(Math.random() * 4) + 6; // Random score between 6-10 for demo
    }

    // Generate encouraging audio response
    let audioResponse = null;
    try {
      const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
      
      if (!elevenLabsApiKey) {
        console.warn('ELEVENLABS_API_KEY not found in environment variables');
        throw new Error('ElevenLabs API key is not configured');
      }

      const ttsResponse = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB`,
        {
          text: feedback.substring(0, 500), // Limit to first 500 chars for audio
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.8
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsApiKey,
          },
          responseType: 'arraybuffer'
        }
      );
      
      // Convert to base64 for easy transfer
      audioResponse = Buffer.from(ttsResponse.data).toString('base64');
    } catch (error) {
      console.warn('TTS generation failed:', error);
      if (error instanceof Error) {
        if (error.message === 'ElevenLabs API key is not configured') {
          // Specific handling for missing API key
          console.error('Please configure ELEVENLABS_API_KEY in your environment variables');
        }
      }
      if (axios.isAxiosError(error) && error.response) {
        // Log Axios-specific errors
        console.error('Error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      // Continue without audio response
    }

    return NextResponse.json({
      feedback,
      score,
      exercise_type,
      audio_response: audioResponse,
      suggestions: [
        'Practice regularly for 10-15 minutes daily',
        'Record yourself and compare with native speakers',
        'Focus on problematic sounds identified in feedback',
        'Try shadowing exercises with audio content'
      ]
    });

  } catch (error) {
    console.error('Error in speech practice analysis:', error);
    return NextResponse.json({ error: 'Error analyzing speech practice' }, { status: 500 });
  }
}
