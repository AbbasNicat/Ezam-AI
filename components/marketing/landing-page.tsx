import Link from "next/link";
import { Inter } from "next/font/google";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BedDouble,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  FileCheck2,
  Landmark,
  Map as MapIcon,
  MapPin,
  Plane,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Split,
  UtensilsCrossed,
  WandSparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

const unsplash = (id: string, width = 1080) =>
  `https://images.unsplash.com/${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=${width}`;

const images = {
  bosphorus: unsplash("photo-1589561454226-796a8aa89b05", 1600),
  suleymaniye: unsplash("photo-1623439844752-524658b16ce6", 1600),
};

type BudgetKey = "flights" | "stay" | "meals" | "transport" | "contingency";

const budgetCategories: { key: BudgetKey; label: string; color: string }[] = [
  { key: "flights", label: "Flights", color: "#246B64" },
  { key: "stay", label: "Stay", color: "#5E9A92" },
  { key: "meals", label: "Meals", color: "#A9CBC4" },
  { key: "transport", label: "Local transport", color: "#477BA8" },
  { key: "contingency", label: "Contingency", color: "#D4D8D3" },
];

const showcasePackages: {
  id: string;
  tier: string;
  name: string;
  price: number;
  details: string[];
  breakdown: Record<BudgetKey, number>;
}[] = [
  {
    id: "essential",
    tier: "Essential",
    name: "Smart Saver",
    price: 1120,
    details: ["Economy flight", "Comfortable 3-star hotel", "3 nights", "4 recommended attractions"],
    breakdown: { flights: 420, stay: 390, meals: 180, transport: 70, contingency: 60 },
  },
  {
    id: "balanced",
    tier: "Recommended",
    name: "The Sweet Spot",
    price: 1450,
    details: ["Economy flight", "Central 4-star hotel", "3 nights", "5 recommended attractions"],
    breakdown: { flights: 420, stay: 630, meals: 240, transport: 90, contingency: 70 },
  },
  {
    id: "comfort",
    tier: "Premium",
    name: "Effortless Travel",
    price: 1730,
    details: ["Economy flight", "Premium central hotel", "3 nights", "6 recommended attractions"],
    breakdown: { flights: 460, stay: 735, meals: 300, transport: 120, contingency: 115 },
  },
];

const fmt = (n: number) => n.toLocaleString("en-US");

const buttonVariants = {
  primary:
    "bg-af-accent text-white hover:bg-af-accent-hover shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_2px_rgb(21_26_29/0.12)]",
  outline:
    "bg-af-surface text-af-ink border border-af-line hover:border-af-line-strong hover:bg-af-subtle shadow-[0_1px_1px_rgb(21_26_29/0.03)]",
  ghost: "text-af-ink-2 hover:text-af-ink hover:bg-af-subtle",
} as const;

const buttonSizes = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[8px]",
  lg: "h-11 px-5 text-[14.5px] gap-2 rounded-[10px]",
} as const;

function LandingLink({
  href,
  variant = "primary",
  size = "sm",
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}

function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden>
      <rect width="28" height="28" rx="8" fill="#246B64" />
      <path
        d="M7.5 20.5c3.2 0 3.6-6.5 6.5-6.5s3.2-6.5 6.5-6.5"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="20.5" r="2" fill="#fff" />
      <circle cx="20.5" cy="7.5" r="2.6" fill="none" stroke="#fff" strokeWidth="1.6" />
    </svg>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-medium uppercase tracking-[0.09em] text-af-ink-3">{children}</div>;
}

const productLinks = [
  ["Planning", "/individual/plan"],
  ["Policies", "/business/policies"],
  ["Approvals", "/business/approvals"],
  ["Expenses", "/business/expenses"],
] as const;

