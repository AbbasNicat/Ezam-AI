"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { agentUiMessages } from "@/lib/agent/i18n";
import type { AgentLanguage } from "@/lib/agent/schemas";
import type { TripPackage } from "@/types/travel";

const TIER_LABEL = { economy: "Economy", balanced: "Balanced", comfort: "Comfort" } as const;

export function PackageComparison({
  packages,
  selectedId,
  onSelect,
  language = "en",
  onRegenerate,
  regenerating = false,
}: {
  packages: TripPackage[];
  selectedId?: string;
  onSelect: (id: string) => void;
  language?: AgentLanguage;
  onRegenerate?: (pkg: TripPackage) => void;
  regenerating?: boolean;
}) {
  if (packages.length === 0) return null;
  return (
    <div className="package-grid grid gap-3">
      {packages.map((pkg) => {
        const selected = pkg.id === selectedId;
        const cabin = String(pkg.flight.attributes.cabin ?? "").replaceAll("_", " ");
        const neighborhood = pkg.accommodation ? String(pkg.accommodation.attributes.neighborhood ?? "") : "No overnight stay";
        const ui = agentUiMessages[language];
        const explanation = language === "az" ? `${TIER_LABEL[pkg.tier]} paketi ${formatMoney(pkg.corporateTotal, pkg.flight.currency)} korporativ xərc ilə büdcə və siyasət qaydalarına əsasən hesablanıb.` : language === "tr" ? `${TIER_LABEL[pkg.tier]} paketi, ${formatMoney(pkg.corporateTotal, pkg.flight.currency)} kurumsal maliyetle bütçe ve politika kurallarına göre hesaplandı.` : pkg.explanation;
        return (
          <Card key={pkg.id} className={selected ? "rounded-[14px] border-af-accent bg-[#F4F9F7] shadow-af-float ring-[3px] ring-af-accent/10" : "rounded-[14px] border-af-line"}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{TIER_LABEL[pkg.tier]}</CardTitle>
                {pkg.tier === "balanced" ? <Badge>Preferred if feasible</Badge> : <Badge variant="outline">Estimate</Badge>}
              </div>
              <p className="text-2xl font-semibold tracking-tight">{formatMoney(pkg.corporateTotal, pkg.flight.currency)}</p>
              <p className="text-xs text-muted-foreground">Corporate estimate · not a live fare</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Personal leisure {formatMoney(pkg.personalTotal, pkg.flight.currency)}</p>
              <p>Budget remaining {formatMoney(pkg.remainingBudget, pkg.flight.currency)}</p>
              <p className="capitalize">Cabin: {cabin}</p>
              <p>{pkg.accommodation ? `${pkg.accommodation.type} · ${pkg.nights} nights` : "Same-day · no hotel"}</p>
              <p>{pkg.accommodation?.name ?? "—"} · {neighborhood}</p>
              <p>{pkg.flight.name}</p>
              <Badge variant={pkg.policyEvaluation.compliant ? "success" : "danger"}>
                {pkg.policyEvaluation.compliant ? "Policy compliant" : "Policy violation"}
              </Badge>
              {pkg.policyEvaluation.approvalRequired ? <Badge variant="warning">Approval required</Badge> : <Badge variant="secondary">Below approval threshold</Badge>}
              <p className="text-muted-foreground">{explanation}</p>
              <Button className="w-full" variant={selected ? "default" : "outline"} onClick={() => onSelect(pkg.id)}>
                {selected ? ui.selected : ui.select}
              </Button>
              {pkg.accommodation && onRegenerate ? <Button className="w-full" type="button" variant="ghost" disabled={regenerating} onClick={() => onRegenerate(pkg)}>{regenerating ? ui.regenerating : ui.regenerate}</Button> : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
