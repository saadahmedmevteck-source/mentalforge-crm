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

export type Deal = {
  id: number;
  title: string;
  contact_name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  value: number;
  stage: StageId;
  source: string;
  expected_close: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: number;
  deal_id: number;
  kind: "created" | "stage" | "note" | "updated";
  body: string;
  created_at: string;
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
