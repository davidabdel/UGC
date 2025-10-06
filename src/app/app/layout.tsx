"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { getUserCredits } from "@/lib/subscription-service";

const nav = [
  { href: "/app", label: "Home" },
  { href: "/app/create", label: "Create New Ad" },
  { href: "/app/projects", label: "My Projects" },
  { href: "/app/subscription", label: "Subscription" },
  { href: "/app/profile", label: "Profile" },
];

export default function AppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);
  
  useEffect(() => {
    async function loadCredits() {
      if (!user) return;
      
      setIsLoadingCredits(true);
      try {
        const result = await getUserCredits(user.id);
        if (result.success && result.credits) {
          setCredits(result.credits.balance);
        } else {
          // If no credits found, display 0 (they'll be created when visiting subscription page)
          setCredits(0);
        }
      } catch (error) {
        console.error('Error loading credits:', error);
        // On error, still show 0 credits
        setCredits(0);
      } finally {
        setIsLoadingCredits(false);
      }
    }
    
    loadCredits();
  }, [user]);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  return (
    <div className="min-h-screen bg-[color:var(--surface)] text-[color:var(--text)]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0B10]/70 backdrop-blur supports-[backdrop-filter]:bg-[#0B0B10]/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/Images/logos/logo_ua.png"
                alt="UnrealAdz"
                width={200}
                height={40}
                unoptimized
                priority
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/app/subscription" 
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs hover:bg-white/15 transition-colors"
            >
              {isLoadingCredits ? '...' : credits !== null ? `${credits} credits` : 'Credits'}
            </Link>
            <button className="rounded-full border border-white/15 bg-white/10 h-9 w-9" aria-label="Notifications" />
            <div className="relative group">
              <button className="rounded-full border border-white/15 bg-white/10 h-9 w-9 flex items-center justify-center" aria-label="Account">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl bg-[#0F1117] border border-white/10 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-3 text-sm">
                  <div className="font-medium">{user?.user_metadata?.name || 'User'}</div>
                  <div className="text-xs text-white/60 truncate">{user?.email}</div>
                </div>
                <div className="border-t border-white/10">
                  <Link 
                    href="/app/profile"
                    className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[240px_1fr] gap-0 md:gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="hidden md:block">
          <div className="glass-card sticky top-[84px] !p-3">
            <nav className="space-y-1 text-sm">
              {nav.map((n) => {
                const active = pathname === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 transition ${
                      active ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <span>{n.label}</span>
                    {active && <span className="h-2 w-2 rounded-full bg-[color:var(--brand-2)]" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
