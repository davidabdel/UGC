import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

// Mini metric card with inline SVG sparkline (no deps)
function MetricCard({
  value,
  label,
  series,
  color = "#8B5CF6",
}: {
  value: string;
  label: string;
  series: number[]; // 0..100 range
  color?: string;
}) {
  const width = 160;
  const height = 56;
  const pad = 6;
  const max = Math.max(1, ...series);
  const step = (width - pad * 2) / Math.max(1, series.length - 1);
  const points = series.map((v, i) => {
    const x = pad + i * step;
    const y = height - pad - (Math.max(0, v) / max) * (height - pad * 2);
    return `${x},${y}`;
  });
  const path = `M ${points[0] || `${pad},${height - pad}`} L ${points.slice(1).join(" ")}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      {/* Glow */}
      <div className="pointer-events-none absolute -inset-20 rounded-[40px] bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.18),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.18),transparent_40%)]" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <div className="text-3xl font-extrabold leading-none">{value}</div>
          <div className="mt-1 text-xs tracking-wide text-white/70">{label}</div>
        </div>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-90">
          <defs>
            <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <path
            d={`${path} L ${width - pad},${height - pad} L ${pad},${height - pad} Z`}
            fill="url(#g)"
            opacity="0.25"
          />
          {/* Line */}
          <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* Last point */}
          {points.length > 0 && (
            <circle cx={points[points.length - 1].split(",")[0]} cy={points[points.length - 1].split(",")[1]} r="3" fill={color} />
          )}
        </svg>
      </div>
    </div>
  );
}

// Illustrated How-it-works card (no external deps)
function StepCard({
  step,
  title,
  icon,
  accent = "#8B5CF6",
}: {
  step: number;
  title: string;
  icon: ReactNode; // inline SVG element
  accent?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-transform duration-200 hover:-translate-y-0.5">
      {/* Accent glow */}
      <div
        className="pointer-events-none absolute -inset-16 rounded-[40px] opacity-60 blur-2xl"
        style={{ background: `radial-gradient(40% 40% at 20% 10%, ${accent}22 0%, transparent 60%)` }}
      />
      <div className="relative flex items-start gap-3">
        <div className="shrink-0 rounded-xl border border-white/10 bg-[#0F1117] p-2 text-white/90">{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-white/60">Step {step}</div>
          <div className="mt-1 font-semibold">{title}</div>
        </div>
      </div>
      {/* Decorative ribbon */}
      <svg
        className="absolute -right-8 -bottom-8 h-28 w-28 opacity-30 transition-opacity duration-200 group-hover:opacity-60"
        viewBox="0 0 100 100"
        fill="none"
      >
        <defs>
          <linearGradient id={`lg-${step}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.6" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d="M5 80 C 25 60, 45 100, 65 70 C 80 50, 90 40, 95 45"
          stroke={`url(#lg-${step})`}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
export default function Home() {
  return (
    <div className="min-h-screen bg-[color:var(--surface)] text-[color:var(--text)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0B10]/70 backdrop-blur supports-[backdrop-filter]:bg-[#0B0B10]/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
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
            <Link href="/login" className="text-sm text-white/80 hover:text-white hover:underline px-3 py-2">
              Login
            </Link>
            <Link href="/register" className="text-sm bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--brand-2)] text-white px-4 py-2 rounded-full hover:opacity-90">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative hero-gradient">
        <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/Images/logos/UA.png"
              alt="UnrealAdz"
              width={220}
              height={60}
              unoptimized
              priority
              className="h-16 w-auto"
            />
          </div>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
            Turn Every Product Into a 24/7 Sales Machine!
          </h1>
          <p className="mt-4 text-white/80 max-w-2xl mx-auto">
            No more waiting weeks or burning cash on influencers. Instantly generate endless UGC variations proven to convert.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild className="rounded-full px-5 py-6 text-base font-semibold bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--brand-2)] text-white">
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15">
              <Link href="#demo">Watch demo</Link>
            </Button>
          </div>

          {/* Micro-trust row (client logos) - infinite scroll */}
          <div className="mt-8 relative overflow-hidden w-full h-16">
            <div className="absolute animate-marquee whitespace-nowrap flex items-center gap-24">
              {[
                { src: "/Images/logos/AirHum_HQ.png", alt: "AirHum", width: 120 },
                { src: "/Images/logos/AQ%20Logo%20and%20Product%20Pic%20(4).png", alt: "AQ", width: 80 },
                { src: "/Images/logos/BUZZ-BRANDING-LOGOMARK-WORD.png", alt: "Buzz Branding", width: 100 },
                { src: "/Images/logos/ClickDigital%20Logo.png", alt: "ClickDigital", width: 120 },
                { src: "/Images/logos/UC_Logo_Ne_small.png", alt: "UC", width: 80 },
                { src: "/Images/logos/Leonardo_Phoenix_10_Create_a_minimalist_professional_logo_for_0%20(1).jpg", alt: "Leonardo Phoenix", width: 110 },
                { src: "/Images/logos/logo.png", alt: "Logo", width: 100 },
              ].map((l) => (
                <div key={l.src} className="flex h-12 items-center justify-center px-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.src}
                    alt={l.alt}
                    style={{ maxWidth: `${l.width}px` }}
                    className="h-auto max-h-full w-auto object-contain opacity-90"
                  />
                </div>
              ))}
            </div>
            <div className="absolute animate-marquee2 whitespace-nowrap flex items-center gap-24">
              {[
                { src: "/Images/logos/AirHum_HQ.png", alt: "AirHum", width: 120 },
                { src: "/Images/logos/AQ%20Logo%20and%20Product%20Pic%20(4).png", alt: "AQ", width: 80 },
                { src: "/Images/logos/BUZZ-BRANDING-LOGOMARK-WORD.png", alt: "Buzz Branding", width: 100 },
                { src: "/Images/logos/ClickDigital%20Logo.png", alt: "ClickDigital", width: 120 },
                { src: "/Images/logos/UC_Logo_Ne_small.png", alt: "UC", width: 80 },
                { src: "/Images/logos/Leonardo_Phoenix_10_Create_a_minimalist_professional_logo_for_0%20(1).jpg", alt: "Leonardo Phoenix", width: 110 },
                { src: "/Images/logos/logo.png", alt: "Logo", width: 100 },
              ].map((l) => (
                <div key={l.src} className="flex h-12 items-center justify-center px-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.src}
                    alt={l.alt}
                    style={{ maxWidth: `${l.width}px` }}
                    className="h-auto max-h-full w-auto object-contain opacity-90"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Showcase reel carousel */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-2xl font-bold mb-4">Showcase</h2>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* 1. Sydney Harbour */}
            <div className="min-w-[260px] rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="aspect-[9/16] w-[234px] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Images/SydneyHarbour.png" alt="Showcase Sydney Harbour" className="h-full w-full object-cover" />
              </div>
              <div className="mt-2 text-sm text-white/80">Ad #1</div>
            </div>

            {/* 2. buzz.png */}
            <div className="min-w-[260px] rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="aspect-[9/16] w-[234px] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Images/buzz.png" alt="Showcase buzz" className="h-full w-full object-cover" />
              </div>
              <div className="mt-2 text-sm text-white/80">Ad #2</div>
            </div>

            {/* 3. ai-gen.png */}
            <div className="min-w-[260px] rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="aspect-[9/16] w-[234px] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Images/ai-gen.png" alt="Showcase ai-gen" className="h-full w-full object-cover" />
              </div>
              <div className="mt-2 text-sm text-white/80">Ad #3</div>
            </div>

            {/* 4. MelbourneCity.png */}
            <div className="min-w-[260px] rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="aspect-[9/16] w-[234px] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Images/MelbourneCity.png" alt="Showcase Melbourne City" className="h-full w-full object-cover" />
              </div>
              <div className="mt-2 text-sm text-white/80">Ad #4</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits grid (4 cards) */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {[ 
            {
              title: "Stop Paying $500 and Waiting Weeks for a UGC Video That Flops.",
              body: "Get high-converting UGC ads in minutes — no creators, no shipping products, no editing. Unreal Adz turns one image and a few words into scroll-stopping videos.",
              accent: "#8B5CF6",
            },
            {
              title: "Get 100's of Ads — In Minutes, Not Months.",
              body: "Ditch agencies and influencers. Generate studio-quality UGC that sells — at 1/100th the cost.",
              accent: "#38BDF8",
            },
            {
              title: "Why Spend $500 on One Video When You Can Get 100 for the Same Price?",
              body: "Our AI creates endless scroll-stopping UGC variations from a single image — faster, cheaper, and smarter than any human creator.",
              accent: "#F59E0B",
            },
            {
              title: "UGC Ads Without the Pain.",
              body: "No models. No filming. No waiting. Just upload your product photo and get hundreds of ready-to-run ads that sell.",
              accent: "#F472B6",
            },
          ].map((f) => (
            <div key={f.title} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              {/* soft glow */}
              <div className="pointer-events-none absolute -inset-20 rounded-[48px] blur-2xl opacity-60" style={{ background: `radial-gradient(40% 40% at 20% 10%, ${f.accent}22 0%, transparent 60%)` }} />
              <div className="relative">
                <div className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-[#0F1117] px-2 py-1 text-sm">✨</div>
                <h3 className="mt-3 text-lg font-semibold leading-snug">{f.title}</h3>
                <p className="mt-2 text-sm text-white/75 leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works (illustrated) */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-4 sm:gap-6 md:grid-cols-4">
          <StepCard
            step={1}
            title="Pick ad type"
            accent="#8B5CF6"
            icon={(
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h10M4 18h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          />
          <StepCard
            step={2}
            title="Upload or generate persona"
            accent="#38BDF8"
            icon={(
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
                <path d="M4.5 19c1.5-3.5 5-5 7.5-5s6 1.5 7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          />
          <StepCard
            step={3}
            title="Write 8-sec script"
            accent="#F59E0B"
            icon={(
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 17l4.5-.8L19 5.7a2 2 0 10-2.8-2.8L5.7 13.4 4 17z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="M13 6l5 5" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          />
          <StepCard
            step={4}
            title="Render with Veo 3 Fast"
            accent="#F472B6"
            icon={(
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
              </svg>
            )}
          />
        </div>
      </section>

      {/* Metrics band with sparklines */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          <MetricCard value="2.7x" label="CTR" series={[12,18,22,19,25,31,29,38,44,41,53,58]} color="#8B5CF6" />
          <MetricCard value="1.7x" label="ROAS" series={[8,9,11,13,12,14,16,17,18,20,21,23]} color="#38BDF8" />
          <MetricCard value="90%" label="faster production" series={[15,18,22,30,34,40,48,55,65,72,84,90]} color="#F472B6" />
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 md:grid-cols-4">
          {[
            { h: "Product", items: ["Features", "Pricing", "Changelog"] },
            { h: "Company", items: ["About", "Careers", "Contact"] },
            { h: "Legal", items: ["Terms", "Privacy"] },
            { h: "Social", items: ["Twitter", "YouTube", "LinkedIn"] },
          ].map((col) => (
            <div key={col.h}>
              <div className="font-semibold">{col.h}</div>
              <ul className="mt-3 space-y-1 text-sm text-white/70">
                {col.items.map((x) => (
                  <li key={x}><a className="hover:underline" href="#">{x}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-white/50 pb-8">© {new Date().getFullYear()} UnrealAdz</div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0B0B10]/80 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm">
            <div className="font-semibold">Start your first ad</div>
            <div className="text-white/60">Free plan available</div>
          </div>
          <Button asChild className="rounded-full bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--brand-2)] text-white">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
