"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Inter } from "next/font/google";
import { ArrowLeft, ArrowRight, Building2, Check, Compass, PlayCircle, Sparkles } from "lucide-react";
import { INTEREST_OPTIONS } from "@/lib/data/request-form";
import { clearDemo } from "@/lib/storage/local-store";
import { saveWorkspaceProfile, type WorkspaceProfile } from "@/lib/storage/workspace-profile";
import { cn } from "@/lib/utils";
import type { CabinClass, Currency } from "@/types/travel";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });
const currencies: Currency[] = ["AZN", "USD", "EUR", "TRY", "GEL", "AED"];
const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

type Step = "choose" | "personal" | "prefs" | "business" | "policy";

function LogoMark() {
  return (
    <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
      <rect width="28" height="28" rx="8" fill="#246B64" />
      <path d="M7.5 20.5c3.2 0 3.6-6.5 6.5-6.5s3.2-6.5 6.5-6.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7.5" cy="20.5" r="2" fill="#fff" />
      <circle cx="20.5" cy="7.5" r="2.6" fill="none" stroke="#fff" strokeWidth="1.6" />
    </svg>
  );
}

const fieldClass =
  "h-11 w-full rounded-[10px] border border-af-line bg-af-surface px-3.5 text-[14px] text-af-ink outline-none transition-[border-color,box-shadow] placeholder:text-af-ink-3 hover:border-af-line-strong focus:border-af-accent/60 focus:ring-4 focus:ring-af-accent/10";

