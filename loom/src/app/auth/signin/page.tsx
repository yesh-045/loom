"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import LoginForm from "@/components/signin/SigninForm";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleSignin = () => {
    router.push("/chat"); // stub
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background text-foreground">
      {/* Themed radial + subtle texture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(173,84,56,0.35)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(70,63,58,0.30)_0%,transparent_60%)]" />
        <div className="absolute inset-0 backdrop-blur-[1.5px]" />
      </div>

      <div className="w-full max-w-sm mx-auto px-4">
        <div className="relative group">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-melon-500/50 via-silver-500/30 to-taupe-600/40 opacity-70 blur-xl group-hover:opacity-90 transition" />
          <div className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md p-8 shadow-[0_4px_24px_-6px_rgba(70,63,58,0.35)]">
            <header className="mb-8 text-center space-y-3">
              <Link href="/" className="inline-block">
                <span className="font-brand text-2xl font-semibold tracking-tight bg-gradient-to-r from-melon-500 via-taupe-600 to-melon-500 bg-clip-text text-transparent">
                  loomyn
                </span>
              </Link>
              <div className="space-y-1">
                <h1 className="text-lg font-heading font-medium text-taupe-600">Welcome back</h1>
                <p className="text-xs text-taupe-600/90">Sign in to continue your session</p>
              </div>
            </header>

            <LoginForm />

            <div className="mt-7">
              <div className="relative flex items-center text-[10px] uppercase tracking-wider text-taupe-600/95 font-medium">
                <span className="flex-1 h-px bg-gradient-to-r from-transparent via-taupe-500/60 to-transparent" />
                <span className="px-3">or</span>
                <span className="flex-1 h-px bg-gradient-to-r from-transparent via-taupe-500/60 to-transparent" />
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full bg-isabelline-600/70 hover:bg-isabelline-600/90 border-border/70 text-sm font-medium text-taupe-500"
                onClick={handleGoogleSignin}
              >
                <Image
                  src="/google-icon.png"
                  alt="Google"
                  width={18}
                  height={18}
                  className="mr-2"
                />
                Continue with Google
              </Button>
            </div>

            <div className="mt-8 text-center text-xs text-taupe-600">
              <span className="mr-1 font-medium">No account?</span>
              <Link href="/auth/signup" className="text-melon-500 hover:text-melon-600 font-semibold transition-colors">
                Create one
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-[10px] text-taupe-600/95 font-medium">
          By continuing you agree to our <span className="underline underline-offset-2 decoration-dotted">Terms</span> & <span className="underline underline-offset-2 decoration-dotted">Privacy</span>.
        </p>
      </div>
    </div>
  );
}
