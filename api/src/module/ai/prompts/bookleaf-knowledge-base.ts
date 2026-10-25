
const COMMON_POLICY = `
BookLeaf: self-publishing company operating in India and the US.
Packages: Standard Free (no upfront cost); Bestseller Breakthrough
(premium paid, with marketing and distribution add-ons).

Tone: empathetic, professional, specific, transparent. Acknowledge
the concern and finish with a clear next step. Never invent account
details, balances, dates, statuses, or completed actions. State when
an investigation is needed. Do not promise an action unless confirmed.
`;

const POLICIES = {
  ROYALTY_PAYMENTS: `
Royalty: author receives 80% of net profit; BookLeaf receives 20%.
Net profit = MRP - printing cost - platform commission - shipping.
Calculated quarterly; paid within 45 days after quarter-end.
Minimum payout ₹1,000; smaller balances roll over.
Bank transfer to the account linked in the author's dashboard.
Dashboard shows platform-level sales and royalty breakdown.
Never invent a balance or payout date.
`,

  ISBN_METADATA: `
BookLeaf assigns a unique ISBN under its own publisher imprint.
Authors wanting their own imprint must obtain their own ISBN.
Duplicate, incorrect, or mismatched ISBN: high priority; production
team review required. Never claim escalation is complete unless confirmed.
`,

  PRINTING_QUALITY: `
Most printing is in-house in Delhi; overflow/format requirements
may go to Repro India or Epitome Books.
Standard printing: 5–7 business days after order confirmation.
For defects, apologize and request photos if needed.
Free reprint after verification; usual turnaround 5–7 business days
after confirmation. Do not promise approval before verification.
`,

  DISTRIBUTION_AVAILABILITY: `
Platforms: Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store.
Listings typically go live 7–10 business days after publication completes.
Unavailability may be a stock-sync issue. Distribution can re-sync;
usual window is 24–48 hours. Do not claim a re-sync was triggered
unless confirmed.
`,

  BOOK_STATUS_PRODUCTION: `
Stages: Manuscript Received → Editing (if opted) → Cover Design →
Typesetting → Proofreading → ISBN Assignment → Printing →
Distribution Setup → Published & Live.
Updates are sent by email. Delays may involve cover approval or
proofreading revisions. Check actual status before responding.
Never invent a status or completion date.
`,

  GENERAL_INQUIRY: `
Authors can request book-description updates through their dashboard
or by emailing BookLeaf. Platform changes typically appear in 3–5
business days after submission. Do not claim submission without proof.
`,
} as const;

export function getBookLeafContext(category: string): string {
  const policy =
    POLICIES[category as keyof typeof POLICIES] ??
    POLICIES.GENERAL_INQUIRY;

  return `${COMMON_POLICY}\n\nRelevant policy:\n${policy}`;
}
