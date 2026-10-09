"use client";

import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CalendarDays, CircleDot, MapPin, MessageSquareText, Minus, Plane, Plus, RotateCcw, Sparkles, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { demoFormValues, type RequestFormValues } from "@/lib/data/demo-scenario";
import { INTEREST_OPTIONS, requestFormSchema } from "@/lib/data/request-form";

const input = "h-11 w-full rounded-[10px] border border-line bg-surface px-3.5 text-[14px] text-ink outline-none transition hover:border-line-strong focus:border-primary/60 focus:ring-4 focus:ring-primary/10 placeholder:text-ink-3";

export function TravelRequestForm({ values, planning, onSubmit, onInterpret, onLoadDemo, onReset, workspaceKind = "business" }: {
  values: RequestFormValues; planning: boolean; onSubmit: (values: RequestFormValues) => void; onInterpret: (values: RequestFormValues) => void; onLoadDemo: () => void; onReset: () => void; workspaceKind?: "personal" | "business";
}) {
  const form = useForm<RequestFormValues>({ resolver: zodResolver(requestFormSchema), defaultValues: values, values });
  const interests = form.watch("interests");
  const travelers = form.watch("travelerCount");
  const stay = form.watch("accommodationPreference");
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Section n={1} title="Your journey" hint="Where and when">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From" icon={<CircleDot className="size-4" />} error={form.formState.errors.origin?.message}><input className={cn(input,"pl-9")} {...form.register("origin")} placeholder="City of departure" /></Field>
          <Field label="To" icon={<MapPin className="size-4" />} error={form.formState.errors.destination?.message}><input className={cn(input,"pl-9")} {...form.register("destination")} placeholder="Destination city" /></Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Departure" icon={<CalendarDays className="size-4" />} error={form.formState.errors.departureDate?.message}><input type="date" className={cn(input,"pl-9")} {...form.register("departureDate")} /></Field>
          <Field label="Return" icon={<CalendarDays className="size-4" />} error={form.formState.errors.returnDate?.message}><input type="date" className={cn(input,"pl-9")} {...form.register("returnDate")} /></Field>
          <Field label="Travelers" icon={<Users className="size-4" />} error={form.formState.errors.travelerCount?.message}><div className="flex h-11 items-center justify-between rounded-[10px] border border-line bg-surface pl-9 pr-1.5"><span className="text-[14px] tabular">{travelers} {travelers === 1 ? "traveler" : "travelers"}</span><div className="flex gap-1"><Step onClick={() => form.setValue("travelerCount", Math.max(1,travelers-1))} disabled={travelers<=1}><Minus className="size-3" /></Step><Step onClick={() => form.setValue("travelerCount",Math.min(8,travelers+1))}><Plus className="size-3" /></Step></div></div></Field>
        </div>
      </Section>
      <Section n={2} title={workspaceKind === "business" ? "Business details" : "Trip details"} hint="Budget and commitments">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={workspaceKind === "business" ? "Employee" : "Traveler"}><input className={input} {...form.register("employeeName")} /></Field>
          <Field label={workspaceKind === "business" ? "Company" : "Workspace"}><input className={input} {...form.register("companyName")} /></Field>
          <Field label="Travel purpose" className="sm:col-span-2"><input className={input} {...form.register("purpose")} /></Field>
          <Field label={workspaceKind === "business" ? "Company budget" : "Trip budget"} icon={<Wallet className="size-4" />} error={form.formState.errors.corporateBudget?.message}><input type="number" min={0} className={cn(input,"pl-9 pr-16 tabular")} {...form.register("corporateBudget",{valueAsNumber:true})}/><Suffix>{form.watch("currency")}</Suffix></Field>
          <Field label="Currency"><select className={input} {...form.register("currency")}>{["AZN","USD","EUR","TRY","GEL","AED"].map(x=><option key={x}>{x}</option>)}</select></Field>
          <Field label="Flight class" icon={<Plane className="size-4" />}><select className={cn(input,"pl-9")} {...form.register("cabinPreference")}><option value="economy">Economy</option><option value="premium_economy">Premium economy</option><option value="business">Business</option><option value="first">First</option></select></Field>
          <Field label="Meeting date" icon={<CalendarDays className="size-4" />}><input type="date" className={cn(input,"pl-9")} {...form.register("meetingDate")} /></Field>
          <Field label="Meeting start"><input type="time" className={input} {...form.register("meetingStart")} /></Field><Field label="Meeting end"><input type="time" className={input} {...form.register("meetingEnd")} /></Field>
          <Field label="Meeting title" className="sm:col-span-2"><input className={input} {...form.register("meetingTitle")} placeholder="Client meeting" /></Field>
        </div>
      </Section>
      <Section n={3} title="Your preferences" hint="How you like to travel">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><Label>Accommodation</Label><div className="mt-2 flex rounded-[9px] bg-subtle p-1">{(["hotel","apartment","either"] as const).map(x=><button type="button" key={x} onClick={()=>form.setValue("accommodationPreference",x)} className={cn("flex-1 rounded-[7px] px-3 py-2 text-[13px] capitalize transition",stay===x?"bg-surface font-medium shadow-sm":"text-ink-2")}>{x}</button>)}</div></div>
          <Field label="Comfort preference"><select className={input} {...form.register("accommodationLevel")}><option value="budget">Lowest cost</option><option value="standard">Quiet & central</option><option value="premium">Premium comfort</option></select></Field>
        </div>
        <div className="mt-5"><Label>Interests</Label><div className="mt-2 flex flex-wrap gap-2">{INTEREST_OPTIONS.map(i=>{const active=interests.includes(i);return <button key={i} type="button" onClick={()=>form.setValue("interests",active?interests.filter(x=>x!==i):[...interests,i])} className={cn("h-8 rounded-full border px-3.5 text-[13px] capitalize transition",active?"border-primary/40 bg-[#eaf4f1] font-medium text-primary":"border-line bg-surface text-ink-2 hover:border-line-strong")}>{i}</button>})}</div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Personal leisure budget" icon={<Wallet className="size-4" />}><input type="number" min={0} className={cn(input,"pl-9 pr-16 tabular")} {...form.register("personalLeisureBudget",{valueAsNumber:true})}/><Suffix>{form.watch("currency")}</Suffix></Field><label className="flex items-end gap-2 pb-2.5 text-[12.5px] leading-snug text-ink-3"><input type="checkbox" {...form.register("leisureEnabled")}/> Add personal leisure outside meetings. Costs stay separate.</label></div>
      </Section>
      <Section n={4} title="AI instructions" hint="In your own words" last>
        <div className="rounded-[12px] border border-line bg-subtle/60 p-1 focus-within:border-primary/50 focus-within:bg-surface focus-within:ring-4 focus-within:ring-primary/10"><div className="flex items-center gap-2 px-3 pt-2.5 text-[12.5px] font-medium text-ink-2"><MessageSquareText className="size-4 text-primary"/>Anything else we should know?</div><textarea rows={4} maxLength={600} className="w-full resize-none bg-transparent px-3 py-2 text-[14.5px] leading-relaxed outline-none placeholder:text-ink-3" {...form.register("freeText")} placeholder={demoFormValues.freeText}/><div className="px-3 pb-2 text-[11.5px] text-ink-3">AtlasFlow extracts meetings, constraints and preferences. Structured output is validated before use.</div></div>
        <Field label="Special requirements" className="mt-4"><textarea rows={2} className={cn(input,"h-auto py-3")} {...form.register("specialRequirements")}/></Field>
      </Section>
      <div className="sticky bottom-0 flex flex-col-reverse gap-2 rounded-b-[14px] border-t border-line bg-surface/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between md:px-6"><div className="flex gap-1"><button type="button" onClick={onLoadDemo} className="inline-flex items-center gap-2 rounded-[9px] px-3 py-2 text-[13px] font-medium text-ink-2 hover:bg-subtle"><RotateCcw className="size-3.5"/>Load sample trip</button><button type="button" onClick={onReset} className="rounded-[9px] px-3 py-2 text-[13px] text-ink-3 hover:bg-subtle">Reset</button></div><div className="flex gap-2"><button type="button" onClick={()=>onInterpret(form.getValues())} className="inline-flex items-center gap-2 rounded-[9px] border border-line px-4 py-2.5 text-[13px] font-medium hover:bg-subtle"><Sparkles className="size-4 text-primary"/>Interpret</button><button type="submit" disabled={planning} className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-[9px] bg-primary px-5 py-2.5 text-[13.5px] font-medium text-white hover:bg-[#1b554f] disabled:opacity-50">{planning?"Building your plans…":"Generate my travel plans"}<ArrowRight className="size-4"/></button></div></div>
    </form>
  );
}

