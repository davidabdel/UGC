"use client";

import { useState } from "react";

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Free",
      price: annual ? "$0" : "$0",
      monthlyPrice: "$0",
      annualPrice: "$0",
      badge: "",
      cta: "Start free",
      features: [
        "2 videos included",
        "Basic image generation",
        "Community support",
      ],
      link: "#",
    },
    {
      name: "Starter",
      price: annual ? "$15" : "$19",
      monthlyPrice: "$19",
      annualPrice: "$15",
      badge: "Most popular",
      cta: "Upgrade",
      features: [
        "20 videos / month",
        "Priority rendering",
        "AI dialogue assist",
        "Email support",
      ],
      link: "#",
    },
    {
      name: "Pro",
      price: annual ? "$39" : "$49",
      monthlyPrice: "$49",
      annualPrice: "$39",
      badge: "",
      cta: "Upgrade",
      features: [
        "Unlimited videos",
        "Faster queues",
        "Team notes",
        "Brand presets",
        "Priority support",
      ],
      link: "#",
    },
    {
      name: "Enterprise",
      price: "Custom",
      monthlyPrice: "Custom",
      annualPrice: "Custom",
      badge: "New",
      cta: "Contact sales",
      features: [
        "SLA & SSO",
        "Dedicated capacity",
        "Custom voices/styles",
        "Compliance & security",
      ],
      link: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--surface)] text-[color:var(--text)]">
      <header className="hero-gradient">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Pricing</h1>
          <p className="mt-3 text-white/80">
            Simple plans that scale with you. Switch billing period anytime.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-sm text-white/90">
            <button
              className={`rounded-full px-4 py-1 font-medium transition ${!annual ? "bg-white/10" : "bg-white text-black"}`}
              onClick={() => setAnnual(true)}
            >
              Annual <span className="ml-1 text-xs opacity-70">(save)</span>
            </button>
            <button
              className={`rounded-full px-4 py-1 font-medium transition ${annual ? "bg-white/10 text-white" : "bg-white text-black"}`}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => (
            <div key={p.name} className="glass-card flex flex-col">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-white/60">{p.name}</div>
                {p.badge && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80 border border-white/15">
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="mt-3 text-4xl font-extrabold">
                {p.price}
                {p.price !== "Custom" && (
                  <span className="text-sm font-normal text-white/60">/mo</span>
                )}
              </div>
              <div className="mt-1 text-xs text-white/60">
                {p.price !== "Custom" ? (
                  <>
                    Billed {annual ? "yearly" : "monthly"}
                  </>
                ) : (
                  <>Tailored to your needs</>
                )}
              </div>

              <ul className="mt-4 space-y-2 text-sm text-white/80">
                {p.features.slice(0, 10).map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--brand-2)]"></span>
                    {f}
                  </li>
                ))}
              </ul>

              <a href={p.link} className="mt-5 btn-primary text-center">
                {p.cta}
              </a>

              <div className="mt-3 text-xs text-white/60">
                {p.name === "Free" && "Credit-limited, fair use applies"}
                {p.name === "Starter" && "Includes credits, fair use, priority rendering"}
                {p.name === "Pro" && "Unlimited within fair use; highest priority"}
                {p.name === "Enterprise" && "Custom terms, invoicing available"}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="glass-card text-sm text-white/80">
            <div className="font-semibold text-white">Notes</div>
            <ul className="mt-2 space-y-1">
              <li>• Credit counts vary by operation.</li>
              <li>• Fair-use policy protects platform stability.</li>
              <li>• Priority rendering on Starter+.</li>
            </ul>
          </div>
          <div className="glass-card text-sm text-white/80">
            <div className="font-semibold text-white">Billing</div>
            <ul className="mt-2 space-y-1">
              <li>• Cancel anytime; proration may apply.</li>
              <li>• Taxes/VAT calculated at checkout.</li>
              <li>• Manage via Stripe customer portal.</li>
            </ul>
          </div>
          <div className="glass-card text-sm text-white/80">
            <div className="font-semibold text-white">Support</div>
            <ul className="mt-2 space-y-1">
              <li>• Email support for Starter.</li>
              <li>• Priority support for Pro.</li>
              <li>• Dedicated CSM for Enterprise.</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-white/60">
          Stripe links are placeholders for now.
        </div>
      </main>
    </div>
  );
}
