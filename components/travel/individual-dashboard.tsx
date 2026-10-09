"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, CalendarDays, Heart, Settings2, Sparkles, Wallet, Wand2 } from "lucide-react";
import { WorkspaceNav } from "@/components/travel/workspace-nav";
import { emptyFormValues } from "@/lib/data/demo-scenario";
import { loadDemo, saveDemo } from "@/lib/storage/local-store";
import { loadWorkspaceProfile, type WorkspaceProfile } from "@/lib/storage/workspace-profile";
import { selectedOrFirst } from "@/lib/planning/planner";
import { cn } from "@/lib/utils";
import type { TripRecord } from "@/types/travel";

const EXAMPLE = "I want to spend four days in Istanbul with a 1,200 AZN budget. I prefer apartments and enjoy museums and local food.";
const photo = (id: string) => `https://images.unsplash.com/${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`;

const destinations = [
  { n: "Istanbul", c: "Türkiye", img: photo("photo-1623621534850-d325a1980c7e"), f: "Supported city", city: "Istanbul" },
  { n: "Tbilisi", c: "Georgia", img: photo("photo-1733087710900-7d65e44d6550"), f: "Supported city", city: "Tbilisi" },
  { n: "Dubai", c: "UAE", img: photo("photo-1512453979798-5ea266f8880c"), f: "Supported city", city: "Dubai" },
  { n: "Bosphorus", c: "Day cruise", img: photo("photo-1589561454226-796a8aa89b05"), f: "Illustrative", city: "" },
];

