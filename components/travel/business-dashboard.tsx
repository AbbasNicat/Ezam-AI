"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDollarSign, Clock3, FilePlus2, PencilLine, ShieldCheck, UserPlus } from "lucide-react";
import { WorkspaceNav } from "@/components/travel/workspace-nav";
import { loadDemo } from "@/lib/storage/local-store";
import { loadWorkspaceProfile, type WorkspaceProfile } from "@/lib/storage/workspace-profile";
import { selectedOrFirst } from "@/lib/planning/planner";
import type { TripRecord } from "@/types/travel";

const sampleSpend = [
  ["Sales", 7840],
  ["Business Development", 6120],
  ["Engineering", 5260],
  ["Operations", 3480],
  ["Finance", 2160],
] as const;

export function BusinessDashboard() {
  const [profile, setProfile] = useState<Extract<WorkspaceProfile, { kind: "business" }> | null>(null);
  const [record, setRecord] = useState<TripRecord | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loaded = loadWorkspaceProfile();
    if (loaded?.kind === "business") setProfile(loaded);
    setRecord(loadDemo()?.record ?? null);
  }, []);

  const firstName = profile?.administratorName.split(" ")[0] || "there";
  const company = profile?.companyName || "Caspian Ventures";
  const selected = record ? selectedOrFirst(record.plan, record.selectedPackageId) : undefined;
  const pending = record?.approval.status === "pending" ? 1 : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-af-canvas text-af-ink lg:flex">
      <WorkspaceNav profile={profile} />
      <main className="min-w-0 flex-1 px-5 py-7 sm:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[28px] font-medium leading-[1.1] tracking-[-0.03em] md:text-[34px]">{greeting}, {firstName}.</h1>
            <p className="mt-2 text-[15px] text-af-ink-2">Here is what is happening across your organization&apos;s travel operations.</p>
          </div>
          <Link href="/business/requests" className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-af-accent px-3.5 text-[13px] font-medium text-white">
            <FilePlus2 className="size-3.5" /> Create travel request
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Action href="/business/requests" icon={FilePlus2} label="Create travel request" />
          <button type="button" onClick={() => setNotice("Team invites are unavailable in this demo.")} className="group flex items-center gap-3 rounded-[12px] border border-af-line bg-white px-4 py-3 text-left hover:border-af-line-strong">
            <UserPlus className="size-4 text-af-accent" />
            <span className="flex-1 text-[13px] font-medium">Invite employee</span>
            <ArrowRight className="size-3.5 text-af-ink-3" />
          </button>
          <Action href="/business/policies" icon={PencilLine} label="Edit company policy" />
          <Action href="/business/approvals" icon={ShieldCheck} label="Review approvals" badge={pending || undefined} />
        </div>
        {notice ? <p className="mt-3 text-[13px] text-af-ink-2">{notice}</p> : null}

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={Clock3} label="Pending travel requests" value={String(pending)} sub="From the trip saved in this browser" />
          <Kpi icon={CheckCircle2} label="Approved trips" value={record?.approval.status === "approved" ? "1" : "0"} sub="This browser only" />
          <Kpi icon={CircleDollarSign} label="Estimated corporate spending" value={selected ? `${selected.corporateTotal.toLocaleString("en-US")}` : "—"} sub={selected ? record?.request.currency ?? "AZN" : "Generate a plan to see a total"} />
          <Kpi icon={AlertTriangle} label="Policy exceptions" value={String(selected?.policyEvaluation.violations.length ?? 0)} sub="On the selected package" warn />
        </div>
        <p className="mt-2 text-[11.5px] text-af-ink-3">Live counts come from this browser. Department charts below are an illustrative sample for {company}.</p>

        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          <section className="overflow-hidden rounded-[14px] border border-af-line bg-white lg:col-span-8">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-[15px] font-medium">Recent travel requests</h2>
              <Link href="/business/approvals" className="text-[12.5px] font-medium text-af-ink-2">View all</Link>
            </div>
            {record && selected ? (
              <Link href="/business/approvals" className="flex items-center justify-between gap-3 border-t border-af-line px-5 py-3 hover:bg-af-subtle/60">
                <div>
                  <div className="text-[13.5px] font-medium">{record.request.employeeName}</div>
                  <div className="text-[12px] text-af-ink-3">{record.request.origin} → {record.request.destination} · {record.request.departureDate}</div>
                </div>
                <div className="text-right text-[13.5px] font-medium">{selected.corporateTotal.toLocaleString("en-US")} {record.request.currency}</div>
                <span className="rounded-full bg-af-accent-soft px-2 py-1 text-[11px] capitalize text-af-accent">{record.approval.status.replaceAll("_", " ")}</span>
              </Link>
            ) : (
              <p className="border-t border-af-line px-5 py-6 text-[13px] text-af-ink-2">No request has been generated in this browser yet.</p>
            )}
          </section>
          <section className="rounded-[14px] border border-af-line bg-white p-5 lg:col-span-4">
            <div className="text-[15px] font-medium">Spending by department</div>
            <div className="text-[12px] text-af-ink-3">Illustrative sample · not company accounting</div>
            <ul className="mt-4 space-y-3">
              {sampleSpend.map(([name, value], index) => (
                <li key={name}>
                  <div className="flex justify-between text-[12.5px]"><span>{name}</span><span className="font-medium">{value.toLocaleString("en-US")}</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-af-subtle">
                    <div className="h-full rounded-full" style={{ width: `${(value / 7840) * 100}%`, background: ["#246B64", "#5E9A92", "#7FAFA7", "#A9CBC4", "#C9DDD8"][index] }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

function Action({ href, icon: Icon, label, badge }: { href: string; icon: typeof FilePlus2; label: string; badge?: number }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-[12px] border border-af-line bg-white px-4 py-3 hover:border-af-line-strong">
      <Icon className="size-4 text-af-accent" />
      <span className="flex-1 text-[13px] font-medium">{label}</span>
      {badge ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-af-accent px-1.5 text-[11px] text-white">{badge}</span> : <ArrowRight className="size-3.5 text-af-ink-3" />}
    </Link>
  );
}

function Kpi({ icon: Icon, label, value, sub, warn }: { icon: typeof Clock3; label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className="rounded-[14px] border border-af-line bg-white p-4">
      <Icon className={warn ? "size-4 text-amber-600" : "size-4 text-af-accent"} />
      <div className="mt-3 text-[22px] font-medium tracking-[-0.03em]">{value}</div>
      <div className="text-[12.5px] font-medium">{label}</div>
      <div className="text-[11.5px] text-af-ink-3">{sub}</div>
    </div>
  );
}
