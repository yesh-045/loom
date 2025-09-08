/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import Navbar from "@/components/layout/Navbar"
import { FlipWords } from "@/components/ui/flip-words"
import { useRef } from "react"
import { Check, PenTool, BookOpen, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
export default function Home() {
  const words = ["Enhanced Learning", "Better Learning", "Engaged Learning", "Easier Learning"]
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()

  const handleVideoEnd = () => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  return (
    <div className="w-screen flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-6 md:px-10 lg:px-16 xl:px-24 py-20">
        {/* Decorative blurs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-melon-600/30 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-silver-700/30 blur-3xl rounded-full" />
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs">
              <span className="inline-block h-2 w-2 rounded-full bg-melon-500" />
              AI study OS
            </div>
            <h1 className="mt-4 text-5xl sm:text-6xl font-heading font-bold tracking-tight">
              <span className="font-brand text-taupe-500 dark:text-isabelline-900">Loom</span> for
              <span className="block mt-2"><FlipWords words={words} className='text-foreground' /></span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-xl">
              Build, study, and explore with interactive chat-based components. Create slides, flashcards, quizzes, drawings, and more-guided by AI.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                className="rounded-full bg-primary text-primary-foreground hover:bg-accent px-6 py-3 text-base font-semibold shadow-sm"
                onClick={() => router.push("/chat")}
              >
                Get started
              </button>
              <a href="#showcase" className="rounded-full border border-border bg-background hover:bg-accent/20 px-6 py-3 text-base font-semibold">
                See how it works
              </a>
            </div>
          </div>
          <div>
            <div className="relative rounded-3xl border border-border bg-card/80 backdrop-blur shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
              <video
                ref={videoRef}
                src="/videos/hero-video.mp4"
                className="object-cover w-full h-full aspect-[16/9]"
                onEnded={handleVideoEnd}
                autoPlay
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Live demo preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 md:px-10 lg:px-16 xl:px-24 py-6">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full border border-border bg-card px-3 py-1">Used by students and teams</span>
          <span className="rounded-full border border-border bg-card px-3 py-1">Slides • Flashcards • Quizzes</span>
          <span className="rounded-full border border-border bg-card px-3 py-1">Canvas • Physics • TTS</span>
        </div>
      </section>

      {/* Quick capabilities */}
      <section className="px-6 md:px-10 lg:px-16 xl:px-24 py-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl sm:text-4xl font-heading font-bold">What you can do</h2>
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Slides */}
            <div className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-melon-500/15 text-melon-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-semibold">Slides</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Auto-structured decks</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-background border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">ex: “Photosynthesis basics”</span>
                <span className="rounded-full bg-background border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">“WWII overview”</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button className="rounded-full bg-primary text-primary-foreground hover:bg-accent px-4 py-2 text-xs font-semibold" onClick={() => router.push('/chat')}>Try now</button>
                <a href="#showcase" className="text-xs font-medium text-melon-600 hover:underline">View demo →</a>
              </div>
            </div>
            {/* Flashcards */}
            <div className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-melon-500/15 text-melon-600 flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="font-semibold">Flashcards</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Smart review sets</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-background border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">ex: “Key terms: cells”</span>
                <span className="rounded-full bg-background border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">“French verbs”</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button className="rounded-full bg-primary text-primary-foreground hover:bg-accent px-4 py-2 text-xs font-semibold" onClick={() => router.push('/chat')}>Try now</button>
                <a href="#showcase" className="text-xs font-medium text-melon-600 hover:underline">View demo →</a>
              </div>
            </div>
            {/* Quizzes */}
            <div className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-melon-500/15 text-melon-600 flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                <span className="font-semibold">Quizzes</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Instant feedback</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-background border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">ex: “Algebra basics”</span>
                <span className="rounded-full bg-background border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">“Capitals quiz”</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button className="rounded-full bg-primary text-primary-foreground hover:bg-accent px-4 py-2 text-xs font-semibold" onClick={() => router.push('/chat')}>Try now</button>
                <a href="#showcase" className="text-xs font-medium text-melon-600 hover:underline">View demo →</a>
              </div>
            </div>
            {/* Canvas */}
            <div className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-melon-500/15 text-melon-600 flex items-center justify-center">
                  <PenTool className="h-4 w-4" />
                </div>
                <span className="font-semibold">Canvas</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Sketch & explain</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-background border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">ex: “Graph parabola”</span>
                <span className="rounded-full bg-background border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">“Free body diagram”</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button className="rounded-full bg-primary text-primary-foreground hover:bg-accent px-4 py-2 text-xs font-semibold" onClick={() => router.push('/chat')}>Try now</button>
                <a href="#showcase" className="text-xs font-medium text-melon-600 hover:underline">View demo →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature spotlight (alternating) */}
      <section className="px-6 md:px-10 lg:px-16 xl:px-24 py-14">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1">
            <h3 className="font-heading text-3xl sm:text-4xl font-semibold">Interactive study components</h3>
            <p className="mt-3 text-muted-foreground">Generate presentations, flashcards, and quizzes tuned to your prompt.</p>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-melon-500 shrink-0" /> Auto-structured slides and bullet points</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-melon-500 shrink-0" /> Flashcards with spaced practice</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-melon-500 shrink-0" /> Quizzes with instant feedback</li>
            </ul>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
              <div className="aspect-[16/9]">
                <video src="/videos/basic-features.mp4" className="object-cover w-full h-full" autoPlay muted loop playsInline preload="metadata" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-10 lg:px-16 xl:px-24 py-14">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
              <div className="aspect-[16/9]">
                <video src="/videos/draw-feature.mp4" className="object-cover w-full h-full" autoPlay muted loop playsInline preload="metadata" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-heading text-3xl sm:text-4xl font-semibold">Advanced AI canvas</h3>
            <p className="mt-3 text-muted-foreground">Sketch, annotate, and explore complex problems. Let AI explain step-by-step.</p>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed">
              <li className="flex items-start gap-2"><PenTool className="mt-0.5 h-4 w-4 text-melon-500 shrink-0" /> Freehand drawing and annotations</li>
              <li className="flex items-start gap-2"><BookOpen className="mt-0.5 h-4 w-4 text-melon-500 shrink-0" /> Explanations tailored to your sketch</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-melon-500 shrink-0" /> Export snippets into slides or cards</li>
            </ul>
          </div>
        </div>
      </section>

      
        <section id="showcase" className="px-6 md:px-10 lg:px-16 xl:px-24 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center text-4xl sm:text-5xl font-heading font-bold">In action</h2>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tile 1 */}
              <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-lg aspect-[16/9]">
                <video src="/videos/draw-feature.mp4" className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline preload="metadata" />
                <div className="absolute bottom-3 left-3 rounded-full bg-background/80 backdrop-blur px-3 py-1 text-xs border border-border">AI Canvas</div>
              </div>
              {/* Tile 2 */}
              <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-lg aspect-[16/9]">
                <video src="/videos/basic-features.mp4" className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline preload="metadata" />
                <div className="absolute bottom-3 left-3 rounded-full bg-background/80 backdrop-blur px-3 py-1 text-xs border border-border">Study components</div>
              </div>
              {/* Tile 3 */}
              <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-lg aspect-[16/9]">
                <video src="/videos/physics-feature.mp4" className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline preload="metadata" />
                <div className="absolute bottom-3 left-3 rounded-full bg-background/80 backdrop-blur px-3 py-1 text-xs border border-border">Physics simulator</div>
              </div>
            </div>
          </div>
        </section>
      
    </div>
  )
}