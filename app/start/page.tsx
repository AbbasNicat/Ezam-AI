import { Suspense } from "react";
import { OnboardingFlow } from "@/components/travel/onboarding-flow";

export default function StartPage() {
  return <Suspense fallback={<div className="min-h-screen p-8 text-sm text-muted-foreground">Preparing your workspace…</div>}><OnboardingFlow /></Suspense>;
}
