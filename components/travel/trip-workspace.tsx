"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AuditTimeline } from "@/components/travel/audit-timeline";
import { ApprovalPanel } from "@/components/travel/approval-panel";
import { BookingHandoff } from "@/components/travel/booking-handoff";
import { BudgetBreakdown } from "@/components/travel/budget-breakdown";
import { FinanceReport } from "@/components/travel/finance-report";
import { ItineraryTimeline } from "@/components/travel/itinerary-timeline";
import { PackageComparison } from "@/components/travel/package-comparison";
import { PolicyResults } from "@/components/travel/policy-results";
import { TravelMap, type MapMarker } from "@/components/travel/travel-map";
import { TravelRequestForm } from "@/components/travel/travel-request-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoFormValues, emptyFormValues, type RequestFormValues } from "@/lib/data/demo-scenario";
import { requestFromForm } from "@/lib/data/request-form";
import { interpretTravelText } from "@/lib/ai/fallback";
import { planTrip, selectedOrFirst } from "@/lib/planning/planner";
import { clearDemo, loadDemo, saveDemo } from "@/lib/storage/local-store";
import { loadWorkspaceProfile, policyForWorkspace, type WorkspaceProfile } from "@/lib/storage/workspace-profile";
import {
  createTripRecord,
  decideApproval,
  openHandoff,
  roleLabel,
  selectPackage,
  setHandoffStatus,
  submitForApproval,
} from "@/lib/workflow/trip-state";
import type { DemoRole, ItineraryStop, TripRecord } from "@/types/travel";

const ROLES: DemoRole[] = ["employee", "travel_manager", "finance_manager"];

function nowStamp(): string {
  return new Date().toISOString();
}

function markersFor(stops: ItineraryStop[]): MapMarker[] {
  const style: Record<string, { color: string; glyph: string; category: string }> = {
    flight: { color: "#0f766e", glyph: "AR", category: "Airport" },
    hotel: { color: "#1d4ed8", glyph: "HT", category: "Hotel" },
    meeting: { color: "#b45309", glyph: "MT", category: "Meeting" },
    attraction: { color: "#7c3aed", glyph: "AT", category: "Attraction" },
  };
  return stops.flatMap((stop) => {
    if (!stop.location) return [];
    const look = style[stop.category] ?? { color: "#475569", glyph: "•", category: stop.category };
    return [
      {
        id: stop.id,
        lat: stop.location.lat,
        lng: stop.location.lng,
        name: stop.title,
        category: look.category,
        glyph: look.glyph,
        color: look.color,
        schedule: `${stop.day} ${stop.startTime}–${stop.endTime}`,
        estimatedCost:
          stop.estimatedCost !== undefined
            ? `Estimated ${stop.estimatedCost} ${stop.currency ?? "AZN"}`
            : undefined,
      },
    ];
  });
}

