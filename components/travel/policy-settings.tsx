"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceNav } from "@/components/travel/workspace-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadWorkspaceProfile, saveWorkspaceProfile, type WorkspaceProfile } from "@/lib/storage/workspace-profile";
import type { CabinClass } from "@/types/travel";

const cabins: CabinClass[] = ["economy", "premium_economy", "business"];

export function PolicySettings() {
  const [profile, setProfile] = useState<WorkspaceProfile | null | undefined>(undefined);
  useEffect(() => setProfile(loadWorkspaceProfile()), []);

  if (profile === undefined) return <div className="p-8 text-sm text-muted-foreground">Restoring workspace settings…</div>;
  if (profile === null) return <div className="p-8"><Link className="text-primary underline" href="/start?mode=business">Create a business workspace to configure policy.</Link></div>;
  if (profile.kind !== "business") return <div className="p-8"><Link className="text-primary underline" href="/start?mode=business">Create a business workspace to configure policy.</Link></div>;

  function save(form: FormData) {
    if (!profile || profile.kind !== "business") return;
    const allowedCabins = form.getAll("allowedCabins") as CabinClass[];
    const next: WorkspaceProfile = {
      ...profile,
      tripBudgetLimit: Number(form.get("tripBudgetLimit")),
      hotelNightlyLimit: Number(form.get("hotelNightlyLimit")),
      approvalThreshold: Number(form.get("approvalThreshold")),
      allowedCabins: allowedCabins.length ? allowedCabins : ["economy"],
    };
    saveWorkspaceProfile(next);
    setProfile(next);
    toast.success("Travel policy saved. New plans will use these limits.");
  }

  return (
    <div className="min-h-screen bg-af-canvas text-af-ink lg:flex">
      <WorkspaceNav profile={profile} />
      <main className="min-w-0 flex-1">
        <header className="border-b border-border bg-white px-5 py-5 sm:px-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary">Company settings</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Travel policy</h1>
          <p className="mt-1 text-sm text-muted-foreground">These rules are persisted in this browser and passed directly into the AtlasFlow planner.</p>
        </header>
        <div className="mx-auto grid max-w-5xl gap-5 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Card>
            <CardHeader><CardTitle>Budget and booking limits</CardTitle></CardHeader>
            <CardContent>
              <form action={save} className="grid gap-5 sm:grid-cols-2">
                <Field label={`Maximum trip budget (${profile.currency})`}><Input name="tripBudgetLimit" type="number" min="100" required defaultValue={profile.tripBudgetLimit} /></Field>
                <Field label={`Hotel nightly limit (${profile.currency})`}><Input name="hotelNightlyLimit" type="number" min="1" required defaultValue={profile.hotelNightlyLimit} /></Field>
                <Field label={`Approval required above (${profile.currency})`}><Input name="approvalThreshold" type="number" min="0" required defaultValue={profile.approvalThreshold} /></Field>
                <fieldset>
                  <legend className="text-sm font-medium">Allowed flight cabins</legend>
                  <div className="mt-3 space-y-2">
                    {cabins.map((cabin) => <label key={cabin} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" name="allowedCabins" value={cabin} defaultChecked={profile.allowedCabins.includes(cabin)} className="size-4 accent-[#246b64]" />{cabin.replaceAll("_", " ")}</label>)}
                  </div>
                </fieldset>
                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                  <p className="text-xs text-muted-foreground">Personal leisure remains non-reimbursable in this MVP policy.</p>
                  <Button type="submit">Save policy</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card className="h-fit bg-[#f1f8f6]">
            <CardHeader><ShieldCheck className="size-5 text-primary" /><CardTitle>Connected policy</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {["Package feasibility", "Cabin validation", "Hotel nightly cap", "Approval threshold"].map((item) => <p key={item} className="flex items-center gap-2"><Check className="size-4 text-primary" />{item}</p>)}
              <Button asChild variant="outline" className="mt-2 w-full"><Link href="/business/requests">Plan with this policy</Link></Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><Label>{label}</Label>{children}</label>;
}
