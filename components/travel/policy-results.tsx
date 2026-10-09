import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanResult, TripPackage } from "@/types/travel";

export function PolicyResults({ plan, pkg }: { plan: PlanResult | null; pkg?: TripPackage }) {
  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Policy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Caspian Ventures rules are applied when you generate a plan. Hard violations are never hidden inside a package.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy · {plan.policy.companyName}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cabins {plan.policy.allowedCabins.join(", ").replaceAll("_", " ")}. Nightly cap {plan.policy.maxHotelNightly} {plan.policy.currency}. Leisure reimbursable: {plan.policy.leisureReimbursable ? "yes" : "no"}.
        </p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {plan.status === "NO_FEASIBLE_PLAN" ? <Badge variant="danger">NO_FEASIBLE_PLAN</Badge> : null}
        {plan.status === "INVALID_REQUEST" ? <Badge variant="danger">Invalid request</Badge> : null}
        {pkg?.policyEvaluation.compliant ? <Badge variant="success">Selected package is compliant</Badge> : null}
        {plan.reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
        {plan.suggestedFixes.map((fix) => (
          <p key={fix} className="rounded-md bg-amber-50 px-3 py-2 text-amber-950">{fix}</p>
        ))}
        {pkg?.policyEvaluation.warnings.map((warning) => (
          <p key={warning.code} className="rounded-md bg-secondary px-3 py-2">{warning.message}</p>
        ))}
        {pkg?.policyEvaluation.explanations.slice(0, 2).map((line) => (
          <p key={line} className="text-muted-foreground">{line}</p>
        ))}
      </CardContent>
    </Card>
  );
}