export function TripWorkspace() {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<DemoRole>("employee");
  const [draft, setDraft] = useState<RequestFormValues>(emptyFormValues);
  const [record, setRecord] = useState<TripRecord | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [mode, setMode] = useState<"basic" | "ai">("basic");
  const [planning, setPlanning] = useState(false);
  const [workspaceProfile, setWorkspaceProfile] = useState<WorkspaceProfile | null>(null);

  useEffect(() => {
    const profile = loadWorkspaceProfile();
    setWorkspaceProfile(profile);
    const saved = loadDemo();
    if (saved) {
      setRole(saved.role);
      setDraft(saved.draft);
      setRecord(saved.record);
      setNotes(saved.interpretationNotes);
    } else if (profile?.kind === "personal") {
      setDraft({
        ...emptyFormValues,
        employeeName: profile.fullName,
        companyName: "Personal workspace",
        origin: profile.homeCity,
        corporateBudget: profile.travelBudget,
        currency: profile.currency,
        purpose: "Personal trip",
        accommodationPreference: profile.accommodationPreference,
        accommodationLevel: profile.travelStyle === "value" ? "budget" : profile.travelStyle === "comfort" ? "premium" : "standard",
        leisureEnabled: true,
        personalLeisureBudget: Math.round(profile.travelBudget * 0.2),
        interests: profile.interests,
      });
    } else if (profile?.kind === "business") {
      setDraft({
        ...emptyFormValues,
        companyName: profile.companyName,
        currency: profile.currency,
        corporateBudget: Math.min(1800, profile.tripBudgetLimit),
      });
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveDemo({ role, draft, record, interpretationNotes: notes });
  }, [ready, role, draft, record, notes]);

  const selected = record ? selectedOrFirst(record.plan, record.selectedPackageId) : undefined;
  const mapMarkers = useMemo(() => markersFor(selected?.itinerary ?? []), [selected]);

  function loadScenario() {
    setDraft(demoFormValues);
    setNotes([
      "Demo scenario loaded for Caspian Ventures. Review the form, then generate travel plans.",
    ]);
    setMode("basic");
    toast.success("Caspian Ventures demo loaded");
  }

  function resetDemo() {
    clearDemo();
    setDraft(emptyFormValues);
    setRecord(null);
    setNotes([]);
    setRole("employee");
    setMode("basic");
    toast("Demo reset");
  }

  async function interpret(values: RequestFormValues) {
    setDraft(values);
    try {
      const response = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: values.freeText, context: values }),
      });
      if (!response.ok) throw new Error("parse failed");
      const body = (await response.json()) as {
        mode: "basic" | "ai";
        parsed: {
          origin?: string;
          destination?: string;
          corporateBudget?: number;
          currency?: RequestFormValues["currency"];
          purpose?: string;
          cabinPreference?: RequestFormValues["cabinPreference"];
          accommodationPreference?: RequestFormValues["accommodationPreference"];
          interests?: string[];
          quietStay?: boolean;
          leisureEnabled?: boolean;
          missingInformation?: string[];
          notes?: string[];
        };
      };
      applyInterpretation(values, body.parsed, body.mode, body.parsed.notes ?? [], body.parsed.missingInformation ?? []);
    } catch {
      const local = interpretTravelText({ text: values.freeText, context: requestFromForm(values) });
      applyInterpretation(values, local.parsed, "basic", local.parsed.notes, local.parsed.missingInformation);
    }
  }

  function applyInterpretation(
    values: RequestFormValues,
    parsed: {
      origin?: string;
      destination?: string;
      corporateBudget?: number;
      currency?: RequestFormValues["currency"];
      purpose?: string;
      cabinPreference?: RequestFormValues["cabinPreference"];
      accommodationPreference?: RequestFormValues["accommodationPreference"];
      interests?: string[];
      quietStay?: boolean;
      leisureEnabled?: boolean;
    },
    nextMode: "basic" | "ai",
    parsedNotes: string[],
    missing: string[],
  ) {
    const next: RequestFormValues = {
      ...values,
      origin: parsed.origin || values.origin,
      destination: parsed.destination || values.destination,
      corporateBudget: parsed.corporateBudget ?? values.corporateBudget,
      currency: parsed.currency ?? values.currency,
      purpose: parsed.purpose || values.purpose,
      cabinPreference: parsed.cabinPreference ?? values.cabinPreference,
      accommodationPreference: parsed.accommodationPreference ?? values.accommodationPreference,
      interests: parsed.interests && parsed.interests.length > 0 ? parsed.interests : values.interests,
      leisureEnabled: parsed.leisureEnabled ?? values.leisureEnabled,
      specialRequirements: parsed.quietStay
        ? values.specialRequirements.includes("Quiet")
          ? values.specialRequirements
          : `${values.specialRequirements} Quiet hotel.`.trim()
        : values.specialRequirements,
    };
    setDraft(next);
    setMode(nextMode);
    setNotes([
      ...(nextMode === "basic" ? ["Basic planning mode. No runtime model key is configured."] : ["Model interpretation applied."]),
      ...parsedNotes,
      ...(missing.length ? [`Still missing: ${missing.join(", ")}.`] : []),
    ]);
    toast.success(nextMode === "basic" ? "Interpreted in basic planning mode" : "Interpreted with the runtime model");
  }

  function generate(values: RequestFormValues) {
    setPlanning(true);
    setDraft(values);
    window.setTimeout(() => {
      const request = requestFromForm(values);
      const plan = planTrip({
        request,
        policy: workspaceProfile ? policyForWorkspace(workspaceProfile) : undefined,
        mode,
        interpretationNotes: notes.length > 0 ? notes : undefined,
      });
      const next = createTripRecord(request, plan, roleLabel(role), nowStamp());
      setRecord(next);
      setPlanning(false);
      if (plan.status === "ok") toast.success(`${plan.packages.length} feasible package${plan.packages.length === 1 ? "" : "s"} ready`);
      else toast.error(plan.status === "NO_FEASIBLE_PLAN" ? "No feasible plan" : "Request needs a correction");
    }, 200);
  }

  function update(next: TripRecord) {
    setRecord(next);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <Link href="/" className="text-sm font-semibold text-primary">AtlasFlow AI</Link>
            <p className="text-xs text-muted-foreground">{workspaceProfile?.kind === "personal" ? "Personal planning workspace" : "Business demo simulation — not production authentication"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {workspaceProfile ? <Badge variant="secondary">{workspaceProfile.kind === "personal" ? "Individual" : workspaceProfile.companyName}</Badge> : null}
            {workspaceProfile?.kind !== "personal" ? (
              <>
            {ROLES.map((item) => (
              <Button key={item} type="button" size="sm" variant={role === item ? "default" : "outline"} onClick={() => setRole(item)}>
                {roleLabel(item)}
              </Button>
            ))}
              </>
            ) : null}
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] gap-4 px-4 py-4 lg:grid-cols-[340px_minmax(0,1fr)_320px]">
        <aside className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Travel request</CardTitle>
              <p className="text-sm text-muted-foreground">Baku → Istanbul is one click. Edit anything before planning.</p>
            </CardHeader>
            <CardContent>
              {ready ? (
                <TravelRequestForm
                  values={draft}
                  planning={planning}
                  onSubmit={generate}
                  onInterpret={interpret}
                  onLoadDemo={loadScenario}
                  onReset={resetDemo}
                  workspaceKind={workspaceProfile?.kind ?? "business"}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Restoring the saved demo…</p>
              )}
            </CardContent>
          </Card>
        </aside>
        <main className="trip-main min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {["Request", "Analyze", "Packages", "Itinerary", "Approve", "Report"].map((step, index) => (
              <span key={step} className="rounded-full bg-card px-3 py-1 ring-1 ring-border">
                {index + 1}. {step}
              </span>
            ))}
            <Badge variant={mode === "basic" ? "secondary" : "default"}>
              {mode === "basic" ? "Basic planning mode" : "Runtime model"}
            </Badge>
          </div>
          {notes.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Structured brief</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {!record ? (
            <Card>
              <CardHeader>
                <CardTitle>No plan yet</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {workspaceProfile?.kind === "personal"
                  ? "Review your saved preferences or load the Istanbul scenario, then generate three travel packages. AtlasFlow reports when no feasible plan fits the budget."
                  : "Load the Caspian Ventures scenario and choose Generate Travel Plans. If nothing fits policy, AtlasFlow returns NO_FEASIBLE_PLAN and a fix instead of a fake compliant package."}
              </CardContent>
            </Card>
          ) : null}
          {record && record.plan.packages.length > 0 ? (
            <PackageComparison
              packages={record.plan.packages}
              selectedId={record.selectedPackageId}
              onSelect={(id) => update(selectPackage(record, id, roleLabel(role), nowStamp()))}
            />
          ) : null}
          <ItineraryTimeline stops={selected?.itinerary ?? []} />
          <Card>
            <CardHeader>
              <CardTitle>Map</CardTitle>
              <p className="text-sm text-muted-foreground">
                OpenStreetMap markers for this itinerary. Connecting stops is not a measured driving route.
              </p>
            </CardHeader>
            <CardContent>
              <TravelMap markers={mapMarkers} />
            </CardContent>
          </Card>
        </main>
        <aside className="space-y-3">
          <BudgetBreakdown pkg={selected} budget={record?.request.corporateBudget ?? draft.corporateBudget} />
          {workspaceProfile?.kind !== "personal" ? <PolicyResults plan={record?.plan ?? null} pkg={selected} /> : null}
          {record ? (
            <BookingHandoff
              record={record}
              pkg={selected}
              onOpen={(target) => update(openHandoff(record, target, roleLabel(role), nowStamp()))}
              onStatus={(target, status) => update(setHandoffStatus(record, target, status, roleLabel(role), nowStamp()))}
            />
          ) : null}
          {workspaceProfile?.kind !== "personal" ? (
            <>
              <ApprovalPanel
                record={record}
                role={role}
                onSubmit={() => record && update(submitForApproval(record, roleLabel(role), nowStamp()))}
                onDecide={(status, comment) => record && update(decideApproval(record, status, comment, roleLabel(role), nowStamp()))}
              />
              <FinanceReport record={record} />
              <AuditTimeline events={record?.audit ?? []} />
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
