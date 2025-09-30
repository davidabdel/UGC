"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

const nav = [
  { href: "/app", label: "Home" },
  { href: "/app/create", label: "Create New Ad" },
  { href: "/app/projects", label: "My Projects" },
  { href: "/app/settings", label: "Settings" },
];

export default function AppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[color:var(--surface)] text-[color:var(--text)]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0B10]/70 backdrop-blur supports-[backdrop-filter]:bg-[#0B0B10]/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-extrabold tracking-tight">
              ChatUGC
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm text-white/80">
              <Link href="/app/projects" className="hover:underline">Projects</Link>
              <Link href="/app/create" className="hover:underline">Create</Link>
              <Link href="/help" className="hover:underline">Help</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs">12 credits</span>
            <button className="rounded-full border border-white/15 bg-white/10 h-9 w-9" aria-label="Notifications" />
            <button className="rounded-full border border-white/15 bg-white/10 h-9 w-9" aria-label="Account" />
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
