"use client";

import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { demoFormValues, emptyFormValues, type RequestFormValues } from "@/lib/data/demo-scenario";
import { INTEREST_OPTIONS, requestFormSchema } from "@/lib/data/request-form";
import { agentUiMessages } from "@/lib/agent/i18n";
import type { AgentLanguage } from "@/lib/agent/schemas";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TravelRequestForm({
  values,
  planning,
  onSubmit,
  onInterpret,
  onLoadDemo,
  onReset,
  workspaceKind = "business",
  language,
  onLanguageChange,
}: {
  values: RequestFormValues;
  planning: boolean;
  onSubmit: (values: RequestFormValues) => void;
  onInterpret: (values: RequestFormValues) => void;
  onLoadDemo: () => void;
  onReset: () => void;
  workspaceKind?: "personal" | "business";
  language: AgentLanguage;
  onLanguageChange: (language: AgentLanguage) => void;
}) {
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: values,
    values,
  });
  const interests = form.watch("interests");
  const ui = agentUiMessages[language];

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onLoadDemo}>
          {workspaceKind === "personal" ? "Load Istanbul demo" : "Load Caspian Ventures demo"}
        </Button>
        <Button type="button" variant="ghost" onClick={onReset}>
          Reset demo
        </Button>
        <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          Language
          <select aria-label="Preferred language" className="h-9 rounded-md border border-input bg-card px-2 text-xs text-foreground" value={language} onChange={(event) => onLanguageChange(event.target.value as AgentLanguage)}>
            <option value="az">AZ</option><option value="tr">TR</option><option value="en">EN</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={workspaceKind === "personal" ? "Traveler" : "Employee"} error={form.formState.errors.employeeName?.message}>
          <Input {...form.register("employeeName")} placeholder="Aylin M." />
        </Field>
        <Field label={workspaceKind === "personal" ? "Workspace" : "Company"} error={form.formState.errors.companyName?.message}>
          <Input {...form.register("companyName")} />
        </Field>
        <Field label="Origin" error={form.formState.errors.origin?.message}>
          <Input {...form.register("origin")} />
        </Field>
        <Field label="Destination" error={form.formState.errors.destination?.message}>
          <Input {...form.register("destination")} />
        </Field>
        <Field label="Departure" error={form.formState.errors.departureDate?.message}>
          <Input type="date" {...form.register("departureDate")} />
        </Field>
        <Field label="Return" error={form.formState.errors.returnDate?.message}>
          <Input type="date" {...form.register("returnDate")} />
        </Field>
        <Field label="Travelers" error={form.formState.errors.travelerCount?.message}>
          <Input type="number" min={1} max={8} {...form.register("travelerCount", { valueAsNumber: true })} />
        </Field>
        <Field label="Currency">
          <select className={selectClass} {...form.register("currency")}>
            {["AZN", "USD", "EUR", "TRY", "GEL", "AED"].map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </Field>
        <Field label={workspaceKind === "personal" ? "Travel budget" : "Corporate budget"} error={form.formState.errors.corporateBudget?.message}>
          <Input type="number" min={0} step="1" {...form.register("corporateBudget", { valueAsNumber: true })} />
        </Field>
        <Field label="Personal leisure budget">
          <Input type="number" min={0} step="1" {...form.register("personalLeisureBudget", { valueAsNumber: true })} />
        </Field>
      </div>
      <Field label="Purpose" error={form.formState.errors.purpose?.message}>
        <Input {...form.register("purpose")} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Cabin">
          <select className={selectClass} {...form.register("cabinPreference")}>
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </Field>
        <Field label="Stay type">
          <select className={selectClass} {...form.register("accommodationPreference")}>
            <option value="either">Hotel or apartment</option>
            <option value="hotel">Hotel</option>
            <option value="apartment">Apartment</option>
          </select>
        </Field>
        <Field label="Stay level">
          <select className={selectClass} {...form.register("accommodationLevel")}>
            <option value="budget">Budget</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </Field>
        <Field label="Meeting date">
          <Input type="date" {...form.register("meetingDate")} />
        </Field>
        <Field label="Meeting start">
          <Input type="time" {...form.register("meetingStart")} />
        </Field>
        <Field label="Meeting end">
          <Input type="time" {...form.register("meetingEnd")} />
        </Field>
      </div>
      <Field label="Meeting title">
        <Input {...form.register("meetingTitle")} placeholder="Client meeting" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("leisureEnabled")} />
        Add personal leisure outside meeting hours
      </label>
      <div>
        <Label>Interests</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const active = interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs capitalize ${active ? "border-primary bg-accent" : "border-border bg-card"}`}
                onClick={() => {
                  const next = active ? interests.filter((item) => item !== interest) : [...interests, interest];
                  form.setValue("interests", next, { shouldDirty: true });
                }}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>
      <Field label="Special requirements">
        <Textarea {...form.register("specialRequirements")} />
      </Field>
      <Field label="Free-text request">
        <Textarea {...form.register("freeText")} placeholder={demoFormValues.freeText} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => onInterpret(form.getValues())}>
          {ui.interpret}
        </Button>
        <Button type="submit" disabled={planning}>
          {planning ? ui.planning : ui.generate}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => form.reset(emptyFormValues)}
        >
          Clear form
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
