"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
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
import { AgentPanel } from "@/components/travel/agent-panel";
import { WorkspaceNav } from "@/components/travel/workspace-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoFormValues, emptyFormValues, type RequestFormValues } from "@/lib/data/demo-scenario";
import { demoCatalog } from "@/lib/data/catalog";
import { requestFromForm } from "@/lib/data/request-form";
import { interpretTravelText } from "@/lib/ai/fallback";
import { planTrip, selectedOrFirst } from "@/lib/planning/planner";
import { clearDemo, loadDemo, saveDemo } from "@/lib/storage/local-store";
import { loadWorkspaceProfile, policyForWorkspace, type WorkspaceProfile } from "@/lib/storage/workspace-profile";
import { clearAgentState, loadAgentState, saveAgentState } from "@/lib/storage/agent-state";
import { agentUiMessages } from "@/lib/agent/i18n";
import type { AgentInterpretation, AgentLanguage, RegenerationResult } from "@/lib/agent/schemas";
import type { AgentProgressEvent } from "@/lib/agent/progress";
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
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<DemoRole>("employee");
  const [draft, setDraft] = useState<RequestFormValues>(emptyFormValues);
  const [record, setRecord] = useState<TripRecord | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [mode, setMode] = useState<"basic" | "ai">("basic");
  const [planning, setPlanning] = useState(false);
  const [workspaceProfile, setWorkspaceProfile] = useState<WorkspaceProfile | null>(null);
  const [language, setLanguage] = useState<AgentLanguage>("en");
  const [agentResult, setAgentResult] = useState<AgentInterpretation | null>(null);
  const [progress, setProgress] = useState<AgentProgressEvent[]>([]);
  const [excludedOptionIds, setExcludedOptionIds] = useState<string[]>([]);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const profile = loadWorkspaceProfile();
    const agentState = loadAgentState();
    setLanguage(agentState.language);
    setExcludedOptionIds(agentState.excludedOptionIds);
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

  useEffect(() => {
    if (!ready) return;
    saveAgentState({ language, excludedOptionIds });
  }, [ready, language, excludedOptionIds]);

  useEffect(() => {
    if (!ready) return;
    const section = pathname.endsWith("/approvals") || pathname.endsWith("/expenses") || pathname.endsWith("/policies")
      ? "operations"
      : pathname.endsWith("/requests") || pathname.endsWith("/plan")
        ? "request"
        : pathname.endsWith("/trips")
          ? "plans"
          : null;
    if (section) window.requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [pathname, ready]);

  const selected = record ? selectedOrFirst(record.plan, record.selectedPackageId) : undefined;
  const mapMarkers = useMemo(() => markersFor(selected?.itinerary ?? []), [selected]);

  function loadScenario() {
    setDraft(demoFormValues);
    setNotes([
      "Demo scenario loaded for Caspian Ventures. Review the form, then generate travel plans.",
    ]);
    setMode("basic");
    setAgentResult(null);
    setProgress([]);
    setExcludedOptionIds([]);
    clearAgentState();
    toast.success("Caspian Ventures demo loaded");
  }

  function resetDemo() {
    clearDemo();
    setDraft(emptyFormValues);
    setRecord(null);
    setNotes([]);
    setRole("employee");
    setMode("basic");
    setAgentResult(null);
    setProgress([]);
    setExcludedOptionIds([]);
    clearAgentState();
    toast("Demo reset");
  }

  async function interpret(values: RequestFormValues): Promise<{ values: RequestFormValues; result: AgentInterpretation | null; stages: AgentProgressEvent[] }> {
    setDraft(values);
    if (!values.freeText.trim()) return { values, result: null, stages: [] };
    try {
      const response = await fetch("/api/agent/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: values.freeText, preferredLanguage: language, savedPreferences: values, companyPolicy: workspaceProfile?.kind === "business" ? policyForWorkspace(workspaceProfile) : undefined }),
      });
      if (!response.ok) throw new Error("parse failed");
      const body = (await response.json()) as AgentInterpretation & { progress: AgentProgressEvent[] };
      const parsed = body.plannerInput;
      const next: RequestFormValues = { ...values, origin: parsed.origin || values.origin, destination: parsed.destination || values.destination, departureDate: parsed.departureDate || values.departureDate, returnDate: parsed.returnDate || values.returnDate, travelerCount: parsed.travelerCount ?? values.travelerCount, corporateBudget: parsed.corporateBudget ?? values.corporateBudget, currency: parsed.currency ?? values.currency, purpose: parsed.purpose || values.purpose, cabinPreference: parsed.cabinPreference ?? values.cabinPreference, accommodationPreference: parsed.accommodationPreference ?? values.accommodationPreference, accommodationLevel: parsed.accommodationLevel ?? values.accommodationLevel, interests: parsed.interests?.length ? parsed.interests : values.interests, leisureEnabled: parsed.leisureEnabled ?? values.leisureEnabled, specialRequirements: parsed.specialRequirements ? [values.specialRequirements, parsed.specialRequirements].filter(Boolean).join(". ") : values.specialRequirements };
      setDraft(next); setAgentResult(body); setProgress(body.progress); setMode(body.source === "openai" ? "ai" : "basic");
      setNotes([...new Set([body.response, ...body.clarificationQuestions, ...body.warnings])]);
      toast.success(body.response);
      return { values: next, result: body, stages: body.progress };
    } catch {
      const local = interpretTravelText({ text: values.freeText, context: requestFromForm(values) });
      const parsed = local.parsed;
      const next: RequestFormValues = { ...values, origin: parsed.origin || values.origin, destination: parsed.destination || values.destination, corporateBudget: parsed.corporateBudget ?? values.corporateBudget, currency: parsed.currency ?? values.currency, purpose: parsed.purpose || values.purpose, cabinPreference: parsed.cabinPreference ?? values.cabinPreference, accommodationPreference: parsed.accommodationPreference ?? values.accommodationPreference, interests: parsed.interests?.length ? parsed.interests : values.interests, leisureEnabled: parsed.leisureEnabled ?? values.leisureEnabled };
      setDraft(next); setAgentResult(null); setProgress([]); setMode("basic"); setNotes(parsed.notes);
      toast.success("Basic planning mode");
      return { values: next, result: null, stages: [] };
    }
  }

  async function generate(values: RequestFormValues) {
    setPlanning(true);
    const interpreted = values.freeText.trim() && agentResult?.intent.originalMessage !== values.freeText ? await interpret(values) : { values, result: agentResult, stages: progress };
    const nextValues = interpreted.values;
    setDraft(nextValues);
    const stages = interpreted.stages.map((event) => ({ ...event, status: "pending" as const }));
    setProgress(stages);
    for (let index = 0; index < stages.length; index += 1) {
      setProgress((current) => current.map((event, eventIndex) => ({ ...event, status: eventIndex < index ? "completed" : eventIndex === index ? "running" : "pending" })));
      await new Promise((resolve) => window.setTimeout(resolve, 90));
    }
    const request = requestFromForm(nextValues);
      const plan = planTrip({
        request,
        policy: workspaceProfile ? policyForWorkspace(workspaceProfile) : undefined,
        mode: interpreted.result?.source === "openai" ? "ai" : mode,
        interpretationNotes: notes.length > 0 ? notes : undefined,
      });
      const next = createTripRecord(request, plan, roleLabel(role), nowStamp());
      setRecord(next);
      setProgress((current) => current.map((event) => ({ ...event, status: "completed" })));
      setPlanning(false);
      if (plan.status === "ok") toast.success(agentUiMessages[language].packagesReady);
      else toast.error(plan.status === "NO_FEASIBLE_PLAN" ? "No feasible plan" : "Request needs a correction");
  }

  async function regenerateHotel(pkg: NonNullable<typeof selected>) {
    if (!record || !pkg.accommodation) return;
    setRegenerating(true);
    try {
      const response = await fetch("/api/agent/regenerate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instruction: language === "az" ? "Başqa otel tap." : language === "tr" ? "Başka bir otel bul." : "Find another hotel.", preferredLanguage: language, currentRequest: record.request, selectedPackage: { flightId: pkg.flight.id, hotelId: pkg.accommodation.id }, excludedOptionIds }) });
      if (!response.ok) throw new Error("regeneration failed");
      const result = await response.json() as RegenerationResult;
      setExcludedOptionIds(result.excludedOptionIds);
      if (result.error || result.eligibleHotelIds.length === 0) { toast.error(agentUiMessages[language].noAlternatives); return; }
      const hotelIds = new Set(result.eligibleHotelIds); const flightIds = new Set(result.eligibleFlightIds);
      const catalog = { ...demoCatalog, stays: demoCatalog.stays.filter((stay) => hotelIds.has(stay.id)), flights: flightIds.size ? demoCatalog.flights.filter((flight) => flightIds.has(flight.id)) : demoCatalog.flights };
      const plan = planTrip({ request: record.request, policy: record.plan.policy, catalog, mode: result.source === "openai" ? "ai" : "basic", interpretationNotes: [...record.plan.interpretationNotes, result.response] });
      if (plan.status !== "ok" || plan.packages.length === 0) { toast.error(agentUiMessages[language].noAlternatives); return; }
      const selectedPackageId = plan.packages.find((item) => item.tier === "balanced")?.id ?? plan.packages[0]?.id;
      setRecord({ ...record, plan, selectedPackageId, audit: [...record.audit, { id: `audit-${Date.now()}`, tripId: record.request.id, type: "hotel regenerated", description: `${pkg.accommodation.name} excluded; planner recalculated ${plan.packages.length} package(s).`, timestamp: nowStamp(), actor: roleLabel(role) }], updatedAt: nowStamp() });
      setNotes((current) => [...current, result.response]); toast.success(result.response);
    } catch { toast.error(agentUiMessages[language].noAlternatives); }
    finally { setRegenerating(false); }
  }

  function update(next: TripRecord) {
    setRecord(next);
  }

  const requestRoute = pathname.endsWith("/plan") || pathname.endsWith("/requests") || pathname === "/demo";
  const requestView = requestRoute && !record;
  const approvalsView = pathname.endsWith("/approvals");
  const expensesView = pathname.endsWith("/expenses");
  const title = requestView ? "Where are we taking you?" : approvalsView ? "Approvals" : expensesView ? "Expenses & reports" : "Your travel plan";
  const subtitle = requestView
    ? "Tell EzamAI about your trip. We’ll handle the planning."
    : approvalsView
      ? "Review policy, cost, and the complete decision history."
      : expensesView
        ? "Corporate and personal costs stay clearly separated."
        : "Compare packages, explore the itinerary, and continue to providers.";

  return (
    <div className="min-h-screen bg-canvas text-ink lg:flex">
      <WorkspaceNav profile={workspaceProfile} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-14 max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-2 md:px-8">
            <div className="flex items-center gap-2 text-[12px] text-ink-3"><span>{workspaceProfile?.kind === "business" ? workspaceProfile.companyName : "Personal"}</span><span>/</span><span className="text-ink">{title}</span></div>
            {workspaceProfile?.kind !== "personal" && <div className="flex rounded-[9px] bg-subtle p-1">{ROLES.map(item => <button key={item} onClick={() => setRole(item)} className={`rounded-[7px] px-3 py-1.5 text-[11.5px] transition ${role === item ? "bg-surface font-medium text-ink shadow-sm" : "text-ink-3"}`}>{roleLabel(item)}</button>)}</div>}
          </div>
        </header>
        <main className="trip-main mx-auto max-w-[1180px] px-5 pb-24 pt-10 md:px-8 md:pt-12">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-[28px] font-medium tracking-[-0.035em] md:text-[32px]">{title}</h1><p className="mt-1 text-[14px] text-ink-2">{subtitle}</p></div><Badge variant={mode === "basic" ? "secondary" : "default"}>{mode === "basic" ? "Basic planning mode" : "Runtime model"}</Badge></div>

          {requestView ? <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <Card className="overflow-hidden rounded-[14px] border-line bg-surface shadow-none lg:col-span-8">{ready ? <TravelRequestForm values={draft} planning={planning} onSubmit={generate} onInterpret={interpret} onLoadDemo={loadScenario} onReset={resetDemo} workspaceKind={workspaceProfile?.kind ?? "business"} language={language} onLanguageChange={setLanguage}/> : <div className="p-6 text-sm text-ink-2">Restoring the saved demo…</div>}</Card>
            <aside className="space-y-6 lg:col-span-4">
              <AgentPanel interpretation={agentResult} progress={progress} language={language}/>
              <Card className="rounded-[14px] border-line p-6 shadow-none"><h2 className="text-[15px] font-medium">{workspaceProfile?.kind === "personal" ? "Your travel preferences" : "Your company travel policy"}</h2><p className="mt-1 text-[12px] text-ink-3">Applied to every generated package</p><div className="mt-5"><PolicyResults plan={null} pkg={undefined}/></div></Card>
              {notes.length > 0 && <Card className="rounded-[14px] border-line p-6 shadow-none"><h2 className="text-[15px] font-medium">Structured brief</h2><div className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-ink-2">{notes.map(note=><p key={note}>{note}</p>)}</div></Card>}
            </aside>
          </div> : null}

          {!requestView && !approvalsView && !expensesView && <div className="mt-8 space-y-6">
            {record?.plan.packages.length ? <PackageComparison packages={record.plan.packages} selectedId={record.selectedPackageId} onSelect={id => update(selectPackage(record,id,roleLabel(role),nowStamp()))} language={language} onRegenerate={regenerateHotel} regenerating={regenerating}/> : <EmptyPlan />}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="space-y-6"><ItineraryTimeline stops={selected?.itinerary ?? []}/><Card className="overflow-hidden rounded-[14px] border-line shadow-none"><CardHeader><CardTitle>Trip map</CardTitle><p className="text-[12.5px] text-ink-3">OpenStreetMap itinerary markers · lines are illustrative, not verified routes.</p></CardHeader><CardContent><TravelMap markers={mapMarkers}/></CardContent></Card></div><aside className="space-y-4"><BudgetBreakdown pkg={selected} budget={record?.request.corporateBudget ?? draft.corporateBudget}/>{workspaceProfile?.kind !== "personal" && <PolicyResults plan={record?.plan ?? null} pkg={selected}/>} {record && <BookingHandoff record={record} pkg={selected} onOpen={target=>update(openHandoff(record,target,roleLabel(role),nowStamp()))} onStatus={(target,status)=>update(setHandoffStatus(record,target,status,roleLabel(role),nowStamp()))}/>} {workspaceProfile?.kind !== "personal" && <ApprovalPanel record={record} role={role} onSubmit={()=>record&&update(submitForApproval(record,roleLabel(role),nowStamp()))} onDecide={(status,comment)=>record&&update(decideApproval(record,status,comment,roleLabel(role),nowStamp()))}/>}</aside></div>
          </div>}

          {approvalsView && <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-5"><ApprovalPanel record={record} role={role} onSubmit={()=>record&&update(submitForApproval(record,roleLabel(role),nowStamp()))} onDecide={(status,comment)=>record&&update(decideApproval(record,status,comment,roleLabel(role),nowStamp()))}/><AuditTimeline events={record?.audit ?? []}/></div><aside className="space-y-4"><BudgetBreakdown pkg={selected} budget={record?.request.corporateBudget ?? draft.corporateBudget}/><PolicyResults plan={record?.plan ?? null} pkg={selected}/></aside></div>}
          {expensesView && <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><FinanceReport record={record}/><aside className="space-y-4"><BudgetBreakdown pkg={selected} budget={record?.request.corporateBudget ?? draft.corporateBudget}/><AuditTimeline events={record?.audit ?? []}/></aside></div>}
        </main>
      </div>
    </div>
  );
}

function EmptyPlan() {
  return <Card className="rounded-[14px] border-line p-10 text-center shadow-none"><CardTitle>No travel plan yet</CardTitle><p className="mx-auto mt-2 max-w-lg text-[13px] text-ink-2">Create a request first. EzamAI will show only feasible packages and will return an actionable no-plan result instead of fabricating a compliant option.</p></Card>;
}
