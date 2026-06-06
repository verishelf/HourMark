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
];
