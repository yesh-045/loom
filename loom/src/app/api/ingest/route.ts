import { NextRequest, NextResponse } from 'next/server';
import { getGeminiResponse } from '@/utils/getGeminiResponse';
import type { ChatMessage } from '@/lib/types';

// Ensure this route uses the Node.js runtime (needed for pdf-parse, cheerio etc.)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isYouTubeUrl(url: string) {
  return /youtu\.be\//.test(url) || /youtube\.com\/watch\?v=/.test(url);
}

function extractYouTubeId(url: string): string | null {
  const short = url.match(/youtu\.be\/([\w-]+)/);
  if (short?.[1]) return short[1];
  const long = url.match(/[?&]v=([\w-]+)/);
  return long?.[1] ?? null;
}

async function fetchTextFromUrl(url: string): Promise<string> {
  if (isYouTubeUrl(url)) {
    const id = extractYouTubeId(url);
    if (!id) throw new Error('Invalid YouTube URL');
    const { YoutubeTranscript } = await import('youtube-transcript');
    const items = await YoutubeTranscript.fetchTranscript(id).catch(() => [] as Array<{ text: string } | undefined>);
    if (items && items.length > 0) {
      return items.map((i) => (i?.text || '')).join(' ').replace(/\s+/g, ' ').trim();
    }
    // Fallback: fetch page HTML and extract title/meta description/content
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const { load } = await import('cheerio');
    const $ = load(html);
    const title = $('meta[property="og:title"]').attr('content') || $('title').first().text();
    const desc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    const text = [title, desc].filter(Boolean).join('\n');
    if (text.trim().length > 0) return text;
    throw new Error('No captions found for this video');
  }
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const { load } = await import('cheerio');
  const $ = load(html);
  // Basic content extraction: title + headings + paragraphs
  const parts: string[] = [];
  const title = $('title').first().text();
  if (title) parts.push(`# ${title}`);
  $('h1,h2,h3,p,li').each((_: number, el: unknown) => {
    const text = $(el).text().trim();
    if (text) parts.push(text);
  });
  return parts.join('\n');
}

