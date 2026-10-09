"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Check, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTEREST_OPTIONS } from "@/lib/data/request-form";
import { clearDemo } from "@/lib/storage/local-store";
import { saveWorkspaceProfile, type WorkspaceProfile } from "@/lib/storage/workspace-profile";
import type { CabinClass, Currency } from "@/types/travel";

const inputClass = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const currencies: Currency[] = ["AZN", "USD", "EUR", "TRY", "GEL", "AED"];

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "personal" ? "personal" : "business";
  const [mode, setMode] = useState<"personal" | "business">(initialMode);
  const [interests, setInterests] = useState<string[]>(["museums", "architecture"]);
  const [cabins, setCabins] = useState<CabinClass[]>(["economy", "premium_economy"]);
  const title = useMemo(() => mode === "personal" ? "Set up your travel profile" : "Set up your company workspace", [mode]);

  function submit(form: FormData) {
    const currency = String(form.get("currency") ?? "AZN") as Currency;
    const profile: WorkspaceProfile = mode === "personal"
      ? {
          kind: "personal",
          fullName: String(form.get("fullName") ?? ""),
          email: String(form.get("email") ?? ""),
          homeCity: String(form.get("homeCity") ?? "Baku"),
          currency,
          travelBudget: Number(form.get("travelBudget") ?? 1800),
          travelStyle: String(form.get("travelStyle") ?? "balanced") as "value" | "balanced" | "comfort",
          accommodationPreference: String(form.get("accommodationPreference") ?? "either") as "hotel" | "apartment" | "either",
          interests,
        }
      : {
          kind: "business",
          administratorName: String(form.get("administratorName") ?? ""),
          workEmail: String(form.get("workEmail") ?? ""),
          companyName: String(form.get("companyName") ?? ""),
          companySize: String(form.get("companySize") ?? "11–50"),
          companyCountry: String(form.get("companyCountry") ?? "Azerbaijan"),
          currency,
          tripBudgetLimit: Number(form.get("tripBudgetLimit") ?? 2500),
          hotelNightlyLimit: Number(form.get("hotelNightlyLimit") ?? 280),
          allowedCabins: cabins.length ? cabins : ["economy"],
          approvalThreshold: Number(form.get("approvalThreshold") ?? 1200),
          employeeRoles: ["Employee", "Travel manager", "Finance manager"],
        };
    clearDemo();
    saveWorkspaceProfile(profile);
    router.push(mode === "personal" ? "/individual/plan" : "/business");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    submit(new FormData(event.currentTarget));
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-primary">AtlasFlow AI</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">A lightweight demo profile, stored only in this browser. No account or password is required.</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setMode("personal")} className={`rounded-2xl border p-5 text-left transition ${mode === "personal" ? "border-primary bg-accent ring-2 ring-primary/20" : "border-border bg-card"}`}>
            <UserRound className="h-5 w-5 text-primary" />
            <span className="mt-3 block font-semibold">Individual traveler</span>
            <span className="mt-1 block text-sm text-muted-foreground">Preferences, personal budget, packages, itinerary, and booking handoff.</span>
          </button>
          <button type="button" onClick={() => setMode("business")} className={`rounded-2xl border p-5 text-left transition ${mode === "business" ? "border-primary bg-accent ring-2 ring-primary/20" : "border-border bg-card"}`}>
            <Building2 className="h-5 w-5 text-primary" />
            <span className="mt-3 block font-semibold">Business workspace</span>
            <span className="mt-1 block text-sm text-muted-foreground">Company policy, employee requests, approvals, audit, and finance export.</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          {mode === "personal" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input name="fullName" required placeholder="Aylin M." /></Field>
              <Field label="Email"><Input name="email" type="email" required placeholder="aylin@example.com" /></Field>
              <Field label="Home city"><Input name="homeCity" required defaultValue="Baku" /></Field>
              <Field label="Preferred currency"><Select name="currency" options={currencies} /></Field>
              <Field label="Travel budget"><Input name="travelBudget" type="number" min="100" required defaultValue="1800" /></Field>
              <Field label="Travel style"><Select name="travelStyle" options={["value", "balanced", "comfort"]} /></Field>
              <Field label="Accommodation"><Select name="accommodationPreference" options={["either", "hotel", "apartment"]} /></Field>
              <div className="sm:col-span-2"><ChoiceChips label="Interests" values={INTEREST_OPTIONS} selected={interests} onChange={setInterests} /></div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Administrator name"><Input name="administratorName" required placeholder="Nigar A." /></Field>
              <Field label="Work email"><Input name="workEmail" type="email" required placeholder="nigar@company.com" /></Field>
              <Field label="Company name"><Input name="companyName" required defaultValue="Caspian Ventures" /></Field>
              <Field label="Company size"><Select name="companySize" options={["1–10", "11–50", "51–250", "251+"]} /></Field>
              <Field label="Company country"><Input name="companyCountry" required defaultValue="Azerbaijan" /></Field>
              <Field label="Preferred currency"><Select name="currency" options={currencies} /></Field>
              <Field label="Maximum trip budget"><Input name="tripBudgetLimit" type="number" min="100" required defaultValue="2500" /></Field>
              <Field label="Hotel nightly limit"><Input name="hotelNightlyLimit" type="number" min="1" required defaultValue="280" /></Field>
              <Field label="Approval required above"><Input name="approvalThreshold" type="number" min="0" required defaultValue="1200" /></Field>
              <div><ChoiceChips label="Allowed flight classes" values={["economy", "premium_economy", "business"]} selected={cabins} onChange={(items) => setCabins(items as CabinClass[])} /></div>
              <div className="sm:col-span-2 rounded-xl bg-muted p-4 text-sm text-muted-foreground"><strong className="text-foreground">Demo roles:</strong> Employee, Travel manager, and Finance manager. Role switching is simulated and clearly labeled in the workspace.</div>
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <p className="text-xs text-muted-foreground">Synthetic catalog prices · external booking handoff · browser-local profile</p>
            <Button type="submit">Continue to {mode === "personal" ? "personal planner" : "business dashboard"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1.5"><Label>{label}</Label>{children}</label>;
}

function Select({ name, options }: { name: string; options: readonly string[] }) {
  return <select name={name} className={inputClass}>{options.map((option) => <option key={option} value={option} className="capitalize">{option.replaceAll("_", " ")}</option>)}</select>;
}

function ChoiceChips({ label, values, selected, onChange }: { label: string; values: readonly string[]; selected: string[]; onChange: (values: string[]) => void }) {
  return <div><Label>{label}</Label><div className="mt-2 flex flex-wrap gap-2">{values.map((value) => { const active = selected.includes(value); return <button key={value} type="button" onClick={() => onChange(active ? selected.filter((item) => item !== value) : [...selected, value])} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs capitalize ${active ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card"}`}>{active ? <Check className="h-3 w-3" /> : null}{value.replaceAll("_", " ")}</button>; })}</div></div>;
}
