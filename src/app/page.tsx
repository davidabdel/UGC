import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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
            AI Ads that win.
          </h1>
          <p className="mt-4 text-white/80 max-w-2xl mx-auto">
            Turn one image + 8 seconds of dialogue into scroll-stopping UGC.
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

      {/* Feature trio */}
      <section className="mx-auto max-w-6xl px-6 py-16 grid gap-6 md:grid-cols-3">
        {[
          { title: "AI Avatar UGC", body: "Generate on-brand, human-like spokespeople." },
          { title: "Product Showcase", body: "Show your product in context with premium visuals." },
          { title: "AdMax", body: "Smart optimizations for performance and speed." },
        ].map((f) => (
          <div key={f.title} className="glass-card">
            <div className="text-2xl">✨</div>
            <h3 className="mt-2 text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-white/75">{f.body}</p>
            <a className="mt-4 inline-block text-[color:var(--brand-2)] hover:underline" href="#">Try it</a>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-4">
          {[
            "Pick ad type",
            "Upload or generate persona",
            "Write 8-sec script",
            "Render with Veo 3 Fast",
          ].map((step, i) => (
            <div key={i} className="glass-card">
              <div className="text-sm text-white/60">Step {i + 1}</div>
              <div className="mt-2 font-semibold">{step}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Results band */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { k: "2.7x", v: "CTR" },
            { k: "1.7x", v: "ROAS" },
            { k: "90%", v: "faster production" },
          ].map((m) => (
            <div key={m.v} className="glass-card flex items-center justify-between">
              <div className="text-4xl font-extrabold">{m.k}</div>
              <div className="text-sm text-white/70">{m.v}</div>
            </div>
          ))}
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
