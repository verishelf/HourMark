import { APP_LAUNCH_HTML, APP_LAUNCH_SUBJECT } from "./app-launch";
import { BUYER_OUTREACH_HTML, BUYER_OUTREACH_SUBJECT } from "./buyer-outreach";
import { DEALER_PARTNERSHIP_HTML, DEALER_PARTNERSHIP_SUBJECT } from "./dealer-partnership";
import { SELLER_LEAD_FOLLOWUP_HTML, SELLER_LEAD_FOLLOWUP_SUBJECT } from "./seller-lead-followup";
import { SELLER_OUTREACH_HTML, SELLER_OUTREACH_SUBJECT } from "./seller-outreach";

export type DefaultEmailTemplate = {
  name: string;
  description: string;
  default_subject: string;
  html: string;
};

export const DEFAULT_EMAIL_TEMPLATES: DefaultEmailTemplate[] = [
  {
    name: "Seller Outreach",
    description: "Marketing email for sellers and dealers — gold header, escrow, Grail Board.",
    default_subject: SELLER_OUTREACH_SUBJECT,
    html: SELLER_OUTREACH_HTML,
  },
  {
    name: "Buyer Outreach",
    description: "Marketing email for collectors — verified sellers, escrow, Authenticity Passport.",
    default_subject: BUYER_OUTREACH_SUBJECT,
    html: BUYER_OUTREACH_HTML,
  },
  {
    name: "Seller Lead Follow-up",
    description: "Short CRM follow-up for inbound seller leads.",
    default_subject: SELLER_LEAD_FOLLOWUP_SUBJECT,
    html: SELLER_LEAD_FOLLOWUP_HTML,
  },
  {
    name: "App Launch Waitlist",
    description: "General App Store launch announcement and waitlist CTA.",
    default_subject: APP_LAUNCH_SUBJECT,
    html: APP_LAUNCH_HTML,
  },
  {
    name: "Dealer Partnership",
    description: "Invite verified dealers to join the Crownly dealer network.",
    default_subject: DEALER_PARTNERSHIP_SUBJECT,
    html: DEALER_PARTNERSHIP_HTML,
  },
];
