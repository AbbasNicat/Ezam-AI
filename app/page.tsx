import Link from "next/link";
import { ArrowRight, Building2, MapPinned, Scale, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  ["Request", "An employee describes the trip once."],
  ["Analyze", "Policy rules and the seeded catalog are checked in code."],
  ["Optimize", "Economy, Balanced, and Comfort are built only when they fit."],
  ["Review", "Corporate and personal estimates stay on separate lines."],
  ["Approve", "A demo travel manager records a decision."],
  ["Report", "Finance downloads a CSV of the estimate."],
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary">AtlasFlow AI</p>
          <p className="text-xs text-muted-foreground">NeuroBridge · AI Enterprise Solutions</p>
        </div>
        <Button asChild>
          <Link href="/demo">
            Launch Interactive Demo <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-3 text-sm font-medium text-primary">Corporate travel operations</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Corporate travel, planned and approved in one intelligent workflow.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              AtlasFlow transforms employee travel requests into policy-compliant itineraries, optimized budgets, booking handoffs, and finance-ready reports.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/start">Choose your workspace</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#workflow">See the workflow</a>
              </Button>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
              One request. Three optimized options. One coordinated workflow. Prices in the demo are synthetic estimates, not live fares or confirmed bookings.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Illustrative preview</p>
            <p className="mt-2 text-sm text-muted-foreground">Open the demo for calculated packages. These cards show the decision, not a quote.</p>
            <div className="mt-4 grid gap-3">
              {["Economy", "Balanced", "Comfort"].map((tier) => (
                <div key={tier} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{tier}</p>
                    <span className="text-xs text-muted-foreground">Estimate</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Corporate cost · Personal leisure · Policy status</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 py-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <UserRound className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">For individual travelers</h2>
            <p className="mt-2 text-sm text-muted-foreground">Create a browser-local preference profile, set a personal budget, compare three packages, and continue to external booking search.</p>
            <Button asChild className="mt-5" variant="outline"><Link href="/start?mode=personal">Start personal planning <ArrowRight className="h-4 w-4" /></Link></Button>
          </article>
          <article className="rounded-2xl border border-primary/30 bg-accent/40 p-6 shadow-sm">
            <Building2 className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">For businesses</h2>
            <p className="mt-2 text-sm text-muted-foreground">Configure practical policy limits, plan employee travel, route approval, preserve an audit trail, and export finance-ready CSV.</p>
            <Button asChild className="mt-5"><Link href="/start?mode=business">Set up business workspace <ArrowRight className="h-4 w-4" /></Link></Button>
          </article>
        </section>

        <section id="workflow" className="grid gap-4 py-6 md:grid-cols-3">
          <article className="rounded-2xl border border-border bg-card p-5">
            <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
            <h2 className="font-semibold">Policy before price</h2>
            <p className="mt-2 text-sm text-muted-foreground">Cabin limits, nightly caps, and budget ceilings are enforced in the planner. A non-compliant package is not invented to fill a card.</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5">
            <Scale className="mb-3 h-5 w-5 text-primary" />
            <h2 className="font-semibold">Corporate vs personal</h2>
            <p className="mt-2 text-sm text-muted-foreground">Flights, stays, ground transport, and policy meals stay on the company side. Museum tickets and optional sightseeing stay personal unless policy says otherwise.</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5">
            <MapPinned className="mb-3 h-5 w-5 text-primary" />
            <h2 className="font-semibold">Handoff, not checkout</h2>
            <p className="mt-2 text-sm text-muted-foreground">Search links open the provider. AtlasFlow records that the search was opened. It does not mark a ticket or room as booked.</p>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Request → Analyze → Optimize → Review → Approve → Book externally → Report</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(([title, copy]) => (
              <div key={title} className="rounded-xl bg-muted p-4">
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-[#0b1f3a] px-6 py-8 text-white">
          <h2 className="text-2xl font-semibold">Load the Caspian Ventures trip</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-200">
            Aylin M. travels from Baku to Istanbul for a client meeting. Corporate budget 1,800 AZN. Personal leisure budget 200 AZN for museums and architecture. The company and employee are fictional. No sign-in is required.
          </p>
          <Button asChild className="mt-5 bg-white text-[#0b1f3a] hover:bg-slate-100" size="lg">
            <Link href="/demo">Launch Interactive Demo</Link>
          </Button>
        </section>

        <p className="mt-8 text-xs text-muted-foreground">
          Demo catalog for Istanbul, Tbilisi, and Dubai. OpenStreetMap tiles inside the product. External flight, stay, and directions links leave AtlasFlow. This build does not connect to a GDS and does not take payment.
        </p>
      </main>
    </div>
  );
}
