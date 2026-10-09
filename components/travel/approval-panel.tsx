"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { DemoRole, TripRecord } from "@/types/travel";

export function ApprovalPanel({
  record,
  role,
  onSubmit,
  onDecide,
}: {
  record: TripRecord | null;
  role: DemoRole;
  onSubmit: () => void;
  onDecide: (status: "approved" | "rejected" | "changes_requested", comment: string) => void;
}) {
  const [comment, setComment] = useState("Approved for the client meeting. Estimates stay inside the corporate brief.");
  if (!record) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demo approval workflow</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Submit a selected package to start the simulated approval.</CardContent>
      </Card>
    );
  }
  const status = record.approval.status;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo approval workflow</CardTitle>
        <p className="text-sm text-muted-foreground">Simulated roles. This is not production authentication.</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Badge variant={status === "approved" ? "success" : status === "rejected" ? "danger" : status === "pending" ? "warning" : "secondary"}>
          {status.replaceAll("_", " ")}
        </Badge>
        {role === "employee" && status !== "pending" && status !== "approved" ? (
          <Button type="button" onClick={onSubmit} disabled={!record.selectedPackageId}>Submit for approval</Button>
        ) : null}
        {role === "employee" && status === "pending" ? <p>Waiting for the travel manager demo role.</p> : null}
        {role === "travel_manager" && status === "pending" ? (
          <div className="space-y-2">
            <Textarea value={comment} onChange={(event) => setComment(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => onDecide("approved", comment)}>Approve</Button>
              <Button type="button" variant="outline" onClick={() => onDecide("changes_requested", comment || "Please adjust the package.")}>Request changes</Button>
              <Button type="button" variant="destructive" onClick={() => onDecide("rejected", comment || "Rejected.")}>Reject</Button>
            </div>
          </div>
        ) : null}
        {role === "travel_manager" && status !== "pending" ? (
          <p>Switch back to the employee role to submit, or wait until a package is pending.</p>
        ) : null}
        {role === "finance_manager" ? <p>Finance can export the current estimate. Approval status is included in the CSV.</p> : null}
        {record.approval.comment ? <p>Comment: {record.approval.comment}</p> : null}
      </CardContent>
    </Card>
  );
}
