"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildFinanceCsv } from "@/lib/workflow/trip-state";
import { formatMoney } from "@/lib/utils";
import type { TripRecord } from "@/types/travel";

export function FinanceReport({ record }: { record: TripRecord | null }) {
  const pkg = record?.plan.packages.find((item) => item.id === record.selectedPackageId) ?? record?.plan.packages[0];
  function download() {
    if (!record) return;
    const csv = buildFinanceCsv(record);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${record.request.id}-finance-estimate.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Finance report</CardTitle>
        <p className="text-sm text-muted-foreground">Estimated costs only. Nothing here is a posted expense.</p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {pkg && record ? (
          <>
            <p>Corporate {formatMoney(pkg.corporateTotal, pkg.flight.currency)}</p>
            <p>Personal {formatMoney(pkg.personalTotal, pkg.flight.currency)}</p>
            <p>Remaining {formatMoney(pkg.remainingBudget, pkg.flight.currency)}</p>
            <p className="capitalize">Approval: {record.approval.status.replaceAll("_", " ")}</p>
            <Button type="button" variant="outline" onClick={download}>Download CSV</Button>
          </>
        ) : (
          <p className="text-muted-foreground">Generate a plan to export a finance CSV.</p>
        )}
      </CardContent>
    </Card>
  );
}
