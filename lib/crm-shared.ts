export const SERVICE_TYPE_OPTIONS = [
  'Video Editing',
  'Motion Graphics',
  'Graphic Design',
  'Branding',
  'Social Media Content',
  'Other',
] as const;

export const LEAD_INTENT_OPTIONS = [
  'Work Inquiry',
  'General Message',
  'Collaboration',
  'Pricing Request',
  'Support / Question',
] as const;

export const CONTACT_PURPOSE_OPTIONS = [
  'Work Inquiry / Project',
  'General Message',
  'Collaboration',
  'Other',
] as const;

export const COLLABORATION_TYPE_OPTIONS = [
  'Brand Partnership',
  'Agency / Studio Partnership',
  'Content Collaboration',
  'Platform Feature / Interview',
  'Event / Workshop',
  'Other',
] as const;

export const WORK_BUDGET_RANGE_OPTIONS = [
  'Under ৳10,000',
  '৳10,000 - ৳25,000',
  '৳25,000 - ৳50,000',
  '৳50,000 - ৳100,000',
  'Over ৳100,000',
  'Need Custom Quote',
] as const;

export const LEAD_CATEGORY_OPTIONS = [
  'Work Inquiry',
  'Pricing Request',
  'Creative Brief Needed',
  'General Message / Hi-Hello',
  'Active Project',
  'Completed',
  'Archived / Spam',
] as const;

export const LEAD_STATUS_OPTIONS = [
  'New',
  'Contacted',
  'In Progress',
  'Closed',
  'Read',
  'Pending Reply',
  'Brief Sent',
  'Brief Opened',
  'Brief Submitted',
  'Quotation Sent',
  'Accepted',
  'Project Created',
  'In Discussion',
  'Completed',
  'Archived',
] as const;

export const LEAD_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'] as const;

export const PREFERRED_CONTACT_OPTIONS = ['Email', 'Mobile', 'WhatsApp'] as const;

export const PROJECT_STATUS_OPTIONS = [
  'New',
  'Brief Received',
  'Quotation Sent',
  'Accepted',
  'In Progress',
  'First Draft Sent',
  'Revision',
  'Final Delivery',
  'Completed',
  'Cancelled',
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  'Pending',
  'Deposit Paid',
  'Partially Paid',
  'Paid',
  'Refunded',
] as const;

export type ContactPurpose = (typeof CONTACT_PURPOSE_OPTIONS)[number];
export type CollaborationType = (typeof COLLABORATION_TYPE_OPTIONS)[number];
export type WorkBudgetRange = (typeof WORK_BUDGET_RANGE_OPTIONS)[number];

export function mapContactPurposeToIntent(purpose: ContactPurpose | string) {
  switch (purpose) {
    case 'Collaboration':
      return 'Collaboration';
    case 'General Message':
      return 'General Message';
    case 'Other':
      return 'General Message';
    case 'Work Inquiry / Project':
    default:
      return 'Work Inquiry';
  }
}

export function isReasonablyValidPhone(value: string) {
  const normalized = normalizeWhatsAppNumber(value);
  return normalized.length >= 10 && normalized.length <= 15;
}

export function formatProjectSerial(value: number) {
  return String(Math.max(1, Math.floor(value || 0))).padStart(4, '0');
}

export function buildProjectAccessCode(projectSerial: number) {
  return `PRJ-${formatProjectSerial(projectSerial)}`;
}

export function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^00/, '');
  if (digits.startsWith('880') && digits.length >= 13) {
    return digits;
  }

  if (digits.startsWith('01') && digits.length === 11) {
    return `88${digits}`;
  }

  if (digits.startsWith('1') && digits.length === 10) {
    return `880${digits}`;
  }

  return digits;
}

export function buildWhatsAppUrl(number: string, message: string) {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) {
    return '';
  }

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message.trim())}`;
}

export function renderTemplate(
  template: string,
  variables: Record<string, string | number | undefined>
) {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key: string) => {
    const value = variables[key];
    return value === undefined || value === null ? '' : String(value);
  });
}