function Label({children}:{children:ReactNode}){return <div className="text-[12.5px] font-medium text-ink-2">{children}</div>}
function Field({label,icon,children,className,error}:{label:string;icon?:ReactNode;children:ReactNode;className?:string;error?:string}){return <label className={cn("block",className)}><Label>{label}</Label><div className="relative mt-1.5">{icon&&<span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-3">{icon}</span>}{children}</div>{error&&<span className="mt-1 block text-[11px] text-error">{error}</span>}</label>}
function Section({n,title,hint,children,last}:{n:number;title:string;hint:string;children:ReactNode;last?:boolean}){return <section className={cn("p-5 md:p-6",!last&&"border-b border-line")}><div className="mb-4 flex items-baseline gap-3"><span className="text-[12px] font-medium tabular text-primary">0{n}</span><h2 className="text-[16px] font-medium tracking-tight">{title}</h2><span className="text-[12.5px] text-ink-3">{hint}</span></div>{children}</section>}
function Step({children,...props}:{children:ReactNode;onClick:()=>void;disabled?:boolean}){return <button type="button" {...props} className="flex size-8 items-center justify-center rounded-[7px] border border-line text-ink-2 hover:bg-subtle disabled:opacity-40">{children}</button>}
function Suffix({children}:{children:ReactNode}){return <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-ink-3">{children}</span>}
