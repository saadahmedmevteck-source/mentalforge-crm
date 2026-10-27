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

// Grouped for the deal form's <optgroup>s. Sources: mentalforge.media and massive-designs.com.
export const SERVICE_GROUPS = [
  {
    label: "AI Services",
    services: [
      "AI Integration Consulting",
      "AI Automation",
      "AI Chatbot",
      "Fusion Foundations Workshop",
      "Corporate AI Training",
      "Brand Voice Architecture",
    ],
  },
  {
    label: "BPO & Customer Support",
    services: [
      "Live Chat Support",
      "Live Call Support",
      "Email Support Services",
      "Back-Office Outsourcing",
      "Lead Generation",
    ],
  },
  {
    label: "Podcast & Theatre",
    services: [
      "Mobile Podcast Production",
      "Creative Development & Content Creation",
      "Production Design & Technical Planning",
      "Performance Development & Rehearsal",
    ],
  },
  {
    label: "Web & App Development",
    services: [
      "Web Design",
      "Web Development",
      "E-Commerce Setup",
      "WordPress Design",
      "Landing Page Design",
      "Website Maintenance",
      "Website Redesign",
      "Mobile App Development",
    ],
  },
  {
    label: "Branding",
    services: [
      "Logo Design",
      "Brand Identity Kit",
      "Packaging Design",
      "Business Cards & Stationery",
      "Social Media Branding",
      "Rebranding",
    ],
  },
  {
    label: "Merch & Print",
    services: [
      "Custom Apparel (T-Shirts, Hoodies, Caps)",
      "Promotional Products",
      "Printing & Fulfillment",
      "Corporate Gifts",
    ],
  },
  {
    label: "Animation & Video",
    services: [
      "2D Animation",
      "3D Animation",
      "Motion Graphics",
      "Logo Animation",
      "Explainer Videos",
      "Product Animation",
    ],
  },
  {
    label: "SEO & Digital Marketing",
    services: [
      "On-Page Optimization",
      "Off-Page Optimization",
      "Local SEO",
      "Technical SEO Audit",
      "Keyword Research",
      "Content Optimization",
      "Content Marketing",
      "Social Media Marketing",
    ],
  },
] as const;

export const SERVICES = [...SERVICE_GROUPS.flatMap((g) => g.services), "Other"];

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

export const WORKSHOP_PROGRAMS = [
  "Fusion Foundations",
  "Corporate AI Training",
  "AI Lunch & Learn",
  "Other",
] as const;

export const WORKSHOP_FORMATS = [
  { id: "in_person", label: "In person" },
  { id: "virtual", label: "Virtual" },
  { id: "hybrid", label: "Hybrid" },
] as const;

export const WORKSHOP_STATUSES = [
  { id: "scheduled", label: "Scheduled" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
] as const;

// Statuses that hold a seat: registered and attended people, and no-shows (they had a seat).
export const SEAT_STATUSES = ["registered", "attended", "no_show"] as const;

export const REGISTRATION_STATUSES = [
  { id: "registered", label: "Registered", color: "bg-sky-100 text-sky-700" },
  { id: "waitlist", label: "Waitlist", color: "bg-amber-100 text-amber-700" },
  { id: "attended", label: "Attended", color: "bg-emerald-100 text-emerald-700" },
  { id: "no_show", label: "No-show", color: "bg-rose-100 text-rose-700" },
  { id: "cancelled", label: "Cancelled", color: "bg-slate-100 text-slate-500" },
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number]["id"];

export type Workshop = {
  id: number;
  title: string;
  program: string;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  format: string;
  location: string;
  capacity: number; // 0 = no limit
  price: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Aggregates
  seats_taken: number;
  waitlist_count: number;
  attended_count: number;
  revenue: number;
};

export type Registration = {
  id: number;
  workshop_id: number;
  contact_id: number;
  status: RegistrationStatus;
  amount_paid: number;
  created_at: string;
  // Joined
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_name: string;
  workshop_title: string;
  workshop_date: string;
  workshop_start_time: string;
};

export const TASK_TYPES =["Call", "Email", "Meeting", "Follow-up", "To-do"] as const;

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
