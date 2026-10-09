"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/utils";
import type { TripPackage } from "@/types/travel";

export function BudgetBreakdown({
  pkg,
  budget,
}: {
  pkg?: TripPackage;
  budget: number;
}) {
  if (!pkg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Corporate and personal totals appear after a feasible plan is selected.
        </CardContent>
      </Card>
    );
  }
  const currency = pkg.flight.currency;
  const used = budget <= 0 ? 0 : Math.min(100, (pkg.corporateTotal / budget) * 100);
  const data = [
    { name: "Corporate", amount: pkg.corporateTotal },
    { name: "Personal", amount: pkg.personalTotal },
    { name: "Remaining", amount: Math.max(0, pkg.remainingBudget) },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget split</CardTitle>
        <p className="text-sm text-muted-foreground">Estimates. Personal leisure is separate from reimbursement.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>Corporate budget used</span>
            <span>{formatMoney(pkg.corporateTotal, currency)} / {formatMoney(budget, currency)}</span>
          </div>
          <Progress value={used} />
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid vertical={false} stroke="#d7e1ec" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={48} />
              <Tooltip formatter={(value) => formatMoney(Number(value ?? 0), currency)} />
              <Bar dataKey="amount" fill="#0f766e" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-1 text-sm">
          {pkg.costBreakdown.map((line) => (
            <li key={line.id} className="flex justify-between gap-3">
              <span>
                {line.label}{" "}
                <span className="text-muted-foreground">({line.payer})</span>
              </span>
              <span>{formatMoney(line.amount, line.currency)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