async function fetchTextFromPdf(file: ArrayBuffer): Promise<string> {
  // Use the legacy ESM build in Node and disable the worker to avoid dynamic import issues
  let pdfjs: unknown;
  try {
    // Prefer the legacy build in Node to avoid worker issues
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch {
    throw new Error('PDF parser is not available');
  }

  const { getDocument } = pdfjs as {
    getDocument: (src: unknown) => {
      promise: Promise<{
        numPages: number;
        getPage: (n: number) => Promise<{
          getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
        }>;
      }>;
    };
  };
  const uint8 = new Uint8Array(file);
  // Some flags reduce Node-specific pitfalls (fonts/eval aren’t needed for text extraction)
  const loadingTask = getDocument({
    data: uint8,
    disableWorker: true,
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
  } as unknown);
  const pdf = await loadingTask.promise;
  const out: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = (content.items || [])
      .map((it: { str?: string }) => (typeof it?.str === 'string' ? it.str : ''))
      .filter(Boolean);
    const text = strings.join(' ').replace(/\s+/g, ' ').trim();
    if (text) out.push(text);
  }
  return out.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
  let text = '';
  let source: 'url' | 'pdf' | 'unknown' = 'unknown';

  if (contentType.includes('application/json')) {
      const { url } = await req.json();
      if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });
      try {
        text = await fetchTextFromUrl(url);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/No captions found for this video/i.test(msg)) {
          return NextResponse.json({ error: 'No captions found for this YouTube video. Try another link or upload a PDF/webpage with text.' }, { status: 422 });
        }
        throw err;
      }
  source = 'url';
    } else if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (!file || typeof file === 'string') return NextResponse.json({ error: 'Missing file' }, { status: 400 });
      const arrayBuf = await (file as File).arrayBuffer();
      const filename = (file as File).name.toLowerCase();
  if (filename.endsWith('.pdf')) { text = await fetchTextFromPdf(arrayBuf); source = 'pdf'; }
      else return NextResponse.json({ error: 'Only PDF supported in upload for now' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Unsupported content-type' }, { status: 415 });
    }

    if (!text || text.length < 50) {
      return NextResponse.json({ error: 'Not enough content to extract study kit' }, { status: 422 });
    }

    // Light heuristic: extract headings & bullets
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const headings = lines.filter(l => /^#{1,3}\s|^[A-Z][^.!?]{0,80}$/.test(l)).slice(0, 10);
    const bullets = lines.filter(l => /^[-*•]\s|^\d+\./.test(l)).slice(0, 30);
    const paragraphs = lines.filter(l => !headings.includes(l) && !bullets.includes(l)).slice(0, 20);

  // Build slides outline: 1 title + a few content slides (heuristic baseline)
  let slides: Array<{ type: string; content: Record<string, unknown> }> = [
      { type: 'Header & Subheader Slide', content: { title: headings[0] || 'Overview', subtitle: headings[1] || 'Key Points' } },
      { type: 'Enumeration Slide', content: { title: 'Highlights', bullets: bullets.slice(0, 5).map(b => b.replace(/^[-*•]\s|^\d+\./, '').trim()) || ['Point 1','Point 2','Point 3'] } },
      { type: 'Paragraph Slide', content: { paragraph: paragraphs.slice(0, 3).join(' ') || 'Summary of the content.' } },
    ];

  // 10 flashcards (heuristic baseline)
  const terms = headings.concat(bullets.map(b => b.replace(/^[-*•]\s|^\d+\./, '').trim())).slice(0, 10);
  let flashcards = terms.map((t, i) => ({ term: t || `Concept ${i + 1}`, definition: paragraphs[i] || 'Explain this concept in your own words.' }));

  // Quiz is not needed for URL ingestion; only for PDF.
  const includeQuiz = source === 'pdf';
  let quiz: Array<{ questionText: string; choices: Array<{ text: string; isCorrect: boolean }> }> | undefined = undefined;
  if (includeQuiz) {
    // 5-question quiz from bullets/paragraphs (heuristic baseline)
    quiz = Array.from({ length: 5 }).map((_, i) => ({
      questionText: `Question ${i + 1}: ${bullets[i] ? bullets[i].replace(/^[-*•]\s|^\d+\./, '').trim() : 'From the content above'}`,
      choices: [
        { text: 'Correct answer', isCorrect: true },
        { text: 'Distractor 1', isCorrect: false },
        { text: 'Distractor 2', isCorrect: false },
        { text: 'Distractor 3', isCorrect: false },
      ],
    }));
  }

    // Summary & keynotes (heuristic)
    const paraJoin = paragraphs.join(' ');
  let summary = paraJoin.slice(0, 500);
    // try to end on sentence boundary
    const lastDot = summary.lastIndexOf('.');
    if (lastDot > 200) summary = summary.slice(0, lastDot + 1);
    if (!summary) summary = (headings[0] || 'Overview') + ': ' + (bullets.slice(0,3).map(b=>b.replace(/^[-*•]\s|^\d+\./,'').trim()).join('; ') || 'Key points');

    const keynotesRaw = bullets
      .map(b => b.replace(/^[-*•]\s|^\d+\./, '').trim())
      .filter(Boolean);
    const unique: string[] = [];
    for (const k of keynotesRaw) {
      if (!unique.find(x => x.toLowerCase() === k.toLowerCase())) unique.push(k);
      if (unique.length >= 8) break;
    }
    let keynotes = (unique.length ? unique : headings.slice(0,5)).slice(0, 8);

    // If possible, upgrade quality using Gemini (tools for slides/flashcards/quiz; text for summary/keynotes)
    try {
      if (process.env.GEMINI_API_KEY) {
        const base: ChatMessage[] = [{ role: 'user', content: `Content to study:\n\n${text}\n` }];

        // 1) Summary + keynotes (request strict JSON)
        try {
          const messages1: ChatMessage[] = [
            ...base,
            { role: 'user', content: 'Summarize the content in no more than 120 words and list 6-10 punchy keynotes. Return ONLY valid JSON with keys: "summary" (string) and "keynotes" (string array). No extra text.' }
          ];
          const r1 = await getGeminiResponse(messages1);
          try {
            const parsed = JSON.parse(r1.content || '{}');
            if (parsed?.summary && Array.isArray(parsed?.keynotes) && parsed.keynotes.length) {
              summary = String(parsed.summary);
              keynotes = parsed.keynotes.slice(0, 10).map((s: unknown) => String(s));
            }
          } catch { /* ignore JSON parse and keep heuristic */ }
        } catch { /* ignore */ }

        // 2) Slides (7 slides, enforced allowed types)
        try {
          const messages2: ChatMessage[] = [
            ...base,
            { role: 'user', content: 'Create a 7-slide presentation covering the main ideas. Use only the allowed slide types and fill all required fields with high-quality, concise content.' }
          ];
          const r2 = await getGeminiResponse(messages2);
          if (r2.contentType === 'ppt' && r2.content) {
            const args = JSON.parse(r2.content);
            if (Array.isArray(args?.slides) && args.slides.length) {
              slides = args.slides;
            }
          }
        } catch { /* keep heuristic */ }

        // 3) Flashcards (12 cards, clear definitions)
        try {
          const messages3: ChatMessage[] = [
            ...base,
            { role: 'user', content: 'Create 12 high-quality flashcards with clear, student-friendly definitions. Focus on the most important terms. Keep each definition 1-2 sentences.' }
          ];
          const r3 = await getGeminiResponse(messages3);
          if (r3.contentType === 'flashcards' && r3.content) {
            const args = JSON.parse(r3.content);
            if (Array.isArray(args?.flashcards) && args.flashcards.length) {
              flashcards = args.flashcards;
            }
          }
        } catch { /* keep heuristic */ }

        // 4) Quiz (only when includeQuiz)
        if (includeQuiz) {
          try {
            const messages4: ChatMessage[] = [
              ...base,
              { role: 'user', content: 'Create 7 multiple-choice questions (4 options, exactly 1 correct). Make them self-contained, specific, and non-trivial. Vary coverage across topics.' }
            ];
            const r4 = await getGeminiResponse(messages4);
            if (r4.contentType === 'quiz' && r4.content) {
              const args = JSON.parse(r4.content);
              if (Array.isArray(args?.questions) && args.questions.length) {
                quiz = args.questions;
              }
            }
          } catch { /* keep heuristic */ }
        }
      }
    } catch (e) {
      console.warn('Gemini upgrade skipped due to error:', e);
    }

    // Return a normalized study kit; your front-end can route pieces to components
    const payload: Record<string, unknown> = {
      textPreview: text.slice(0, 1000),
      summary,
      keynotes,
      slides,
      flashcards,
    };
    if (includeQuiz && quiz) {
      payload.questions = quiz;
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error('Ingest error:', e);
    return NextResponse.json({ error: 'Failed to ingest content' }, { status: 500 });
  }
}

// Lightweight GET for quick health-check/debugging in browser
export async function GET() {
  return NextResponse.json({ ok: true });
}
