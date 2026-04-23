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

export function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/^00/, '');
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
