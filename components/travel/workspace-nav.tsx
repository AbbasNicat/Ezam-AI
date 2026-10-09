"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  LayoutDashboard,
  MapPinned,
  PlaneTakeoff,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceProfile } from "@/lib/storage/workspace-profile";

const businessLinks = [
  { href: "/business", label: "Overview", icon: LayoutDashboard },
  { href: "/business/requests", label: "Travel requests", icon: BriefcaseBusiness },
  { href: "/business/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/business/expenses", label: "Expenses", icon: CircleDollarSign },
  { href: "/business/policies", label: "Policies", icon: Settings2 },
];

const personalLinks = [
  { href: "/individual", label: "Overview", icon: LayoutDashboard },
  { href: "/individual/plan", label: "Plan a trip", icon: PlaneTakeoff },
  { href: "/individual/trips", label: "My trips", icon: MapPinned },
];

export function WorkspaceNav({ profile }: { profile: WorkspaceProfile | null }) {
  const pathname = usePathname();
  const personal = pathname.startsWith("/business")
    ? false
    : pathname.startsWith("/individual")
      ? true
      : profile?.kind === "personal";
  const links = personal ? personalLinks : businessLinks;
  const name = personal
    ? profile?.kind === "personal" ? profile.fullName : "Individual traveler"
    : profile?.kind === "business" ? profile.companyName : "Caspian Ventures";
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="border-b border-af-line bg-[#fcfcfb] lg:sticky lg:top-0 lg:h-screen lg:w-[232px] lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em] text-af-ink">
          <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
            <rect width="28" height="28" rx="8" fill="#246B64" />
            <path d="M7.5 20.5c3.2 0 3.6-6.5 6.5-6.5s3.2-6.5 6.5-6.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="7.5" cy="20.5" r="2" fill="#fff" />
            <circle cx="20.5" cy="7.5" r="2.6" fill="none" stroke="#fff" strokeWidth="1.6" />
          </svg>
          AtlasFlow
        </Link>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Demo</span>
      </div>
      <div className="p-3">
        <Link href="/start" className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm transition hover:border-primary/30">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-[11px] font-semibold text-white">{initials || "AF"}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">{name}</span>
            <span className="block truncate text-[10px] text-muted-foreground">{personal ? "Personal workspace" : "Business workspace"}</span>
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Link>
        <nav aria-label="Workspace" className="mt-4 flex gap-1 overflow-x-auto lg:block lg:space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={cn("flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition", active ? "bg-[#e8f4f1] text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <Icon className="size-4" strokeWidth={1.8} />{label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="hidden px-5 pt-5 text-[11px] leading-relaxed text-muted-foreground lg:block">
        Synthetic estimates · no booking or payment is completed in AtlasFlow.
      </div>
    </aside>
  );
}
