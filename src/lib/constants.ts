import { CRM_TIMEZONE } from "./dates";

export const STAGES = [
  { id: "lead", label: "New Lead", color: "bg-slate-400" },
  { id: "discovery", label: "Discovery Call", color: "bg-sky-500" },
  { id: "proposal", label: "Proposal Sent", color: "bg-violet-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-500" },
  { id: "won", label: "Closed Won", color: "bg-emerald-500" },
  { id: "lost", label: "Closed Lost", color: "bg-rose-500" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export const SERVICES = [
  "AI Integration Consulting",
  "AI Automation",
  "AI Chatbot",
  "Fusion Foundations Workshop",
  "Corporate AI Training",
  "Brand Voice Architecture",
  "Other",
] as const;

export const SOURCES = [
  "Website",
  "Referral",
  "LinkedIn",
  "Workshop attendee",
  "Google / SEO",
  "Event / Networking",
  "Cold outreach",
  "Other",
] as const;

export const LIFECYCLES = ["Lead", "Prospect", "Customer", "Past customer", "Partner"] as const;

export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"] as const;

export type Deal = {
  id: number;
  title: string;
  contact_id: number | null;
  company_id: number | null;
  service: string;
  value: number;
  stage: StageId;
  source: string;
  expected_close: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined from contacts / companies
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_name: string;
};

export type Contact = {
  id: number;
  name: string;
  email: string;
  phone: string;
  job_title: string;
  company_id: number | null;
  lifecycle: string;
  source: string;
  notes: string;
  created_at: string;
  updated_at: string;
  company_name: string;
  deal_count: number;
  open_value: number;
};

export type ContactOption = Pick<Contact, "name" | "email" | "phone" | "company_name">;

export type Company = {
  id: number;
  name: string;
  domain: string;
  industry: string;
  size: string;
  phone: string;
  city: string;
  notes: string;
  created_at: string;
  updated_at: string;
  contact_count: number;
  deal_count: number;
  open_value: number;
};

export const TASK_TYPES = ["Call", "Email", "Meeting", "Follow-up", "To-do"] as const;

export const PRIORITIES = [
  { id: "high", label: "High" },
  { id: "normal", label: "Normal" },
  { id: "low", label: "Low" },
] as const;

export type Task = {
  id: number;
  title: string;
  type: string;
  priority: "high" | "normal" | "low";
  due_date: string; // YYYY-MM-DD or ''
  due_time: string; // HH:MM or ''
  status: "open" | "done";
  deal_id: number | null;
  contact_id: number | null;
  notes: string;
  done_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  deal_title: string;
  contact_name: string;
};

export type Activity = {
  id: number;
  deal_id: number;
  kind: "created" | "stage" | "note" | "updated" | "task";
  body: string;
  created_at: string;
  user_name: string;
};

export function stageLabel(id: string) {
  return STAGES.find((s) => s.id === id)?.label ?? id;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// Timestamps are ISO strings; show them in the CRM time zone so they line up with task due times.
export function formatDateTime(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CRM_TIMEZONE,
  });
}
