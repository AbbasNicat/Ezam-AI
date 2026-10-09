"use client";

import { Check, Circle, LoaderCircle, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agentUiMessages, progressMessages } from "@/lib/agent/i18n";
import type { AgentInterpretation, AgentLanguage } from "@/lib/agent/schemas";
import type { AgentProgressEvent } from "@/lib/agent/progress";

export function AgentPanel({ interpretation, progress, language }: { interpretation: AgentInterpretation | null; progress: AgentProgressEvent[]; language: AgentLanguage }) {
  const ui = agentUiMessages[language];
  if (!interpretation && progress.length === 0) return null;
  return (
    <Card className="overflow-hidden border-af-accent/30 bg-[#f7fbfa]">
      <CardHeader className="border-b border-af-line/70">
        <div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-af-accent" />{ui.extracted}</CardTitle>{interpretation ? <Badge variant="secondary">{interpretation.intent.responseLanguage.toUpperCase()} · {interpretation.source === "openai" ? "OpenAI" : "Fallback"}</Badge> : null}</div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {interpretation ? <div className="grid gap-2 text-xs sm:grid-cols-2">
          <Fact label="Route" value={[interpretation.intent.origin, interpretation.intent.destination].filter(Boolean).join(" → ") || "—"} />
          <Fact label="Dates" value={[interpretation.intent.departureDate, interpretation.intent.returnDate].filter(Boolean).join(" → ") || (interpretation.intent.durationDays ? `${interpretation.intent.durationDays} days` : "—")} />
          <Fact label="Budget" value={interpretation.intent.totalBudget ? `${interpretation.intent.totalBudget} ${interpretation.intent.currency ?? ""}` : "—"} />
          <Fact label="Stay" value={[interpretation.intent.hotelStars ? `${interpretation.intent.hotelStars}-star` : "", interpretation.intent.accommodationType, interpretation.intent.travelStyle].filter(Boolean).join(" · ") || "—"} />
          <Fact label="Location" value={interpretation.intent.locationPreferences.join(", ") || "—"} />
          <Fact label="Restaurants" value={interpretation.intent.restaurantPreferences.join(", ") || "—"} />
        </div> : null}
        {interpretation?.clarificationQuestions.length ? <Notice title={ui.clarifications} items={interpretation.clarificationQuestions} /> : null}
        {interpretation?.warnings.length ? <Notice title={ui.warnings} items={interpretation.warnings} warning /> : null}
        {progress.length ? <div className="space-y-2">{progress.map((event) => { const Icon = event.status === "completed" ? Check : event.status === "running" ? LoaderCircle : Circle; return <div key={event.stageId} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs"><Icon className={`size-3.5 ${event.status === "running" ? "animate-spin text-af-accent" : event.status === "completed" ? "text-af-success" : "text-muted-foreground"}`} /><span className="flex-1">{progressMessages[language][event.stageId]}</span>{event.simulation ? <Badge variant="outline">{ui.simulated}</Badge> : null}</div>; })}</div> : null}
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-af-line bg-white px-3 py-2"><span className="block text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</span><span className="mt-0.5 block font-medium">{value}</span></div>; }
function Notice({ title, items, warning = false }: { title: string; items: string[]; warning?: boolean }) { return <div className={`rounded-lg border px-3 py-2 text-xs ${warning ? "border-amber-200 bg-amber-50" : "border-af-accent/20 bg-white"}`}><p className="flex items-center gap-1.5 font-medium">{warning ? <TriangleAlert className="size-3.5" /> : null}{title}</p>{items.map((item) => <p key={item} className="mt-1 text-muted-foreground">{item}</p>)}</div>; }