export function LandingPage() {
  return (
    <div className={cn(inter.className, "min-h-screen bg-af-canvas text-af-ink antialiased")}>
      <header className="sticky top-0 z-30 border-b border-af-line/70 bg-af-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="EzamAI home">
            <LogoMark />
            <span className="text-[16px] font-semibold tracking-[-0.02em] text-af-ink">EzamAI</span>
          </Link>
          <nav className="ml-12 hidden items-center gap-7 text-[13.5px] text-af-ink-2 md:flex">
            {[
              ["Product", "#features"],
              ["How it works", "#how"],
              ["For teams", "#features"],
              ["Pricing", "#cta"],
            ].map(([label, href]) => (
              <a key={label} href={href} className="transition-colors hover:text-af-ink">
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LandingLink href="/start" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign in
            </LandingLink>
            <LandingLink href="/demo" size="sm">
              Launch demo
            </LandingLink>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[720px] opacity-[0.55]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #E8EAE7 1px, transparent 1px), linear-gradient(to bottom, #E8EAE7 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 75%)",
          }}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 pt-16 md:px-8 md:pt-24">
          <div className="max-w-[860px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-af-line bg-af-surface py-1 pl-1 pr-3 text-[11.5px] font-medium tracking-[0.08em] text-af-ink-2">
              <span className="rounded-full bg-af-accent-soft px-2 py-0.5 text-[10.5px] tracking-[0.06em] text-af-accent">
                NEW
              </span>
              THE INTELLIGENT TRAVEL WORKSPACE
            </div>
            <h1 className="mt-7 text-[44px] font-medium leading-[1.02] tracking-[-0.045em] sm:text-[58px] lg:text-[72px]">
              Business travel,
              <br />
              <span className="text-af-ink-3">beautifully</span> <span className="text-af-accent">orchestrated.</span>
            </h1>
            <p className="mt-6 max-w-[600px] text-[16.5px] leading-[1.6] text-af-ink-2 md:text-[17.5px]">
              From the first travel request to final approval, EzamAI brings flights, stays, budgets, policies, and
              itineraries into one intelligent workflow.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <LandingLink href="/start?mode=business" size="lg">
                Plan a business trip <ArrowRight className="size-4" />
              </LandingLink>
              <LandingLink href="/demo" size="lg" variant="outline">
                Explore the platform
              </LandingLink>
            </div>
            <p className="mt-4 text-[12.5px] text-af-ink-3">No setup required. Explore the interactive demo.</p>
          </div>
          <HeroMockup />
        </div>
      </section>

      <section className="border-y border-af-line bg-af-surface">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 px-5 md:grid-cols-4 md:px-8">
          {[
            { icon: ShieldCheck, label: "Policy-aware planning" },
            { icon: CircleDollarSign, label: "Budget optimization" },
            { icon: MapIcon, label: "Intelligent itineraries" },
            { icon: FileCheck2, label: "Approval automation" },
          ].map(({ icon: Icon, label }, i) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-3 py-6 text-[14px] font-medium text-af-ink",
                i > 0 && "md:border-l md:border-af-line md:pl-8",
                i % 2 === 1 && "border-l border-af-line pl-5 md:pl-8",
              )}
            >
              <Icon className="size-[18px] text-af-accent" strokeWidth={1.6} />
              {label}
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-3 text-[34px] font-medium leading-[1.1] tracking-[-0.035em] md:text-[44px]">
              One request in.
              <br />
              A ready-to-approve trip out.
            </h2>
          </div>
          <p className="text-[15.5px] leading-relaxed text-af-ink-2 md:col-span-5">
            EzamAI reads your request the way a seasoned travel manager would — then checks it against policy,
            budget, and your calendar before anyone has to ask.
          </p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <StepCard
            n="01"
            title="Describe your trip"
            body="Write it the way you'd tell a colleague. EzamAI extracts dates, budget, and preferences."
          >
            <div className="rounded-[10px] border border-af-line bg-af-surface p-3 text-[12.5px] leading-relaxed text-af-ink-2">
              “Istanbul, Oct 13–16. Client meeting Tuesday morning. Quiet hotel near the center
              <span className="af-caret ml-0.5 inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-af-accent" />”
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {["Istanbul", "3 nights", "Quiet hotel", "Tue 09:00"].map((c) => (
                <span key={c} className="rounded-[6px] bg-af-accent-soft px-2 py-0.5 text-[11px] font-medium text-af-accent">
                  {c}
                </span>
              ))}
            </div>
          </StepCard>
          <StepCard
            n="02"
            title="Compare intelligent plans"
            body="Three policy-compliant packages, each balancing cost, comfort, and convenience differently."
          >
            <div className="grid grid-cols-3 gap-2">
              {showcasePackages.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-[9px] border p-2.5",
                    p.id === "balanced" ? "border-af-accent/40 bg-af-accent-soft/60" : "border-af-line bg-af-surface",
                  )}
                >
                  <div className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-af-ink-3">{p.tier}</div>
                  <div className="mt-1 text-[14px] font-medium tracking-tight tabular-nums">{fmt(p.price)}</div>
                  <div className="mt-2 h-1 rounded-full bg-af-subtle">
                    <div className="h-full rounded-full bg-af-accent" style={{ width: `${(p.price / 1800) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </StepCard>
          <StepCard
            n="03"
            title="Approve and travel"
            body="Managers get an executive summary and audit trail. One click, and booking handoff begins."
          >
            <div className="rounded-[10px] border border-af-line bg-af-surface p-3">
              <div className="flex items-center justify-between">
                <div className="text-[12.5px] font-medium">Aylin M. · Istanbul</div>
                <span className="inline-flex h-[22px] items-center gap-1.5 rounded-[6px] bg-af-success-soft px-2 text-[11.5px] font-medium text-af-success">
                  <span className="size-1.5 rounded-full bg-af-success" />
                  Approved
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-[11.5px] text-af-ink-3">
                <Check className="size-3 text-af-success" /> 5 of 5 policy checks passed
              </div>
            </div>
          </StepCard>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 bg-af-subtle/70 py-24 md:py-32">
        <div className="mx-auto max-w-[1240px] px-5 md:px-8">
          <Eyebrow>The platform</Eyebrow>
          <h2 className="mt-3 max-w-[720px] text-[34px] font-medium leading-[1.1] tracking-[-0.035em] md:text-[44px]">
            Everything a business trip needs, in a single, quiet workflow.
          </h2>
          <div className="mt-14 grid gap-4 md:grid-cols-12">
            <Feature className="md:col-span-7" icon={WandSparkles} title="AI-powered planning" body="Natural-language requests become structured trip specs — destinations, constraints, meetings, and taste.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  ["Destination", "Istanbul"],
                  ["Duration", "3 nights"],
                  ["Cabin", "Economy"],
                  ["Stay", "Quiet, central"],
                  ["Meeting", "Tue 09:00"],
                  ["Interests", "Museums"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-[9px] border border-af-line bg-af-surface px-3 py-2">
                    <div className="text-[10.5px] uppercase tracking-[0.08em] text-af-ink-3">{k}</div>
                    <div className="text-[13px] font-medium">{v}</div>
                  </div>
                ))}
              </div>
            </Feature>
            <Feature className="md:col-span-5" icon={ShieldCheck} title="Corporate policy enforcement" body="Every option is validated against your travel policy before it ever reaches a manager.">
              <div className="space-y-1.5">
                {["Economy cabin", "Hotel ≤ 250 AZN/night", "Meals ≤ 80 AZN/day", "Leisure excluded"].map((r) => (
                  <div key={r} className="flex items-center justify-between rounded-[8px] bg-af-surface px-3 py-2 text-[12.5px]">
                    {r}
                    <BadgeCheck className="size-4 text-af-success" strokeWidth={1.75} />
                  </div>
                ))}
              </div>
            </Feature>
            <Feature className="md:col-span-4" icon={Sparkles} title="Three optimized packages" body="Essential, balanced, and premium — always inside budget.">
              <div className="space-y-2">
                {showcasePackages.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-[92px] text-[12px] text-af-ink-2">{p.name}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-af-surface">
                      <div
                        className={cn("h-full rounded-full", p.id === "balanced" ? "bg-af-accent" : "bg-[#A9CBC4]")}
                        style={{ width: `${(p.price / 1800) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-[12px] font-medium tabular-nums">{fmt(p.price)}</span>
                  </div>
                ))}
              </div>
            </Feature>
            <div className="group relative min-h-[300px] overflow-hidden rounded-[14px] border border-af-line md:col-span-8">
              <img
                src={images.suleymaniye}
                alt="Süleymaniye Mosque above the Istanbul skyline"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-af-ink/75 via-af-ink/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
                <div className="text-white">
                  <MapIcon className="size-5" strokeWidth={1.6} />
                  <div className="mt-3 text-[18px] font-medium tracking-tight">Travel map and itinerary</div>
                  <p className="mt-1 max-w-[360px] text-[13.5px] text-white/75">
                    Day-by-day plans built around your meetings, with every stop on one map.
                  </p>
                </div>
                <div className="w-full max-w-[260px] rounded-[12px] bg-af-surface/95 p-3 shadow-af-lift backdrop-blur">
                  {[
                    { t: "09:00", l: "Client meeting", i: BriefcaseBusiness, c: "#151A1D" },
                    { t: "15:00", l: "Hagia Sophia area", i: Landmark, c: "#C58A32" },
                    { t: "17:00", l: "Archaeological Museums", i: Landmark, c: "#8A6A3B" },
                  ].map(({ t, l, i: Icon, c }) => (
                    <div key={t} className="flex items-center gap-2.5 py-1">
                      <span className="flex size-6 items-center justify-center rounded-full text-white" style={{ background: c }}>
                        <Icon className="size-3" />
                      </span>
                      <span className="text-[11.5px] text-af-ink-3 tabular-nums">{t}</span>
                      <span className="truncate text-[12.5px] font-medium">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Feature className="md:col-span-6" icon={ScrollText} title="Automated approvals" body="A summary managers can read in ten seconds, backed by a complete audit trail.">
              <div className="relative space-y-2.5 pl-4 before:absolute before:bottom-2 before:left-[3px] before:top-2 before:w-px before:bg-af-line-strong">
                {["Request created", "Policy validated", "Approval requested"].map((e, i) => (
                  <div key={e} className="relative flex items-center justify-between text-[12.5px]">
                    <span className={cn("absolute -left-4 size-[7px] rounded-full", i === 2 ? "bg-af-accent" : "bg-af-ink-3")} />
                    {e}
                    <span className="text-[11.5px] text-af-ink-3 tabular-nums">10:{12 + i * 3}</span>
                  </div>
                ))}
              </div>
            </Feature>
            <Feature className="md:col-span-6" icon={Split} title="Expense intelligence" body="Corporate and personal costs are separated automatically — finance gets clean numbers.">
              <div className="flex h-2.5 overflow-hidden rounded-full">
                <div className="w-[86%] bg-af-accent" />
                <div className="w-[14%] bg-[#D9C6A5]" />
              </div>
              <div className="mt-3 flex justify-between text-[12px]">
                <span className="flex items-center gap-1.5 text-af-ink-2">
                  <span className="size-2 rounded-full bg-af-accent" /> Corporate · 1,450 AZN
                </span>
                <span className="flex items-center gap-1.5 text-af-ink-2">
                  <span className="size-2 rounded-full bg-[#D9C6A5]" /> Personal · 160 AZN
                </span>
              </div>
            </Feature>
          </div>
        </div>
      </section>

      <section id="cta" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 py-24 md:px-8">
        <div className="relative overflow-hidden rounded-[18px] bg-af-ink">
          <img src={images.bosphorus} alt="Ferry crossing the Bosphorus at Eminönü" className="absolute inset-0 size-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-r from-af-ink via-af-ink/80 to-af-ink/20" />
          <div className="relative px-8 py-16 md:px-14 md:py-24">
            <h2 className="max-w-[560px] text-[36px] font-medium leading-[1.05] tracking-[-0.04em] text-white md:text-[52px]">
              Less coordination.
              <br />
              <span className="text-[#9FD0C5]">More movement.</span>
            </h2>
            <p className="mt-5 max-w-[440px] text-[15.5px] text-white/70">
              Plan a complete business trip — policy checks, budget, and approval — in the time it takes to write an email.
            </p>
            <LandingLink href="/start?mode=business" size="lg" className="mt-9 bg-white !text-af-ink hover:bg-[#EEF1EE]">
              Launch EzamAI <ArrowRight className="size-4" />
            </LandingLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-af-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between md:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-6" />
              <span className="text-[15px] font-semibold tracking-[-0.02em]">EzamAI</span>
            </div>
            <p className="mt-3 text-[13px] text-af-ink-3">Business travel, intelligently orchestrated.</p>
          </div>
          <div className="grid grid-cols-3 gap-10 text-[13px]">
            <div>
              <div className="font-medium text-af-ink">Product</div>
              <ul className="mt-3 space-y-2 text-af-ink-3">
                {productLinks.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="hover:text-af-ink">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium text-af-ink">Company</div>
              <ul className="mt-3 space-y-2 text-af-ink-3">
                {["About", "Careers", "Contact"].map((label) => (
                  <li key={label}>
                    <a href="#cta" className="hover:text-af-ink">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium text-af-ink">Trust</div>
              <ul className="mt-3 space-y-2 text-af-ink-3">
                {["Security", "Privacy", "Terms"].map((label) => (
                  <li key={label}>
                    <a href="#cta" className="hover:text-af-ink">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1240px] justify-between border-t border-af-line px-5 py-5 text-[12px] text-af-ink-3 md:px-8">
          <span>© 2026 EzamAI. Demo product.</span>
          <span>Prices shown are illustrative estimates.</span>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ n, title, body, children }: { n: string; title: string; body: string; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-[14px] border border-af-line bg-af-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-af-float">
      <div className="text-[12px] font-medium text-af-accent tabular-nums">{n}</div>
      <div className="mt-3 text-[18px] font-medium tracking-tight">{title}</div>
      <p className="mt-1.5 text-[14px] leading-relaxed text-af-ink-2">{body}</p>
      <div className="mt-6 flex-1 rounded-[12px] bg-af-subtle p-3">{children}</div>
    </div>
  );
}

function Feature({
  className,
  icon: Icon,
  title,
  body,
  children,
}: {
  className?: string;
  icon: typeof Plane;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-[14px] border border-af-line bg-[#FDFDFC] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-af-float",
        className,
      )}
    >
      <Icon className="size-5 text-af-accent" strokeWidth={1.6} />
      <div className="mt-4 text-[17px] font-medium tracking-tight">{title}</div>
      <p className="mt-1 max-w-[440px] text-[14px] leading-relaxed text-af-ink-2">{body}</p>
      <div className="mt-6 rounded-[12px] bg-af-subtle p-3">{children}</div>
    </div>
  );
}

const mapPlaces: { id: string; kind: "airport" | "hotel" | "meeting" | "museum" | "restaurant" | "attraction"; x: number; y: number; name: string }[] = [
  { id: "ist", kind: "airport", name: "Istanbul Airport", x: 70, y: 70 },
  { id: "hotel", kind: "hotel", name: "Pera Garden Hotel", x: 300, y: 268 },
  { id: "meeting", kind: "meeting", name: "Client office", x: 392, y: 118 },
  { id: "dinner1", kind: "restaurant", name: "Asmalımescit dinner", x: 270, y: 300 },
  { id: "lunch", kind: "restaurant", name: "Business lunch", x: 352, y: 196 },
  { id: "hagia", kind: "attraction", name: "Hagia Sophia area", x: 346, y: 432 },
  { id: "museum", kind: "museum", name: "Archaeological Museums", x: 372, y: 398 },
  { id: "dinner2", kind: "restaurant", name: "Karaköy dinner", x: 334, y: 332 },
  { id: "galata", kind: "attraction", name: "Galata Tower", x: 312, y: 318 },
];

const markerColor = {
  airport: "#477BA8",
  hotel: "#246B64",
  meeting: "#151A1D",
  museum: "#8A6A3B",
  restaurant: "#B5655D",
  attraction: "#C58A32",
} as const;

const markerIcon = {
  airport: Plane,
  hotel: BedDouble,
  meeting: BriefcaseBusiness,
  museum: Landmark,
  restaurant: UtensilsCrossed,
  attraction: MapPin,
} as const;

function HeroMap() {
  const route = ["hotel", "meeting", "hagia", "museum"]
    .map((id) => mapPlaces.find((place) => place.id === id))
    .filter((place): place is (typeof mapPlaces)[number] => Boolean(place));
  const routePath = route
    .map((point, index) => {
      if (index === 0) return `M${point.x} ${point.y}`;
      const prev = route[index - 1]!;
      const mx = (prev.x + point.x) / 2;
      const my = (prev.y + point.y) / 2 - Math.min(40, Math.hypot(point.x - prev.x, point.y - prev.y) * 0.18);
      return `Q${mx} ${my} ${point.x} ${point.y}`;
    })
    .join(" ");

  return (
    <div className="relative overflow-hidden" style={{ aspectRatio: "600 / 640" }}>
      <svg viewBox="0 0 600 640" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <pattern id="landing-blocks" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(14)">
            <path d="M0 0H22M0 0V22" stroke="#E3E6E0" strokeWidth="0.8" fill="none" />
          </pattern>
        </defs>
        <rect width="600" height="640" fill="#F0F1EC" />
        <rect width="600" height="640" fill="url(#landing-blocks)" />
        <path d="M200 120c30-14 70-6 80 16s-20 44-56 40-50-42-24-56z" fill="#E1EADD" />
        <path d="M352 378c14-8 30-4 34 8s-8 22-22 22-24-22-12-30z" fill="#E1EADD" />
        <path d="M520 240c24-10 50 4 52 24s-26 32-48 26-28-40-4-50z" fill="#E1EADD" />
        <path d="M90 300c26-8 56 6 58 24s-30 26-52 22-32-38-6-46z" fill="#E7ECE2" />
        <g fill="none" stroke="#FFFFFF" strokeLinecap="round">
          <path d="M0 392C120 378 236 404 336 424" strokeWidth="5" />
          <path d="M110 0C150 140 214 214 262 258" strokeWidth="5" />
          <path d="M300 268C328 206 358 160 392 118 412 92 420 50 420 0" strokeWidth="5" />
          <path d="M0 150C120 160 250 130 380 120" strokeWidth="4" />
          <path d="M395 306L484 290" strokeWidth="5" />
          <path d="M446 152L518 162" strokeWidth="5" />
          <path d="M484 290C520 330 560 360 600 372" strokeWidth="4" />
          <path d="M150 640C170 560 200 520 230 494" strokeWidth="3" />
          <path d="M60 470C140 440 230 450 300 440" strokeWidth="3" />
          <path d="M518 162C540 220 560 260 600 270" strokeWidth="3" />
        </g>
        <g fill="#D3E2E1">
          <path d="M0 502C110 480 220 494 300 472 340 462 362 472 392 482 450 500 520 488 600 472V640H0Z" />
          <path d="M462 0C452 70 476 120 448 180 420 240 410 300 392 350 380 390 378 440 380 480L432 488C428 442 432 400 446 360 466 300 492 250 506 190 522 120 500 60 512 0Z" />
          <path d="M394 340C354 330 318 318 286 296 250 270 210 236 160 214 130 200 100 196 70 200L72 212C104 210 134 216 162 230 206 252 244 284 280 310 316 336 350 356 390 370Z" />
        </g>
        <path d="M0 502C110 480 220 494 300 472 340 462 362 472 392 482 450 500 520 488 600 472" fill="none" stroke="#C3D5D4" strokeWidth="1" />
        <g fill="#9AA19F" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="500" letterSpacing="1.4">
          <text x="186" y="268">BEYOĞLU</text>
          <text x="300" y="168">ŞİŞLİ</text>
          <text x="326" y="88">LEVENT</text>
          <text x="236" y="452">SULTANAHMET</text>
          <text x="150" y="372">FATİH</text>
          <text x="510" y="336">ÜSKÜDAR</text>
          <text x="500" y="458">KADIKÖY</text>
        </g>
        <g fill="#8FB0AE" fontFamily="Inter, sans-serif" fontSize="11" fontStyle="italic">
          <text x="130" y="586">Sea of Marmara</text>
          <text x="0" y="0" transform="translate(452 286) rotate(-68)">Bosphorus</text>
          <text x="0" y="0" transform="translate(118 196) rotate(22)">Golden Horn</text>
        </g>
        <path d="M70 70C140 110 230 170 300 268" fill="none" stroke="#477BA8" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" opacity="0.7" />
        <path d={routePath} fill="none" stroke="#246B64" strokeWidth="5" strokeLinecap="round" opacity="0.12" />
        <path d={routePath} fill="none" stroke="#246B64" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 10" className="animate-af-flow" />
      </svg>
      {mapPlaces.map((place) => {
        const Icon = markerIcon[place.kind];
        return (
          <span
            key={place.id}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(place.x / 600) * 100}%`, top: `${(place.y / 640) * 100}%` }}
          >
            <span
              className="flex size-[18px] items-center justify-center rounded-full border-2 border-white text-white shadow-[0_2px_6px_rgb(21_26_29/0.22)]"
              style={{ background: markerColor[place.kind] }}
            >
              <Icon className="size-2.5" strokeWidth={2} />
            </span>
            <span className="sr-only">{place.name}</span>
          </span>
        );
      })}
    </div>
  );
}

function HeroMockup() {
  const balanced = showcasePackages[1]!;
  return (
    <div className="relative mt-16 pb-24 md:mt-20">
      <div className="relative rounded-[18px] border border-af-line bg-[#F2F3F0] p-2 shadow-[0_40px_80px_-40px_rgb(21_26_29/0.25)]">
        <div className="overflow-hidden rounded-[12px] border border-af-line bg-af-canvas">
          <div className="flex h-10 items-center gap-2 border-b border-af-line bg-af-surface px-4">
            <span className="size-2.5 rounded-full bg-[#E3E5E2]" />
            <span className="size-2.5 rounded-full bg-[#E3E5E2]" />
            <span className="size-2.5 rounded-full bg-[#E3E5E2]" />
            <span className="mx-auto rounded-[6px] bg-af-subtle px-3 py-0.5 text-[11px] text-af-ink-3">
              ezamai.vercel.app
            </span>
          </div>
          <div className="flex">
            <div className="hidden w-[184px] shrink-0 border-r border-af-line bg-[#FCFCFB] p-3 lg:block">
              <div className="mb-3 flex items-center gap-2 rounded-[8px] border border-af-line bg-af-surface p-2">
                <span className="flex size-5 items-center justify-center rounded-[5px] bg-af-ink text-[8px] font-semibold text-white">
                  CV
                </span>
                <span className="text-[11px] font-medium">Caspian Ventures</span>
              </div>
              {["Overview", "New trip", "My trips", "Approvals", "Expenses"].map((label) => (
                <div
                  key={label}
                  className={cn(
                    "rounded-[6px] px-2 py-1.5 text-[11.5px]",
                    label === "My trips" ? "bg-af-accent-soft font-medium text-af-accent" : "text-af-ink-2",
                  )}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1 p-4 md:p-6">
              <div className="text-[10.5px] text-af-ink-3">Trips / Istanbul / Travel plans</div>
              <div className="mt-1.5 text-[18px] font-medium tracking-[-0.02em] md:text-[22px]">
                Three ways to make this trip work.
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[9px] border border-af-line bg-af-surface px-3 py-2 text-[11px] text-af-ink-2">
                <span className="font-medium text-af-ink">Baku → Istanbul</span>
                <span>Oct 13–16</span>
                <span>1 traveler</span>
                <span className="ml-auto">Budget 1,800 AZN</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {showcasePackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={cn(
                      "rounded-[10px] border p-3",
                      pkg.id === "balanced" ? "border-af-accent/45 bg-[#F3F9F7]" : "border-af-line bg-af-surface",
                      pkg.id !== "balanced" && "hidden sm:block",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-af-ink-3">{pkg.tier}</span>
                      {pkg.id === "balanced" ? <span className="size-1.5 rounded-full bg-af-accent" /> : null}
                    </div>
                    <div className="mt-1 text-[13px] font-medium">{pkg.name}</div>
                    <div className="mt-2 text-[20px] font-medium tracking-[-0.03em] tabular-nums">
                      {fmt(pkg.price)} <span className="text-[10px] text-af-ink-3">AZN</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {pkg.details.slice(1, 3).map((detail) => (
                        <div key={detail} className="flex items-center gap-1.5 text-[10.5px] text-af-ink-2">
                          <Check className="size-2.5 text-af-accent" /> {detail}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2.5 md:grid-cols-12">
                <div className="rounded-[10px] border border-af-line bg-af-surface p-3 md:col-span-7">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium">Budget intelligence</span>
                    <span className="text-af-ink-3">350 AZN remaining</span>
                  </div>
                  <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-af-subtle">
                    {budgetCategories.map((category) => (
                      <div
                        key={category.key}
                        style={{
                          width: `${(balanced.breakdown[category.key] / 1800) * 100}%`,
                          background: category.color,
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
                    {budgetCategories.map((category) => (
                      <span key={category.key} className="flex items-center gap-1 text-[10px] text-af-ink-3">
                        <span className="size-1.5 rounded-full" style={{ background: category.color }} />
                        {category.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="relative hidden h-[118px] overflow-hidden rounded-[10px] border border-af-line md:col-span-5 md:block">
                  <div className="absolute inset-x-0 -top-[42%]">
                    <HeroMap />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 top-24 hidden w-[232px] rounded-[12px] border border-af-line bg-af-surface p-3.5 shadow-af-lift md:block lg:-right-6">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-[8px] bg-af-success-soft">
            <ShieldCheck className="size-4 text-af-success" strokeWidth={1.75} />
          </span>
          <div>
            <div className="text-[12.5px] font-medium">Policy compliant</div>
            <div className="text-[11px] text-af-ink-3">5 of 5 checks passed</div>
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="h-1 flex-1 rounded-full bg-af-success" />
          ))}
        </div>
      </div>

      <Link
        href="/demo"
        className="absolute -left-2 bottom-4 hidden w-[260px] rounded-[12px] border border-af-line bg-af-surface p-3.5 text-left shadow-af-lift transition-transform duration-200 hover:-translate-y-0.5 md:block lg:-left-6"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-af-ink-3">Day 1 · Arrival</span>
          <ArrowUpRight className="size-3.5 text-af-ink-3" />
        </div>
        {[
          { t: "09:30", l: "Flight from Baku", i: Plane, c: "#477BA8" },
          { t: "14:30", l: "Pera Garden Hotel", i: BedDouble, c: "#246B64" },
        ].map(({ t, l, i: Icon, c }) => (
          <div key={t} className="mt-2.5 flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full text-white" style={{ background: c }}>
              <Icon className="size-3" />
            </span>
            <span className="text-[11.5px] text-af-ink-3 tabular-nums">{t}</span>
            <span className="text-[12.5px] font-medium">{l}</span>
          </div>
        ))}
      </Link>
    </div>
  );
}
