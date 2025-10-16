"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { signIn, googleSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message || 'Sign in failed');
      } else {
        router.push('/app/create');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during sign in';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred with Google sign in';
      setError(message);
    }
  };
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[color:var(--surface)] text-[color:var(--text)]">
      {/* Left: gradient / marketing */}
      <div className="hidden md:block relative hero-gradient">
        <div className="relative mx-auto flex h-full max-w-xl flex-col justify-center gap-6 px-10 py-16 text-white">
          <div className="text-xs uppercase tracking-wider text-white/80">Welcome back</div>
          <h1 className="text-5xl font-extrabold leading-tight">AI Ads that win.</h1>
          <p className="text-white/85">Turn one image + 8 seconds of dialogue into scroll-stopping UGC.</p>
          <ul className="mt-2 space-y-2 text-white/85 text-sm">
            <li>• Generate AI avatars and product showcases</li>
            <li>• Write or clean up dialogue with AI</li>
            <li>• Render fast with Veo 3 Fast</li>
          </ul>
        </div>
      </div>

      {/* Right: form card */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md glass-card !p-8">
          <h2 className="text-2xl font-bold">Login</h2>
          <p className="mt-1 text-sm text-white/70">
            Don’t have an account? {" "}
            <Link href="/register" className="text-[color:var(--brand-2)] hover:underline">Create account</Link>
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-white">
              {error}
            </div>
          )}
          
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-white/85">Email</label>
              <input 
                id="email" 
                type="email" 
                required 
                placeholder="you@example.com" 
                className="w-full rounded-xl bg-[#0F1117] border border-white/10 px-4 py-3 outline-none focus:border-[color:var(--brand)]" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-white/85">Password</label>
              <input 
                id="password" 
                type="password" 
                required 
                placeholder="••••••••" 
                className="w-full rounded-xl bg-[#0F1117] border border-white/10 px-4 py-3 outline-none focus:border-[color:var(--brand)]" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" />
                Remember me
              </label>
              <Link href="#" className="text-white/70 hover:underline">Forgot password?</Link>
            </div>
            <button 
              type="submit" 
              className="w-full btn-primary flex items-center justify-center" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-white/50">
            <div className="h-px flex-1 bg-white/10" /> OR <div className="h-px flex-1 bg-white/10" />
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
          >
            <span className="i-[g]" />
            Continue with Google
          </button>

          <p className="mt-6 text-[11px] leading-5 text-white/60">
            By continuing you agree to our <a className="underline" href="#">Terms</a> and <a className="underline" href="#">Privacy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

