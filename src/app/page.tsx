import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function Home() {
  return (
    <div className="min-h-screen bg-[color:var(--surface)] text-[color:var(--text)]">
      {/* Hero */}
      <section className="relative hero-gradient">
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs text-white/80 shadow-sm">
            <span>UGC Factory</span>
            <span className="text-white/50">—</span>
            <span>AI Ads that Win</span>
          </div>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
            AI Ads that win.
          </h1>
          <p className="mt-4 text-white/80 max-w-2xl mx-auto">
            Turn one image + 8 seconds of dialogue into scroll-stopping UGC.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild className="rounded-full px-5 py-6 text-base font-semibold bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--brand-2)] text-white">
              <Link href="#pricing">Get started</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15">
              <Link href="#demo">Watch demo</Link>
            </Button>
          </div>

          {/* Micro-trust row (placeholder logos) */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 opacity-80">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 w-24 rounded bg-white/10" />
            ))}
          </div>
        </div>
      </section>

      {/* Showcase reel carousel */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-2xl font-bold mb-4">Showcase</h2>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="min-w-[260px] rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="aspect-[9/16] w-[234px] rounded-xl bg-black/40" />
                <div className="mt-2 text-sm text-white/80">Ad #{i + 1}</div>
              </div>
            ))}
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

      {/* Pricing strip */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold text-center">Pricing</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            { name: "Free", price: "$0", cta: "Start free" },
            { name: "Starter", price: "$19", cta: "Upgrade" },
            { name: "Pro", price: "$49", cta: "Upgrade" },
            { name: "Enterprise", price: "Custom", cta: "Contact" },
          ].map((p) => (
            <div key={p.name} className="glass-card flex flex-col">
              <div className="text-xs text-white/60">{p.name}</div>
              <div className="mt-2 text-3xl font-bold">{p.price}
                <span className="text-sm font-normal text-white/60">/mo</span>
              </div>
              <ul className="mt-3 text-sm text-white/75 space-y-1">
                <li>• High-quality renders</li>
                <li>• Credits included</li>
                <li>• Priority rendering</li>
              </ul>
              <Button asChild className="mt-4 rounded-full bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--brand-2)] text-white">
                <Link href="/pricing">{p.cta}</Link>
              </Button>
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
        <div className="text-center text-xs text-white/50 pb-8">© {new Date().getFullYear()} UGC Factory</div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0B0B10]/80 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm">
            <div className="font-semibold">Start your first ad</div>
            <div className="text-white/60">Free plan available</div>
          </div>
          <Button asChild className="rounded-full bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--brand-2)] text-white">
            <Link href="/pricing">Get started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