export function OnboardingFlow() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("mode");
  const [step, setStep] = useState<Step>(requested === "personal" ? "personal" : requested === "business" ? "business" : "choose");
  const [selected, setSelected] = useState<"personal" | "business" | null>(requested === "personal" || requested === "business" ? requested : null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [homeCity, setHomeCity] = useState("Baku");
  const [currency, setCurrency] = useState<Currency>("AZN");
  const [travelBudget, setTravelBudget] = useState("1800");
  const [travelStyle, setTravelStyle] = useState<"value" | "balanced" | "comfort">("balanced");
  const [stay, setStay] = useState<"hotel" | "apartment" | "either">("either");
  const [interests, setInterests] = useState<string[]>(["museums", "architecture"]);
  const [adminName, setAdminName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [companyName, setCompanyName] = useState("Caspian Ventures");
  const [companySize, setCompanySize] = useState("11–50");
  const [companyCountry, setCompanyCountry] = useState("Azerbaijan");
  const [tripBudget, setTripBudget] = useState("2500");
  const [nightly, setNightly] = useState("280");
  const [threshold, setThreshold] = useState("1200");
  const [cabins, setCabins] = useState<CabinClass[]>(["economy", "premium_economy"]);
  const [error, setError] = useState("");

  function finish(profile: WorkspaceProfile) {
    clearDemo();
    saveWorkspaceProfile(profile);
    window.location.assign(profile.kind === "personal" ? "/individual/plan" : "/business");
  }

  function startDemo(kind: "personal" | "business") {
    if (kind === "personal") {
      finish({
        kind: "personal",
        fullName: "Aylin M.",
        email: "aylin@example.com",
        homeCity: "Baku",
        currency: "AZN",
        travelBudget: 1800,
        travelStyle: "balanced",
        accommodationPreference: "either",
        interests: ["museums", "architecture"],
      });
      return;
    }
    finish({
      kind: "business",
      administratorName: "Aylin M.",
      workEmail: "aylin@caspian.example",
      companyName: "Caspian Ventures",
      companySize: "11–50",
      companyCountry: "Azerbaijan",
      currency: "AZN",
      tripBudgetLimit: 2500,
      hotelNightlyLimit: 280,
      allowedCabins: ["economy", "premium_economy"],
      approvalThreshold: 1200,
      employeeRoles: ["Employee", "Travel manager", "Finance manager"],
    });
  }

  function continuePersonal(event: FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 2) return setError("Enter your full name.");
    if (!emailOk(email)) return setError("Enter a valid email, like name@example.com.");
    if (homeCity.trim().length < 2) return setError("Enter your home city.");
    setError("");
    setStep("prefs");
  }

  function savePersonal(event: FormEvent) {
    event.preventDefault();
    const budget = Number(travelBudget);
    if (!Number.isFinite(budget) || budget <= 0) return setError("Enter a travel budget greater than zero.");
    if (interests.length === 0) return setError("Choose at least one interest.");
    setError("");
    finish({
      kind: "personal",
      fullName: fullName.trim(),
      email: email.trim(),
      homeCity: homeCity.trim(),
      currency,
      travelBudget: budget,
      travelStyle,
      accommodationPreference: stay,
      interests,
    });
  }

  function continueBusiness(event: FormEvent) {
    event.preventDefault();
    if (adminName.trim().length < 2) return setError("Enter the administrator name.");
    if (!emailOk(workEmail)) return setError("Enter a valid work email.");
    if (companyName.trim().length < 2) return setError("Enter the company name.");
    setError("");
    setStep("policy");
  }

  function saveBusiness(event: FormEvent) {
    event.preventDefault();
    const trip = Number(tripBudget);
    const hotel = Number(nightly);
    const approval = Number(threshold);
    if (![trip, hotel, approval].every((value) => Number.isFinite(value) && value >= 0) || trip <= 0 || hotel <= 0) {
      return setError("Enter a trip budget and nightly cap greater than zero.");
    }
    if (cabins.length === 0) return setError("Allow at least one cabin class.");
    setError("");
    finish({
      kind: "business",
      administratorName: adminName.trim(),
      workEmail: workEmail.trim(),
      companyName: companyName.trim(),
      companySize,
      companyCountry: companyCountry.trim(),
      currency,
      tripBudgetLimit: trip,
      hotelNightlyLimit: hotel,
      allowedCabins: cabins,
      approvalThreshold: approval,
      employeeRoles: ["Employee", "Travel manager", "Finance manager"],
    });
  }

  const progress =
    step === "personal" ? { step: 1, total: 2, label: "Your details" }
    : step === "prefs" ? { step: 2, total: 2, label: "Preferences" }
    : step === "business" ? { step: 1, total: 2, label: "Company" }
    : step === "policy" ? { step: 2, total: 2, label: "Travel policy" }
    : null;

  return (
    <div className={cn(inter.className, "min-h-screen bg-af-canvas text-af-ink")}>
      <header className="sticky top-0 z-30 border-b border-af-line/70 bg-af-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="EzamAI home">
            <LogoMark />
            <span className="hidden text-[16px] font-semibold tracking-[-0.02em] sm:inline">EzamAI</span>
          </Link>
          {step !== "choose" ? (
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep(step === "prefs" ? "personal" : step === "policy" ? "business" : "choose");
              }}
              className="ml-2 flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[13px] text-af-ink-2 hover:bg-af-subtle hover:text-af-ink"
            >
              <ArrowLeft className="size-3.5" /> Back
            </button>
          ) : null}
          {progress ? (
            <div className="mx-auto hidden items-center gap-3 md:flex">
              <span className="text-[12px] text-af-ink-3">Step {progress.step} of {progress.total}</span>
              <div className="flex gap-1">
                {[0, 1].map((index) => (
                  <span key={index} className={cn("h-1 w-8 rounded-full", index < progress.step ? "bg-af-accent" : "bg-af-line")} />
                ))}
              </div>
              <span className="text-[12px] font-medium">{progress.label}</span>
            </div>
          ) : null}
          <div className="ml-auto text-[13px] text-af-ink-2">
            <span className="hidden sm:inline">No password. Stored in this browser.</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1080px] px-5 pb-24 pt-10 md:px-8 md:pt-14">
        {step === "choose" ? <Choose selected={selected} onSelect={setSelected} onContinue={(kind) => { setError(""); setStep(kind); }} demoOpen={demoOpen} setDemoOpen={setDemoOpen} onDemo={startDemo} /> : null}
        {step === "personal" ? (
          <AccountStep
            title="Create your traveler profile"
            body="Tell us a little about yourself. This demo keeps the profile in this browser and does not create an account."
            onSubmit={continuePersonal}
            error={error}
            action="Continue to preferences"
          >
            <Field label="Full name"><input className={fieldClass} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Aylin M." required /></Field>
            <Field label="Email address"><input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></Field>
            <Field label="Home city"><input className={fieldClass} value={homeCity} onChange={(event) => setHomeCity(event.target.value)} required /></Field>
            <Field label="Preferred currency"><CurrencySelect value={currency} onChange={setCurrency} /></Field>
          </AccountStep>
        ) : null}
        {step === "prefs" ? (
          <AccountStep title="Set your travel preferences" body="These choices prefill the planner. You can still edit the trip before packages are generated." onSubmit={savePersonal} error={error} action="Open my planner">
            <Field label="Travel budget"><input className={fieldClass} type="number" min="1" value={travelBudget} onChange={(event) => setTravelBudget(event.target.value)} required /></Field>
            <Field label="Travel style">
              <select className={fieldClass} value={travelStyle} onChange={(event) => setTravelStyle(event.target.value as typeof travelStyle)}>
                <option value="value">Value</option>
                <option value="balanced">Balanced</option>
                <option value="comfort">Comfort</option>
              </select>
            </Field>
            <Field label="Accommodation">
              <select className={fieldClass} value={stay} onChange={(event) => setStay(event.target.value as typeof stay)}>
                <option value="either">Hotel or apartment</option>
                <option value="hotel">Hotel</option>
                <option value="apartment">Apartment</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <p className="text-[12.5px] font-medium text-af-ink-2">Interests</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const active = interests.includes(interest);
                  return (
                    <button key={interest} type="button" onClick={() => setInterests(active ? interests.filter((item) => item !== interest) : [...interests, interest])} className={cn("inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13.5px] capitalize", active ? "border-af-accent/45 bg-af-accent-soft font-medium text-af-accent" : "border-af-line bg-af-surface text-af-ink-2")}>
                      {interest}
                      {active ? <Check className="size-3.5" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </AccountStep>
        ) : null}
        {step === "business" ? (
          <AccountStep title="Set up your company workspace" body="Company details stay in this browser. There is no login and no payment." onSubmit={continueBusiness} error={error} action="Continue to travel policy">
            <Field label="Administrator name"><input className={fieldClass} value={adminName} onChange={(event) => setAdminName(event.target.value)} placeholder="Nigar A." required /></Field>
            <Field label="Work email"><input className={fieldClass} type="email" value={workEmail} onChange={(event) => setWorkEmail(event.target.value)} placeholder="nigar@company.com" required /></Field>
            <Field label="Company name"><input className={fieldClass} value={companyName} onChange={(event) => setCompanyName(event.target.value)} required /></Field>
            <Field label="Company size">
              <select className={fieldClass} value={companySize} onChange={(event) => setCompanySize(event.target.value)}>
                {["1–10", "11–50", "51–250", "251+"].map((size) => <option key={size}>{size}</option>)}
              </select>
            </Field>
            <Field label="Company country"><input className={fieldClass} value={companyCountry} onChange={(event) => setCompanyCountry(event.target.value)} required /></Field>
            <Field label="Preferred currency"><CurrencySelect value={currency} onChange={setCurrency} /></Field>
          </AccountStep>
        ) : null}
        {step === "policy" ? (
          <AccountStep title="Company travel policy" body="These limits are enforced by the planner on the next trip. Leisure stays personal unless you change that later." onSubmit={saveBusiness} error={error} action="Open the business workspace">
            <Field label="Maximum trip budget"><input className={fieldClass} type="number" min="1" value={tripBudget} onChange={(event) => setTripBudget(event.target.value)} required /></Field>
            <Field label="Hotel nightly limit"><input className={fieldClass} type="number" min="1" value={nightly} onChange={(event) => setNightly(event.target.value)} required /></Field>
            <Field label="Approval required above"><input className={fieldClass} type="number" min="0" value={threshold} onChange={(event) => setThreshold(event.target.value)} required /></Field>
            <div>
              <p className="text-[12.5px] font-medium text-af-ink-2">Allowed flight classes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["economy", "premium_economy", "business"] as CabinClass[]).map((cabin) => {
                  const active = cabins.includes(cabin);
                  return (
                    <button key={cabin} type="button" onClick={() => setCabins(active ? cabins.filter((item) => item !== cabin) : [...cabins, cabin])} className={cn("inline-flex h-10 items-center rounded-full border px-4 text-[13.5px] capitalize", active ? "border-af-accent/45 bg-af-accent-soft font-medium text-af-accent" : "border-af-line bg-af-surface text-af-ink-2")}>
                      {cabin.replaceAll("_", " ")}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="sm:col-span-2 rounded-[10px] bg-af-subtle px-3.5 py-2.5 text-[12px] leading-relaxed text-af-ink-3">Demo roles in the workspace: Employee, Travel manager, and Finance manager. Switching roles is a labeled simulation.</p>
          </AccountStep>
        ) : null}
      </main>
    </div>
  );
}

function Choose({
  selected,
  onSelect,
  onContinue,
  demoOpen,
  setDemoOpen,
  onDemo,
}: {
  selected: "personal" | "business" | null;
  onSelect: (value: "personal" | "business") => void;
  onContinue: (value: "personal" | "business") => void;
  demoOpen: boolean;
  setDemoOpen: (value: boolean) => void;
  onDemo: (value: "personal" | "business") => void;
}) {
  const options = {
    personal: {
      icon: Compass,
      title: "For myself",
      description: "Plan personalized trips, compare travel packages, explore destinations, and stay within your budget.",
      features: ["Personalized travel planning", "Flight and accommodation options", "Budget optimization", "Attractions and itineraries", "Interactive maps"],
      cta: "Continue as Traveler",
      tag: "Individual traveler",
    },
    business: {
      icon: Building2,
      title: "For my organization",
      description: "Manage business trips, enforce company travel policies, streamline approvals, and track expenses.",
      features: ["Corporate travel management", "Employee travel requests", "Company policy enforcement", "Budget and expense control", "Approval workflows"],
      cta: "Continue as Business",
      tag: "Business / company",
    },
  } as const;
  return (
    <>
      <div className="mx-auto max-w-[640px] text-center">
        <h1 className="text-[32px] font-medium leading-[1.1] tracking-[-0.035em] md:text-[44px]">How will you use EzamAI?</h1>
        <p className="mt-3 text-[15.5px] text-af-ink-2">Your journey starts here. Choose the experience that fits you best.</p>
      </div>
      <div role="radiogroup" aria-label="Account type" className="mx-auto mt-10 grid max-w-[920px] gap-4 md:grid-cols-2">
        {(Object.keys(options) as Array<keyof typeof options>).map((key) => {
          const option = options[key];
          const Icon = option.icon;
          const isSelected = selected === key;
          return (
            <div key={key} role="radio" aria-checked={isSelected} tabIndex={0} onClick={() => onSelect(key)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(key); } }} className={cn("flex cursor-pointer flex-col rounded-[16px] border p-6 transition-all duration-200 md:p-7", isSelected ? "border-af-accent bg-[#F4F9F7] ring-[3px] ring-af-accent/10" : "border-af-line bg-af-surface hover:-translate-y-0.5 hover:border-af-line-strong hover:shadow-af-float")}>
              <div className="flex items-start justify-between">
                <span className={cn("flex size-11 items-center justify-center rounded-[12px]", isSelected ? "bg-af-accent text-white" : "bg-af-subtle text-af-ink")}><Icon className="size-5" strokeWidth={1.6} /></span>
                <span className={cn("flex size-[22px] items-center justify-center rounded-full border-2", isSelected ? "border-af-accent bg-af-accent text-white" : "border-af-line-strong")}>{isSelected ? <Check className="size-3" strokeWidth={3} /> : null}</span>
              </div>
              <div className="mt-6 text-[11px] font-medium uppercase tracking-[0.1em] text-af-ink-3">{option.tag}</div>
              <h2 className="mt-1.5 text-[22px] font-medium tracking-[-0.02em]">{option.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-af-ink-2">{option.description}</p>
              <ul className={cn("mt-5 space-y-2.5 border-t pt-5", isSelected ? "border-af-accent/15" : "border-af-line")}>
                {option.features.map((feature) => <li key={feature} className="flex items-center gap-2.5 text-[13.5px]"><Check className="size-3.5 shrink-0 text-af-accent" />{feature}</li>)}
              </ul>
              <button type="button" onClick={(event) => { event.stopPropagation(); onContinue(key); }} className={cn("mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] text-[14.5px] font-medium", isSelected ? "bg-af-accent text-white hover:bg-af-accent-hover" : "border border-af-line bg-af-surface")}>
                {option.cta} <ArrowRight className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="mx-auto mt-6 max-w-[920px]">
        <div className={cn("rounded-[16px] border border-dashed", demoOpen ? "border-af-accent/40 bg-af-surface" : "border-af-line-strong")}>
          <button type="button" onClick={() => setDemoOpen(!demoOpen)} aria-expanded={demoOpen} className="flex w-full flex-col items-start gap-3 p-5 text-left sm:flex-row sm:items-center">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-af-accent-soft text-af-accent"><PlayCircle className="size-5" strokeWidth={1.6} /></span>
            <span className="flex-1">
              <span className="block text-[15px] font-medium">Explore demo without signing up</span>
              <span className="block text-[13px] text-af-ink-2">Loads the seeded Istanbul scenario into this browser. No account is created.</span>
            </span>
            <span className="text-[13px] font-medium text-af-accent">{demoOpen ? "Hide options" : "Choose a demo →"}</span>
          </button>
          {demoOpen ? (
            <div className="grid gap-3 border-t border-af-line p-5 sm:grid-cols-2">
              <DemoChoice icon={Compass} title="Personal demo" body="Aylin M. plans Baku to Istanbul inside a personal budget." onClick={() => onDemo("personal")} />
              <DemoChoice icon={Building2} title="Business demo" body="Caspian Ventures — policy, packages, approval, and a finance CSV." onClick={() => onDemo("business")} />
            </div>
          ) : null}
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-af-ink-3"><Sparkles className="size-3.5" /> Passwords and social sign-in are not part of this demo.</p>
      </div>
    </>
  );
}

function DemoChoice({ icon: Icon, title, body, onClick }: { icon: typeof Compass; title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex items-center gap-3.5 rounded-[12px] border border-af-line bg-af-canvas p-4 text-left hover:border-af-accent/40 hover:bg-[#F4F9F7]">
      <Icon className="size-5 text-af-ink-2 group-hover:text-af-accent" strokeWidth={1.6} />
      <span className="flex-1">
        <span className="block text-[14px] font-medium">{title}</span>
        <span className="block text-[12.5px] text-af-ink-3">{body}</span>
      </span>
      <ArrowRight className="size-4 text-af-ink-3 group-hover:text-af-accent" />
    </button>
  );
}

function AccountStep({ title, body, onSubmit, error, action, children }: { title: string; body: string; onSubmit: (event: FormEvent) => void; error: string; action: string; children: ReactNode }) {
  return (
    <form onSubmit={onSubmit} className="mx-auto grid max-w-[720px] gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <h1 className="text-[28px] font-medium leading-[1.15] tracking-[-0.03em] md:text-[34px]">{title}</h1>
        <p className="mt-2.5 text-[15px] text-af-ink-2">{body}</p>
      </div>
      {children}
      {error ? <p role="alert" className="sm:col-span-2 text-[13px] text-[#c85b53]">{error}</p> : null}
      <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-af-accent px-5 text-[14.5px] font-medium text-white hover:bg-af-accent-hover sm:col-span-2">
        {action} <ArrowRight className="size-4" />
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-af-ink-2">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function CurrencySelect({ value, onChange }: { value: Currency; onChange: (value: Currency) => void }) {
  return (
    <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value as Currency)}>
      {currencies.map((currency) => <option key={currency}>{currency}</option>)}
    </select>
  );
}