export function IndividualDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Extract<WorkspaceProfile, { kind: "personal" }> | null>(null);
  const [record, setRecord] = useState<TripRecord | null>(null);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<string[]>(["Istanbul", "Tbilisi"]);

  useEffect(() => {
    const loaded = loadWorkspaceProfile();
    if (loaded?.kind === "personal") setProfile(loaded);
    setRecord(loadDemo()?.record ?? null);
  }, []);

  const firstName = profile?.fullName.split(" ")[0] || "there";
  const selected = record ? selectedOrFirst(record.plan, record.selectedPackageId) : undefined;
  const budget = profile?.travelBudget ?? record?.request.corporateBudget ?? 1800;
  const spent = selected?.corporateTotal ?? 0;

  function planFromText() {
    const existing = loadDemo();
    saveDemo({
      role: existing?.role ?? "employee",
      record: existing?.record ?? null,
      draft: { ...(existing?.draft ?? { ...emptyFormValues, employeeName: profile?.fullName ?? "", origin: profile?.homeCity ?? "Baku", corporateBudget: budget, currency: profile?.currency ?? "AZN", accommodationPreference: profile?.accommodationPreference ?? "either", interests: profile?.interests ?? [] }), freeText: text },
      interpretationNotes: existing?.interpretationNotes ?? [],
    });
    router.push("/individual/plan");
  }

  return (
    <div className="min-h-screen bg-af-canvas text-af-ink lg:flex">
      <WorkspaceNav profile={profile} />
      <main className="min-w-0 flex-1 px-5 py-7 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-af-accent">Good to see you, {firstName}</p>
            <h1 className="mt-2 text-[30px] font-medium leading-[1.1] tracking-[-0.03em] md:text-[38px]">Where to next?</h1>
            <p className="mt-2 text-[15px] text-af-ink-2">Your next great journey starts with a smarter plan.</p>
          </div>
          <Link href="/individual/plan" className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-af-accent px-4 text-[14px] font-medium text-white hover:bg-af-accent-hover">
            Plan a new trip <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-7 rounded-[16px] border border-af-line bg-white p-1.5 shadow-[0_1px_2px_rgb(21_26_29/0.04)] focus-within:border-af-accent/45 focus-within:ring-4 focus-within:ring-af-accent/10">
          <div className="flex items-start gap-3 px-4 pt-4">
            <Wand2 className="mt-1 size-[18px] shrink-0 text-af-accent" strokeWidth={1.6} />
            <textarea value={text} onChange={(event) => setText(event.target.value)} rows={2} placeholder="Describe your next trip…" aria-label="Describe your next trip" className="min-h-[56px] w-full resize-none bg-transparent text-[16px] leading-relaxed outline-none placeholder:text-af-ink-3" />
          </div>
          <div className="flex flex-col gap-3 px-3 pb-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => setText(EXAMPLE)} className="flex min-w-0 items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[12.5px] text-af-ink-3 hover:bg-af-subtle hover:text-af-ink-2">
              <Sparkles className="size-3.5 shrink-0" />
              <span className="truncate">Try: “{EXAMPLE}”</span>
            </button>
            <button type="button" disabled={!text.trim()} onClick={planFromText} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[9px] bg-af-accent px-3 text-[13px] font-medium text-white disabled:opacity-40">
              Plan this trip <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-8">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[16px] font-medium">Upcoming trips</h2>
                <Link href="/individual/trips" className="text-[12.5px] font-medium text-af-ink-2 hover:text-af-ink">View all</Link>
              </div>
              {selected && record ? (
                <Link href="/individual/trips" className="grid overflow-hidden rounded-[14px] border border-af-line bg-white text-left sm:grid-cols-[240px_1fr]">
                  <div className="h-[160px] bg-af-accent-soft sm:h-full" />
                  <div className="p-5">
                    <span className="rounded-full bg-af-accent-soft px-2 py-1 text-[11px] font-medium text-af-accent">{record.approval.status}</span>
                    <div className="mt-3 text-[18px] font-medium tracking-tight">{record.request.origin} → {record.request.destination}</div>
                    <div className="mt-1 flex items-center gap-1 text-[12.5px] text-af-ink-3"><CalendarDays className="size-3" /> {record.request.departureDate} – {record.request.returnDate}</div>
                    <div className="mt-4 text-[22px] font-medium tracking-[-0.03em]">{selected.corporateTotal.toLocaleString("en-US")} {record.request.currency}</div>
                    <div className="text-[11.5px] text-af-ink-3">{selected.tier} · of {record.request.corporateBudget.toLocaleString("en-US")} {record.request.currency}</div>
                  </div>
                </Link>
              ) : (
                <div className="rounded-[14px] border border-dashed border-af-line-strong bg-white p-6">
                  <p className="text-[15px] font-medium">No saved trip yet</p>
                  <p className="mt-1 text-[13px] text-af-ink-2">Generate a plan and it will appear here. The destination photos below are catalog illustrations.</p>
                  <Link href="/individual/plan" className="mt-4 inline-flex text-[13px] font-medium text-af-accent">Open the planner <ArrowUpRight className="size-3.5" /></Link>
                </div>
              )}
            </section>

            <section id="saved">
              <h2 className="mb-3 text-[16px] font-medium">Saved destinations</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {destinations.map((item) => {
                  const isSaved = saved.includes(item.n);
                  return (
                    <div key={item.n} className="group relative overflow-hidden rounded-[12px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.img} alt={item.n} className="aspect-[4/5] w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#151a1d]/70 via-transparent to-transparent" />
                      <button type="button" onClick={() => setSaved(isSaved ? saved.filter((name) => name !== item.n) : [...saved, item.n])} aria-label={isSaved ? `Remove ${item.n}` : `Save ${item.n}`} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90">
                        <Heart className={cn("size-3.5", isSaved && "fill-af-accent text-af-accent")} />
                      </button>
                      <Link href={item.city ? `/individual/plan` : "/individual"} className="absolute inset-x-3 bottom-3 text-white">
                        <div className="text-[14px] font-medium">{item.n}</div>
                        <div className="text-[11.5px] text-white/75">{item.c} · {item.f}</div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-4">
            <section id="budget" className="rounded-[14px] border border-af-line bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[14px] font-medium"><Wallet className="size-4 text-af-accent" /> Travel budget</div>
                <span className="rounded-full bg-af-subtle px-2 py-0.5 text-[11px] text-af-ink-2">{profile?.currency ?? "AZN"}</span>
              </div>
              <div className="mt-4 text-[28px] font-medium tracking-[-0.035em]">{Math.max(budget - spent, 0).toLocaleString("en-US")}</div>
              <div className="text-[12px] text-af-ink-3">remaining of {budget.toLocaleString("en-US")} {profile?.currency ?? "AZN"}</div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-af-subtle">
                <div className="h-full rounded-full bg-af-accent" style={{ width: `${Math.min(100, budget > 0 ? (spent / budget) * 100 : 0)}%` }} />
              </div>
            </section>
            <section className="rounded-[14px] border border-af-line bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-medium">Travel preferences</div>
                <Link href="/start?mode=personal" className="flex items-center gap-1 text-[12.5px] font-medium text-af-ink-2"><Settings2 className="size-3.5" /> Edit</Link>
              </div>
              <dl className="mt-3 divide-y divide-af-line text-[13px]">
                {[
                  ["Style", profile?.travelStyle ?? "balanced"],
                  ["Stays", profile?.accommodationPreference ?? "either"],
                  ["Home", profile?.homeCity ?? "Baku"],
                  ["Interests", profile?.interests.join(", ") || "Not set"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 py-2">
                    <dt className="text-af-ink-3">{label}</dt>
                    <dd className="truncate text-right font-medium capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
