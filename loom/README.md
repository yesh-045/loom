

<p align='center'>
	<img src="public/logo.png" alt="Loomyn logo" width="120" />
</p>
<h1 align='center'>Loomyn</h1>
<p align='center'>
	<em>Redefining learning through AI-driven interactivity.</em>
</p>

Loomyn is an AI-powered study workspace that turns static content into interactive learning: generate flashcards, build quizzes and slides, sketch on an AI canvas, run physics simulations, and practice speech — all from your own inputs like URLs, PDFs, or images.

## The problem Loomyn solves

Education still leans on static, one-size-fits-all materials. Learners routinely face:

- Low engagement and poor retention from text-only study
- Limited personalization; scarce adaptive feedback
- Difficulty visualizing abstract concepts in science and math
- Minimal access to real‑time feedback in language practice

Evidence underscores the gap:

- Studies show interactive methods significantly outperform text-only study for retention (e.g., Lyra et al., IEEE)
- The global digital learning market is projected to grow from $332.6B (2022) to $973.4B by 2030 (CAGR ~14%, Zion Market Research)

## Our solution: Loomyn

Loomyn transforms AI-powered education into an interactive, adaptive platform. It enables:

- Tailored flashcards, quizzes, and slides from the learner’s own material
- An AI canvas to sketch problems with step‑by‑step explanation
- A physics simulator for hands-on experimentation with scientific concepts
- Speech and voice tools for pronunciation, listening, and speaking
- Spelling and language challenges for gamified skill‑building

This shifts learning from passive consumption to active, personalized experience. By merging personalization, interactivity, and AI-driven adaptability, Loomyn bridges the gap between traditional education and modern learners’ needs — enabling deeper understanding, stronger retention, and a more empowering study journey.

## Product tour (core features)

- Import anything: paste a YouTube or web URL, upload a PDF, or send an image — get a study kit with summary, keynotes, slides, and flashcards; PDFs also generate quizzes
- AI Chat: conversational study with tool-calling for slides, quizzes, flashcards, canvas, physics, and TTS
- AI Canvas: draw or sketch concepts; get generated step-by-step visual explanations
- Physics Simulator: explore motion, gravity, waves, and collisions with real-time parameters
- Speech & TTS: practice pronunciation and listening; convert text to natural speech
- Spelling Practice: gamified spelling challenges

## [Try here](https://loom-vert.vercel.app)

## High-level design

```
Next.js (App Router, TypeScript, Tailwind)
 ├─ UI: Chat, MenuBar, History, interactive components (canvas, physics, speech)
 ├─ API routes: /api/generate-ai-response, /api/ingest, /api/image, /api/chat, /api/messages, /api/text-to-speech
 ├─ AI: Gemini (function-calling style) with fallback to AIML; inline image bytes;
 ├─ Parsing: youtube-transcript + cheerio for URLs; pdfjs-dist (legacy build) for PDFs
 └─ Data: Prisma + MongoDB for chats/messages
```

## Architecture details

- App Router with server actions and API routes using Node runtime
- Function-calling abstraction that maps AI calls to components: slides, quiz, flashcards, spelling, canvas, physics, TTS
- Image handling via secure upload + signed URLs; embedded as inline bytes for model analysis
- Ingest service builds study kits with heuristic fallbacks and upgrades quality via Gemini
- Persistence: Chats and messages saved immediately, including items created from the + menu

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB connection string
- API keys as needed

### Environment variables (.env.local)

```
DATABASE_URL=mongodb+srv://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
GEMINI_API_KEY=your-gemini-key
# Optional for image storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Install & run

```powershell
# from project root
npm install
npx prisma generate
npm run dev
```

Open http://localhost:3000

## Usage highlights

- Use the + button in chat to import a URL/PDF/image
- URL ingest: summary, keynotes, slides, flashcards; gracefully handles no-captions YouTube
- PDF ingest: parses text server-side via pdfjs-dist and adds a quiz
- Images: securely uploaded, then analyzed directly by AI without detours





## Impact & vision

- Deeper understanding and stronger retention via hands-on exploration
- Teachers can scale personalized, interactive content with minimal prep
- Roadmap: collaborative study sessions, multiplayer quizzes, richer simulations

## Contributing

- Fork and open a PR with a clear description
- Run lint and type checks locally before submitting

```powershell
npm run lint
npm run build
```

## License

MIT
