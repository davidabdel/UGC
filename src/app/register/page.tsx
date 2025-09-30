"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { signUp, googleSignIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }
    
    try {
      const { error } = await signUp(email, password, name);
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('Registration successful! Please check your email to confirm your account.');
        // Optionally redirect after a delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (err: any) {
      setError(err.message || 'An error occurred with Google sign in');
    }
  };
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[color:var(--surface)] text-[color:var(--text)]">
      {/* Left: gradient / marketing */}
      <div className="hidden md:block relative hero-gradient">
        <div className="relative mx-auto flex h-full max-w-xl flex-col justify-center gap-6 px-10 py-16 text-white">
          <div className="text-xs uppercase tracking-wider text-white/80">Create your account</div>
          <h1 className="text-5xl font-extrabold leading-tight">Join ChatUGC</h1>
          <p className="text-white/85">Start generating premium UGC ads with one image and a short script.</p>
          <ul className="mt-2 space-y-2 text-white/85 text-sm">
            <li>• Persona generation with Gemini</li>
            <li>• Dialogue assist with OpenAI</li>
            <li>• Fast video renders with Veo</li>
          </ul>
        </div>
      </div>

      {/* Right: form card */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md glass-card !p-8">
          <h2 className="text-2xl font-bold">Create account</h2>
          <p className="mt-1 text-sm text-white/70">
            Already have an account? {" "}
            <Link href="/login" className="text-[color:var(--brand-2)] hover:underline">Login</Link>
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-white">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-sm text-white">
              {successMessage}
            </div>
          )}
          
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm text-white/85">Name</label>
              <input 
                id="name" 
                type="text" 
                required 
                placeholder="Jane Doe" 
                className="w-full rounded-xl bg-[#0F1117] border border-white/10 px-4 py-3 outline-none focus:border-[color:var(--brand)]" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
            <div className="space-y-2">
              <label htmlFor="confirm" className="text-sm text-white/85">Confirm password</label>
              <input 
                id="confirm" 
                type="password" 
                required 
                placeholder="••••••••" 
                className="w-full rounded-xl bg-[#0F1117] border border-white/10 px-4 py-3 outline-none focus:border-[color:var(--brand)]" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="w-full btn-primary flex items-center justify-center" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
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
