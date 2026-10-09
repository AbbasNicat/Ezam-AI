import type {
  AuditEvent,
  BookingHandoff,
  DemoRole,
  HandoffStatus,
  HandoffTarget,
  TripRecord,
} from "@/types/travel";
import type { PlanResult, TravelRequest } from "@/types/travel";
import { selectedOrFirst } from "@/lib/planning/planner";

const ROLE_LABEL: Record<DemoRole, string> = {
  employee: "Employee",
  travel_manager: "Travel manager",
  finance_manager: "Finance manager",
};

export function roleLabel(role: DemoRole): string {
  return ROLE_LABEL[role];
}

function event(record: TripRecord, type: string, description: string, actor: string, timestamp: string): AuditEvent {
  return {
    id: `${record.request.id}-audit-${record.audit.length + 1}`,
    tripId: record.request.id,
    type,
    description,
    timestamp,
    actor,
  };
}

function withEvent(record: TripRecord, type: string, description: string, actor: string, timestamp: string): TripRecord {
  const next = { ...record, updatedAt: timestamp, audit: [...record.audit] };
  next.audit = [...record.audit, event(next, type, description, actor, timestamp)];
  return next;
}

const emptyHandoff = (): BookingHandoff => ({
  flights: "not_started",
  accommodation: "not_started",
  directions: "not_started",
});

export function createTripRecord(request: TravelRequest, plan: PlanResult, actor: string, timestamp: string): TripRecord {
  const selected = selectedOrFirst(plan);
  const base: TripRecord = {
    request,
    plan,
    selectedPackageId: selected?.id,
    approval: {
      requestId: request.id,
      status: "draft",
      approverRole: "travel_manager",
      comment: "",
    },
    audit: [],
    handoff: selected
      ? { flights: "ready_for_booking", accommodation: "ready_for_booking", directions: "ready_for_booking" }
      : emptyHandoff(),
    updatedAt: timestamp,
  };
  let next = withEvent(base, "request_created", "Travel request created.", actor, timestamp);
  next = withEvent(
    next,
    "plan_generated",
    plan.status === "ok"
      ? `Planner returned ${plan.packages.length} feasible package${plan.packages.length === 1 ? "" : "s"}.`
      : `Planner returned ${plan.status}.`,
    "AtlasFlow planner",
    timestamp,
  );
  next = withEvent(
    next,
    "policy_evaluated",
    plan.packages[0]
      ? `Policy ${plan.policy.companyName} evaluated for the feasible packages.`
      : "Policy evaluated. No compliant package was available.",
    "Policy engine",
    timestamp,
  );
  if (selected) {
    next = withEvent(next, "package_selected", `${selected.tier} package selected.`, actor, timestamp);
  }
  return next;
}

export function selectPackage(record: TripRecord, packageId: string, actor: string, timestamp: string): TripRecord {
  const pkg = record.plan.packages.find((item) => item.id === packageId);
  if (!pkg) return record;
  const cleared = record.approval.status !== "draft";
  let next: TripRecord = {
    ...record,
    selectedPackageId: packageId,
    approval: {
      ...record.approval,
      status: "draft",
      comment: cleared ? "" : record.approval.comment,
      decidedAt: undefined,
    },
    handoff: {
      flights: "ready_for_booking",
      accommodation: "ready_for_booking",
      directions: "ready_for_booking",
    },
    updatedAt: timestamp,
  };
  next = withEvent(next, "package_selected", `${pkg.tier} package selected.`, actor, timestamp);
  if (cleared) {
    next = withEvent(next, "approval_reset", "Approval was cleared because the selected package changed.", actor, timestamp);
  }
  return next;
}

export function openHandoff(record: TripRecord, target: HandoffTarget, actor: string, timestamp: string): TripRecord {
  const current = record.handoff[target];
  const nextStatus: HandoffStatus =
    current === "confirmed_by_user" || current === "booking_confirmation_pending"
      ? current
      : "external_search_opened";
  const next: TripRecord = {
    ...record,
    handoff: { ...record.handoff, [target]: nextStatus },
    updatedAt: timestamp,
  };
  return withEvent(
    next,
    "handoff_opened",
    `${target} search opened with an external provider. AtlasFlow did not book anything.`,
    actor,
    timestamp,
  );
}

export function setHandoffStatus(
  record: TripRecord,
  target: HandoffTarget,
  status: HandoffStatus,
  actor: string,
  timestamp: string,
): TripRecord {
  const next: TripRecord = {
    ...record,
    handoff: { ...record.handoff, [target]: status },
    updatedAt: timestamp,
  };
  return withEvent(next, "handoff_status", `${target} handoff set to ${status.replaceAll("_", " ")} by the user.`, actor, timestamp);
}

export function submitForApproval(record: TripRecord, actor: string, timestamp: string): TripRecord {
  if (!record.selectedPackageId) return record;
  const next: TripRecord = {
    ...record,
    approval: {
      ...record.approval,
      status: "pending",
      comment: "",
      decidedAt: undefined,
    },
    updatedAt: timestamp,
  };
  return withEvent(next, "approval_requested", "Employee submitted the selected package for approval.", actor, timestamp);
}

export function decideApproval(
  record: TripRecord,
  status: "approved" | "rejected" | "changes_requested",
  comment: string,
  actor: string,
  timestamp: string,
): TripRecord {
  const next: TripRecord = {
    ...record,
    approval: {
      ...record.approval,
      status,
      comment,
      approverRole: "travel_manager",
      decidedAt: timestamp,
    },
    updatedAt: timestamp,
  };
  const label = status.replaceAll("_", " ");
  return withEvent(next, "decision_recorded", `Travel manager decision: ${label}. ${comment}`.trim(), actor, timestamp);
}

function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  if (/[",\n]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`;
  return safe;
}

export function buildFinanceCsv(record: TripRecord): string {
  const pkg = record.plan.packages.find((item) => item.id === record.selectedPackageId) ?? record.plan.packages[0];
  const header = [
    "category",
    "payer",
    "label",
    "amount",
    "currency",
    "estimated",
    "package",
    "approval_status",
    "flight_handoff",
    "accommodation_handoff",
    "directions_handoff",
  ];
  const rows = pkg
    ? pkg.costBreakdown.map((line) =>
        [
          line.category,
          line.payer,
          line.label,
          line.amount.toFixed(2),
          line.currency,
          "true",
          pkg.tier,
          record.approval.status,
          record.handoff.flights,
          record.handoff.accommodation,
          record.handoff.directions,
        ]
          .map(csvCell)
          .join(","),
      )
    : [];
  const summary = pkg
    ? [
        ["corporate_total", "corporate", "Corporate estimated total", pkg.corporateTotal.toFixed(2), pkg.flight.currency, "true", pkg.tier, record.approval.status, record.handoff.flights, record.handoff.accommodation, record.handoff.directions].map(csvCell).join(","),
        ["personal_total", "personal", "Personal estimated total", pkg.personalTotal.toFixed(2), pkg.flight.currency, "true", pkg.tier, record.approval.status, record.handoff.flights, record.handoff.accommodation, record.handoff.directions].map(csvCell).join(","),
        ["remaining_budget", "corporate", "Corporate budget remaining", pkg.remainingBudget.toFixed(2), pkg.flight.currency, "true", pkg.tier, record.approval.status, record.handoff.flights, record.handoff.accommodation, record.handoff.directions].map(csvCell).join(","),
      ]
    : [];
  return [header.join(","), ...rows, ...summary].join("\n");
}
