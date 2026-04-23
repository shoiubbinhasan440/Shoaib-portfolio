import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatProjectSerial } from '@/lib/crm-shared';
import { writeSiteSetting } from '@/lib/site-settings';

export const CRM_LEADS_SETTING_KEY = 'contact_messages_store';
export const CRM_MESSAGE_TEMPLATES_SETTING_KEY = 'crm_message_templates_store';
export const CRM_RATE_TEMPLATES_SETTING_KEY = 'crm_rate_templates_store';
export const CRM_CREATIVE_BRIEFS_SETTING_KEY = 'crm_creative_briefs_store';
export const CRM_CLIENTS_SETTING_KEY = 'crm_clients_store';
export const CRM_PROJECTS_SETTING_KEY = 'crm_projects_store';
export const CRM_PROJECT_MILESTONES_SETTING_KEY = 'crm_project_milestones_store';
export const CRM_PROJECT_UPDATES_SETTING_KEY = 'crm_project_updates_store';

export const SERVICE_TYPES = [
  'Video Editing',
  'Motion Graphics',
  'Graphic Design',
  'Branding',
  'Social Media Content',
  'Other',
] as const;

export const LEAD_INTENTS = [
  'Work Inquiry',
  'General Message',
  'Collaboration',
  'Pricing Request',
  'Support / Question',
] as const;

export const LEAD_CATEGORIES = [
  'Work Inquiry',
  'Pricing Request',
  'Creative Brief Needed',
  'General Message / Hi-Hello',
  'Active Project',
  'Completed',
  'Archived / Spam',
] as const;

export const LEAD_STATUSES = [
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

export const LEAD_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;

export const PREFERRED_CONTACT_METHODS = [
  'Email',
  'Mobile',
  'WhatsApp',
] as const;

export const BRIEF_STATUSES = [
  'not_sent',
  'sent',
  'opened',
  'submitted',
] as const;

export const PROJECT_STATUSES = [
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

export const PAYMENT_STATUSES = [
  'Pending',
  'Deposit Paid',
  'Partially Paid',
  'Paid',
  'Refunded',
] as const;

export const MILESTONE_STATUSES = [
  'Pending',
  'In Progress',
  'Completed',
] as const;

export const PROJECT_UPDATE_TYPES = [
  'progress',
  'delivery',
  'note',
  'payment',
  'milestone',
] as const;

export const TEMPLATE_VARIABLES = [
  'client_name',
  'service_type',
  'project_title',
  'price',
  'deadline',
  'brief_link',
  'progress_percentage',
  'project_status',
  'portal_login_url',
  'access_code',
  'budget_range',
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];
export type LeadIntent = (typeof LEAD_INTENTS)[number];
export type LeadCategory = (typeof LEAD_CATEGORIES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];
export type PreferredContactMethod = (typeof PREFERRED_CONTACT_METHODS)[number];
export type BriefStatus = (typeof BRIEF_STATUSES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];
export type ProjectUpdateType = (typeof PROJECT_UPDATE_TYPES)[number];

export type ContactLead = {
  archived: boolean;
  attachmentLink: string;
  briefId: string;
  briefStatus: BriefStatus;
  budgetRange: string;
  category: LeadCategory;
  clientId: string;
  createdAt: string;
  deadline: string;
  email: string;
  id: string;
  important: boolean;
  intentCategory: LeadIntent;
  lastContactedAt: string;
  message: string;
  mobileNumber: string;
  name: string;
  preferredContactMethod: PreferredContactMethod;
  priority: LeadPriority;
  projectId: string;
  projectType: string;
  read: boolean;
  serviceType: ServiceType;
  source: 'website-contact';
  status: LeadStatus;
  updatedAt: string;
  whatsappNumber: string;
};

export type ContactLeadInput = {
  attachmentLink?: string;
  budgetRange: string;
  deadline: string;
  email: string;
  intentCategory: LeadIntent | string;
  message: string;
  mobileNumber: string;
  name: string;
  preferredContactMethod: PreferredContactMethod | string;
  projectType: string;
  serviceType: ServiceType | string;
  whatsappNumber: string;
};

export type MessageTemplateKey =
  | 'greeting_reply'
  | 'rate_package_reply'
  | 'creative_brief_request'
  | 'project_accepted'
  | 'progress_update'
  | 'revision_request'
  | 'final_delivery'
  | 'thank_you';

export type MessageTemplate = {
  body: string;
  description: string;
  enabled: boolean;
  id: string;
  key: MessageTemplateKey;
  title: string;
  updatedAt: string;
};

export type RateTemplate = {
  deliveryTime: string;
  id: string;
  includedServices: string[];
  messageBody: string;
  priceRange: string;
  revisionPolicy: string;
  serviceType: ServiceType;
  title: string;
  updatedAt: string;
};

export type CreativeBrief = {
  brandName: string;
  budget: string;
  contactEmail: string;
  contentScript: string;
  createdAt: string;
  deadline: string;
  id: string;
  leadId: string;
  notes: string;
  openedAt: string;
  projectGoal: string;
  projectTitle: string;
  referencesLinks: string;
  requiredFilesLinks: string;
  sentAt: string;
  serviceNeeded: string;
  status: Exclude<BriefStatus, 'not_sent'>;
  stylePreference: string;
  submittedAt: string;
  targetAudience: string;
  token: string;
  updatedAt: string;
  whatsappNumber: string;
  colorPreference: string;
};

export type ClientAccount = {
  active: boolean;
  authVersion: number;
  createdAt: string;
  email: string;
  fullName: string;
  id: string;
  lastLeadId: string;
  lastLoginAt: string;
  mobileNumber: string;
  portalAccessCode: string;
  portalAccessIssuedAt: string;
  projectIds: string[];
  updatedAt: string;
  whatsappNumber: string;
  accessCodeHash: string;
};

export type ClientPortalProfile = Pick<
  ClientAccount,
  'email' | 'fullName' | 'id' | 'lastLoginAt'
>;

export type ProjectResource = {
  clientVisible: boolean;
  createdAt: string;
  description: string;
  id: string;
  label: string;
  url: string;
};

export type ClientProject = {
  budgetPrice: string;
  clientEmail: string;
  clientId: string;
  clientName: string;
  clientVisibleNotes: string;
  createdAt: string;
  currentStatus: ProjectStatus;
  deadline: string;
  id: string;
  leadId: string;
  mobileNumber: string;
  nextStep: string;
  paymentStatus: PaymentStatus;
  privateAdminNotes: string;
  progressPercentage: number;
  projectSerial: number;
  projectTitle: string;
  requirements: string;
  resources: ProjectResource[];
  serviceType: ServiceType;
  updatedAt: string;
  whatsappNumber: string;
};

export type ProjectMilestone = {
  clientVisible: boolean;
  description: string;
  dueDate: string;
  id: string;
  order: number;
  projectId: string;
  status: MilestoneStatus;
  title: string;
  updatedAt: string;
};

export type ProjectUpdate = {
  body: string;
  createdAt: string;
  id: string;
  progressSnapshot: number;
  projectId: string;
  statusSnapshot: ProjectStatus;
  title: string;
  type: ProjectUpdateType;
  visibility: 'admin' | 'client';
};

export type CreateProjectFromLeadInput = {
  budgetPrice: string;
  clientVisibleNotes?: string;
  currentStatus?: ProjectStatus;
  deadline: string;
  leadId: string;
  nextStep: string;
  paymentStatus?: PaymentStatus;
  privateAdminNotes?: string;
  progressPercentage?: number;
  projectTitle: string;
  requirements: string;
  serviceType?: ServiceType | string;
};

type JsonRecord = Record<string, unknown>;

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeSingleLine(value: unknown, maxLength = 240) {
  const raw = typeof value === 'string' ? value : '';
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function sanitizeMultiline(value: unknown, maxLength = 4000) {
  const raw = typeof value === 'string' ? value : '';
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, maxLength);
}

function sanitizePhone(value: unknown) {
  const raw = typeof value === 'string' ? value : '';
  const hasPlus = raw.trim().startsWith('+');
  const digits = raw.replace(/\D/g, '').slice(0, 18);
  if (!digits) {
    return '';
  }

  return `${hasPlus ? '+' : ''}${digits}`;
}

function sanitizeEmail(value: unknown) {
  const email = sanitizeSingleLine(value, 180).toLowerCase();
  if (!email) {
    return '';
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function sanitizeUrl(value: unknown) {
  const raw = sanitizeSingleLine(value, 500);
  if (!raw) {
    return '';
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }

    return url.toString().slice(0, 500);
  } catch {
    return '';
  }
}

function boolValue(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function enumValue<const T extends readonly string[]>(
  value: unknown,
  options: T,
  fallback: T[number]
): T[number] {
  return typeof value === 'string' && options.includes(value)
    ? (value as T[number])
    : fallback;
}

function sanitizeIsoDate(value: unknown, fallback = '') {
  const input = sanitizeSingleLine(value, 40);
  if (!input) {
    return fallback;
  }

  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function sanitizeProjectDate(value: unknown) {
  return sanitizeSingleLine(value, 20);
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function sortNewest<T extends { createdAt?: string; updatedAt?: string }>(items: T[]) {
  return items.sort((leftItem, rightItem) => {
    const leftKey = leftItem.updatedAt || leftItem.createdAt || '';
    const rightKey = rightItem.updatedAt || rightItem.createdAt || '';
    return rightKey.localeCompare(leftKey);
  });
}

function leadCategoryFromIntent(intent: LeadIntent): LeadCategory {
  if (intent === 'Pricing Request') {
    return 'Pricing Request';
  }

  if (intent === 'General Message' || intent === 'Support / Question') {
    return 'General Message / Hi-Hello';
  }

  return 'Work Inquiry';
}

function leadPriorityFromIntent(intent: LeadIntent): LeadPriority {
  if (intent === 'Pricing Request') {
    return 'High';
  }

  if (intent === 'Work Inquiry' || intent === 'Collaboration') {
    return 'Medium';
  }

  return 'Low';
}

function hashAccessCode(code: string) {
  const secret =
    process.env.APP_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_PASSWORD ||
    'portfolio-client-portal';

  return createHash('sha256').update(`${secret}:${code}`).digest('hex');
}

const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function getServiceAccessPrefix(serviceType: ServiceType | string) {
  switch (serviceType) {
    case 'Video Editing':
      return 'VED';
    case 'Motion Graphics':
      return 'MOG';
    case 'Graphic Design':
      return 'GRD';
    case 'Branding':
      return 'BRN';
    case 'Social Media Content':
      return 'SMC';
    default:
      return 'PRJ';
  }
}

function createAccessCodeSegment(length: number) {
  return Array.from(randomBytes(length), byte =>
    ACCESS_CODE_ALPHABET[byte % ACCESS_CODE_ALPHABET.length]
  ).join('');
}

export function generateClientAccessCode(
  projectSerial?: number,
  serviceType?: ServiceType | string
) {
  if (typeof projectSerial === 'number' && Number.isFinite(projectSerial) && projectSerial > 0) {
    const prefix = getServiceAccessPrefix(serviceType || 'Other');
    return `${prefix}-${formatProjectSerial(projectSerial)}-${createAccessCodeSegment(4)}`;
  }

  return `CLT-${createAccessCodeSegment(4)}-${createAccessCodeSegment(4)}`;
}

export function verifyClientAccessCode(code: string, hash: string) {
  return hashAccessCode(code.trim().toUpperCase()) === hash;
}

export function getLeadPreferredNumber(lead: Pick<ContactLead, 'mobileNumber' | 'whatsappNumber'>) {
  return lead.whatsappNumber || lead.mobileNumber;
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

  const encodedMessage = encodeURIComponent(message.trim());
  return `https://wa.me/${normalized}?text=${encodedMessage}`;
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

async function readSettingJson(supabase: SupabaseClient, key: string) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.value) {
    return null;
  }

  try {
    return JSON.parse(data.value) as unknown;
  } catch {
    return null;
  }
}

async function saveSettingJson(
  supabase: SupabaseClient,
  key: string,
  value: unknown
) {
  await writeSiteSetting(supabase, key, JSON.stringify(value));
}

function sanitizeLead(value: unknown): ContactLead | null {
  if (!isRecord(value)) {
    return null;
  }

  const legacyIntent = sanitizeSingleLine(value.subject, 80).toLowerCase();
  const intent = enumValue(
    value.intentCategory,
    LEAD_INTENTS,
    legacyIntent.includes('price')
      ? 'Pricing Request'
      : legacyIntent.includes('support')
        ? 'Support / Question'
        : 'Work Inquiry'
  );
  const createdAt = sanitizeIsoDate(value.createdAt, nowIso());
  const updatedAt = sanitizeIsoDate(value.updatedAt, createdAt);
  const serviceType = enumValue(value.serviceType, SERVICE_TYPES, 'Other');

  const lead: ContactLead = {
    archived: boolValue(value.archived, false),
    attachmentLink: sanitizeUrl(value.attachmentLink || value.fileLink || value.link),
    briefId: sanitizeSingleLine(value.briefId, 120),
    briefStatus: enumValue(value.briefStatus, BRIEF_STATUSES, 'not_sent'),
    budgetRange: sanitizeSingleLine(value.budgetRange || 'Not specified', 120),
    category: enumValue(value.category, LEAD_CATEGORIES, leadCategoryFromIntent(intent)),
    clientId: sanitizeSingleLine(value.clientId, 120),
    createdAt,
    deadline: sanitizeProjectDate(value.deadline),
    email: sanitizeEmail(value.email),
    id: sanitizeSingleLine(value.id, 120) || createId('lead'),
    important: boolValue(value.important, false),
    intentCategory: intent,
    lastContactedAt: sanitizeIsoDate(value.lastContactedAt),
    message: sanitizeMultiline(value.message, 4000),
    mobileNumber: sanitizePhone(value.mobileNumber || value.mobile),
    name: sanitizeSingleLine(value.name, 120),
    preferredContactMethod: enumValue(
      value.preferredContactMethod,
      PREFERRED_CONTACT_METHODS,
      sanitizePhone(value.whatsappNumber || value.mobileNumber || value.mobile)
        ? 'WhatsApp'
        : 'Email'
    ),
    priority: enumValue(
      value.priority,
      LEAD_PRIORITIES,
      leadPriorityFromIntent(intent)
    ),
    projectId: sanitizeSingleLine(value.projectId, 120),
    projectType: sanitizeSingleLine(value.projectType || value.subject || 'General Project', 180),
    read: boolValue(value.read, false),
    serviceType,
    source: 'website-contact',
    status: enumValue(
      value.status,
      LEAD_STATUSES,
      boolValue(value.archived, false)
        ? 'Archived'
        : boolValue(value.read, false)
          ? 'Read'
          : 'New'
    ),
    updatedAt,
    whatsappNumber: sanitizePhone(value.whatsappNumber),
  };

  if (!lead.name || !lead.email || !lead.message) {
    return null;
  }

  return lead;
}

function sanitizeLeads(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ContactLead[];
  }

  return sortNewest(
    value.map(sanitizeLead).filter((item): item is ContactLead => Boolean(item))
  ).slice(0, 500);
}

function sanitizeMessageTemplate(
  value: unknown,
  fallback: MessageTemplate
): MessageTemplate | null {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    body: sanitizeMultiline(value.body, 4000) || fallback.body,
    description: sanitizeSingleLine(value.description, 220) || fallback.description,
    enabled: boolValue(value.enabled, true),
    id: sanitizeSingleLine(value.id, 120) || fallback.id,
    key: fallback.key,
    title: sanitizeSingleLine(value.title, 120) || fallback.title,
    updatedAt: sanitizeIsoDate(value.updatedAt, nowIso()),
  };
}

function sanitizeRateTemplate(
  value: unknown,
  fallback: RateTemplate
): RateTemplate | null {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    deliveryTime: sanitizeSingleLine(value.deliveryTime, 120) || fallback.deliveryTime,
    id: sanitizeSingleLine(value.id, 120) || fallback.id,
    includedServices: Array.isArray(value.includedServices)
      ? dedupeStrings(
          value.includedServices
            .map(item => sanitizeSingleLine(item, 140))
            .filter(Boolean)
        ).slice(0, 10)
      : fallback.includedServices,
    messageBody: sanitizeMultiline(value.messageBody, 4000) || fallback.messageBody,
    priceRange: sanitizeSingleLine(value.priceRange, 120) || fallback.priceRange,
    revisionPolicy:
      sanitizeSingleLine(value.revisionPolicy, 220) || fallback.revisionPolicy,
    serviceType: enumValue(value.serviceType, SERVICE_TYPES, fallback.serviceType),
    title: sanitizeSingleLine(value.title, 120) || fallback.title,
    updatedAt: sanitizeIsoDate(value.updatedAt, nowIso()),
  };
}

function sanitizeBrief(value: unknown): CreativeBrief | null {
  if (!isRecord(value)) {
    return null;
  }

  const createdAt = sanitizeIsoDate(value.createdAt, nowIso());

  return {
    brandName: sanitizeSingleLine(value.brandName, 160),
    budget: sanitizeSingleLine(value.budget, 120),
    contactEmail: sanitizeEmail(value.contactEmail),
    colorPreference: sanitizeSingleLine(value.colorPreference, 220),
    contentScript: sanitizeMultiline(value.contentScript, 4000),
    createdAt,
    deadline: sanitizeProjectDate(value.deadline),
    id: sanitizeSingleLine(value.id, 120) || createId('brief'),
    leadId: sanitizeSingleLine(value.leadId, 120),
    notes: sanitizeMultiline(value.notes, 4000),
    openedAt: sanitizeIsoDate(value.openedAt),
    projectGoal: sanitizeMultiline(value.projectGoal, 1200),
    projectTitle: sanitizeSingleLine(value.projectTitle, 180),
    referencesLinks: sanitizeMultiline(value.referencesLinks, 2000),
    requiredFilesLinks: sanitizeMultiline(value.requiredFilesLinks, 2000),
    sentAt: sanitizeIsoDate(value.sentAt, createdAt),
    serviceNeeded: sanitizeSingleLine(value.serviceNeeded, 160),
    status: enumValue(value.status, ['sent', 'opened', 'submitted'] as const, 'sent'),
    stylePreference: sanitizeSingleLine(value.stylePreference, 220),
    submittedAt: sanitizeIsoDate(value.submittedAt),
    targetAudience: sanitizeMultiline(value.targetAudience, 1200),
    token: sanitizeSingleLine(value.token, 180),
    updatedAt: sanitizeIsoDate(value.updatedAt, createdAt),
    whatsappNumber: sanitizePhone(value.whatsappNumber),
  };
}

function sanitizeBriefs(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as CreativeBrief[];
  }

  return sortNewest(
    value.map(sanitizeBrief).filter((item): item is CreativeBrief => Boolean(item))
  );
}

function sanitizeClient(value: unknown): ClientAccount | null {
  if (!isRecord(value)) {
    return null;
  }

  const createdAt = sanitizeIsoDate(value.createdAt, nowIso());

  return {
    accessCodeHash: sanitizeSingleLine(value.accessCodeHash, 200),
    active: boolValue(value.active, true),
    authVersion: Math.max(1, numberValue(value.authVersion, 1)),
    createdAt,
    email: sanitizeEmail(value.email),
    fullName: sanitizeSingleLine(value.fullName, 120),
    id: sanitizeSingleLine(value.id, 120) || createId('client'),
    lastLeadId: sanitizeSingleLine(value.lastLeadId, 120),
    lastLoginAt: sanitizeIsoDate(value.lastLoginAt),
    mobileNumber: sanitizePhone(value.mobileNumber),
    portalAccessCode: sanitizeSingleLine(value.portalAccessCode, 40).toUpperCase(),
    portalAccessIssuedAt: sanitizeIsoDate(value.portalAccessIssuedAt),
    projectIds: Array.isArray(value.projectIds)
      ? dedupeStrings(
          value.projectIds.map(item => sanitizeSingleLine(item, 120)).filter(Boolean)
        )
      : [],
    updatedAt: sanitizeIsoDate(value.updatedAt, createdAt),
    whatsappNumber: sanitizePhone(value.whatsappNumber),
  };
}

function sanitizeClients(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ClientAccount[];
  }

  return sortNewest(
    value.map(sanitizeClient).filter((item): item is ClientAccount => Boolean(item))
  );
}

function sanitizeResource(value: unknown): ProjectResource | null {
  if (!isRecord(value)) {
    return null;
  }

  const url = sanitizeUrl(value.url);
  if (!url) {
    return null;
  }

  return {
    clientVisible: boolValue(value.clientVisible, true),
    createdAt: sanitizeIsoDate(value.createdAt, nowIso()),
    description: sanitizeSingleLine(value.description, 220),
    id: sanitizeSingleLine(value.id, 120) || createId('resource'),
    label: sanitizeSingleLine(value.label, 120) || 'Project Resource',
    url,
  };
}

function sanitizeProject(value: unknown): ClientProject | null {
  if (!isRecord(value)) {
    return null;
  }

  const createdAt = sanitizeIsoDate(value.createdAt, nowIso());
  const projectSerial = Math.max(0, numberValue(value.projectSerial, 0));

  return {
    budgetPrice: sanitizeSingleLine(value.budgetPrice, 120),
    clientEmail: sanitizeEmail(value.clientEmail),
    clientId: sanitizeSingleLine(value.clientId, 120),
    clientName: sanitizeSingleLine(value.clientName, 120),
    clientVisibleNotes: sanitizeMultiline(value.clientVisibleNotes, 4000),
    createdAt,
    currentStatus: enumValue(value.currentStatus, PROJECT_STATUSES, 'New'),
    deadline: sanitizeProjectDate(value.deadline),
    id: sanitizeSingleLine(value.id, 120) || createId('project'),
    leadId: sanitizeSingleLine(value.leadId, 120),
    mobileNumber: sanitizePhone(value.mobileNumber),
    nextStep: sanitizeSingleLine(value.nextStep, 220),
    paymentStatus: enumValue(value.paymentStatus, PAYMENT_STATUSES, 'Pending'),
    privateAdminNotes: sanitizeMultiline(value.privateAdminNotes, 4000),
    progressPercentage: Math.min(100, Math.max(0, numberValue(value.progressPercentage, 0))),
    projectSerial,
    projectTitle: sanitizeSingleLine(value.projectTitle, 180),
    requirements: sanitizeMultiline(value.requirements, 4000),
    resources: Array.isArray(value.resources)
      ? value.resources
          .map(sanitizeResource)
          .filter((item): item is ProjectResource => Boolean(item))
      : [],
    serviceType: enumValue(value.serviceType, SERVICE_TYPES, 'Other'),
    updatedAt: sanitizeIsoDate(value.updatedAt, createdAt),
    whatsappNumber: sanitizePhone(value.whatsappNumber),
  };
}

function sanitizeProjects(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ClientProject[];
  }

  return sortNewest(
    value.map(sanitizeProject).filter((item): item is ClientProject => Boolean(item))
  );
}

function sanitizeMilestone(value: unknown): ProjectMilestone | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    clientVisible: boolValue(value.clientVisible, true),
    description: sanitizeSingleLine(value.description, 320),
    dueDate: sanitizeProjectDate(value.dueDate),
    id: sanitizeSingleLine(value.id, 120) || createId('milestone'),
    order: Math.max(1, numberValue(value.order, 1)),
    projectId: sanitizeSingleLine(value.projectId, 120),
    status: enumValue(value.status, MILESTONE_STATUSES, 'Pending'),
    title: sanitizeSingleLine(value.title, 140),
    updatedAt: sanitizeIsoDate(value.updatedAt, nowIso()),
  };
}

function sanitizeMilestones(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ProjectMilestone[];
  }

  return value
    .map(sanitizeMilestone)
    .filter((item): item is ProjectMilestone => Boolean(item))
    .sort((leftItem, rightItem) => {
      if (leftItem.projectId === rightItem.projectId) {
        return leftItem.order - rightItem.order;
      }

      return leftItem.projectId.localeCompare(rightItem.projectId);
    });
}

function sanitizeProjectUpdate(value: unknown): ProjectUpdate | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    body: sanitizeMultiline(value.body, 4000),
    createdAt: sanitizeIsoDate(value.createdAt, nowIso()),
    id: sanitizeSingleLine(value.id, 120) || createId('update'),
    progressSnapshot: Math.min(100, Math.max(0, numberValue(value.progressSnapshot, 0))),
    projectId: sanitizeSingleLine(value.projectId, 120),
    statusSnapshot: enumValue(value.statusSnapshot, PROJECT_STATUSES, 'New'),
    title: sanitizeSingleLine(value.title, 160),
    type: enumValue(value.type, PROJECT_UPDATE_TYPES, 'note'),
    visibility: enumValue(value.visibility, ['admin', 'client'] as const, 'admin'),
  };
}

function sanitizeProjectUpdates(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ProjectUpdate[];
  }

  return sortNewest(
    value
      .map(sanitizeProjectUpdate)
      .filter((item): item is ProjectUpdate => Boolean(item))
  );
}

function defaultMessageTemplates(): MessageTemplate[] {
  const timestamp = nowIso();
  return [
    {
      body: 'Hi {{client_name}}, thanks for reaching out. I reviewed your {{service_type}} inquiry and I would love to learn a bit more before I share the best direction for your project.',
      description: 'Warm first response for a new lead.',
      enabled: true,
      id: 'msg-template-greeting',
      key: 'greeting_reply',
      title: 'Greeting Reply',
      updatedAt: timestamp,
    },
    {
      body: 'Hi {{client_name}}, here is the package estimate for your {{service_type}} project.\n\nPrice: {{price}}\nTimeline: {{deadline}}\n\nIf this looks good, I can send the next step right away.',
      description: 'Quick pricing response with variables.',
      enabled: true,
      id: 'msg-template-rate',
      key: 'rate_package_reply',
      title: 'Rate / Package Reply',
      updatedAt: timestamp,
    },
    {
      body: 'Hi {{client_name}}, to shape the project properly I prepared a short creative brief for you. Please fill it in here:\n{{brief_link}}\n\nOnce I receive it, I can send a sharper scope and quote.',
      description: 'Send the creative brief link over WhatsApp or email.',
      enabled: true,
      id: 'msg-template-brief',
      key: 'creative_brief_request',
      title: 'Creative Brief Request',
      updatedAt: timestamp,
    },
    {
      body: 'Hi {{client_name}}, great news: your project "{{project_title}}" is now accepted. I have set up your client portal here:\n{{portal_login_url}}\nAccess code: {{access_code}}\n\nCurrent status: {{project_status}}',
      description: 'Share acceptance and portal access.',
      enabled: true,
      id: 'msg-template-accepted',
      key: 'project_accepted',
      title: 'Project Accepted',
      updatedAt: timestamp,
    },
    {
      body: 'Hi {{client_name}}, quick update on "{{project_title}}": the project is now at {{progress_percentage}}% and the current status is {{project_status}}.',
      description: 'Progress update message for WhatsApp.',
      enabled: true,
      id: 'msg-template-progress',
      key: 'progress_update',
      title: 'Progress Update',
      updatedAt: timestamp,
    },
    {
      body: 'Hi {{client_name}}, I reviewed the latest feedback for "{{project_title}}". Please send the revision points and I will schedule the next update.',
      description: 'Collect revision notes from the client.',
      enabled: true,
      id: 'msg-template-revision',
      key: 'revision_request',
      title: 'Revision Request',
      updatedAt: timestamp,
    },
    {
      body: 'Hi {{client_name}}, your project "{{project_title}}" is ready for final delivery. I have uploaded the latest files and links to your client portal.',
      description: 'Final delivery handoff.',
      enabled: true,
      id: 'msg-template-delivery',
      key: 'final_delivery',
      title: 'Final Delivery',
      updatedAt: timestamp,
    },
    {
      body: 'Hi {{client_name}}, thank you again for trusting me with your {{service_type}} project. I appreciate it and I am always here if you need more support.',
      description: 'Post-delivery thank-you message.',
      enabled: true,
      id: 'msg-template-thanks',
      key: 'thank_you',
      title: 'Thank You',
      updatedAt: timestamp,
    },
  ];
}

function defaultRateTemplates(): RateTemplate[] {
  const timestamp = nowIso();
  return [
    {
      deliveryTime: '3-5 business days',
      id: 'rate-template-basic-video',
      includedServices: ['Up to 60 seconds editing', 'Basic color cleanup', '1 round of revisions'],
      messageBody: 'Basic Video Editing Package\nPrice: {{price}}\nTimeline: {{deadline}}\nIncludes: concise edit, pacing, cleanup, and one revision round.',
      priceRange: '$120 - $220',
      revisionPolicy: '1 revision round included',
      serviceType: 'Video Editing',
      title: 'Basic Video Editing Package',
      updatedAt: timestamp,
    },
    {
      deliveryTime: '5-7 business days',
      id: 'rate-template-premium-video',
      includedServices: ['Full premium edit', 'Sound polish', 'Motion titles', '2 rounds of revisions'],
      messageBody: 'Premium Video Editing Package\nPrice: {{price}}\nTimeline: {{deadline}}\nIncludes premium editing, audio polish, custom pacing, and polished titles.',
      priceRange: '$350 - $650',
      revisionPolicy: '2 revision rounds included',
      serviceType: 'Video Editing',
      title: 'Premium Video Editing Package',
      updatedAt: timestamp,
    },
    {
      deliveryTime: '4-6 business days',
      id: 'rate-template-graphic-design',
      includedServices: ['Concept design', 'Export-ready assets', '2 revisions'],
      messageBody: 'Graphic Design Package\nPrice: {{price}}\nTimeline: {{deadline}}\nIncludes creative concept work, delivery-ready files, and revision support.',
      priceRange: '$180 - $420',
      revisionPolicy: '2 revision rounds included',
      serviceType: 'Graphic Design',
      title: 'Graphic Design Package',
      updatedAt: timestamp,
    },
    {
      deliveryTime: '6-10 business days',
      id: 'rate-template-motion',
      includedServices: ['Storyboard alignment', 'Animation build', 'Export support'],
      messageBody: 'Motion Graphics Package\nPrice: {{price}}\nTimeline: {{deadline}}\nIncludes concept alignment, animation production, and export support.',
      priceRange: '$300 - $900',
      revisionPolicy: '2 revision rounds included',
      serviceType: 'Motion Graphics',
      title: 'Motion Graphics Package',
      updatedAt: timestamp,
    },
    {
      deliveryTime: 'Custom based on scope',
      id: 'rate-template-custom',
      includedServices: ['Scope discovery', 'Tailored quote', 'Milestone planning'],
      messageBody: 'Custom Project Estimate\nPrice: {{price}}\nTimeline: {{deadline}}\nThe final quote depends on scope, revisions, and delivery expectations.',
      priceRange: 'Custom quote',
      revisionPolicy: 'Defined after scope review',
      serviceType: 'Other',
      title: 'Custom Project Estimate',
      updatedAt: timestamp,
    },
  ];
}

export async function getContactLeads(supabase: SupabaseClient) {
  return sanitizeLeads(await readSettingJson(supabase, CRM_LEADS_SETTING_KEY));
}

export async function saveContactLeads(
  supabase: SupabaseClient,
  leads: ContactLead[]
) {
  await saveSettingJson(supabase, CRM_LEADS_SETTING_KEY, leads);
}

export async function getLeadById(supabase: SupabaseClient, id: string) {
  const leads = await getContactLeads(supabase);
  return leads.find(lead => lead.id === id) || null;
}

export async function createContactLead(
  supabase: SupabaseClient,
  input: ContactLeadInput
) {
  const intent = enumValue(input.intentCategory, LEAD_INTENTS, 'Work Inquiry');
  const serviceType = enumValue(input.serviceType, SERVICE_TYPES, 'Other');
  const preferredContactMethod = enumValue(
    input.preferredContactMethod,
    PREFERRED_CONTACT_METHODS,
    input.whatsappNumber || input.mobileNumber ? 'WhatsApp' : 'Email'
  );

  const lead: ContactLead = {
    archived: false,
    attachmentLink: sanitizeUrl(input.attachmentLink),
    briefId: '',
    briefStatus: 'not_sent',
    budgetRange: sanitizeSingleLine(input.budgetRange, 120),
    category: leadCategoryFromIntent(intent),
    clientId: '',
    createdAt: nowIso(),
    deadline: sanitizeProjectDate(input.deadline),
    email: sanitizeEmail(input.email),
    id: createId('lead'),
    important: false,
    intentCategory: intent,
    lastContactedAt: '',
    message: sanitizeMultiline(input.message, 4000),
    mobileNumber: sanitizePhone(input.mobileNumber),
    name: sanitizeSingleLine(input.name, 120),
    preferredContactMethod,
    priority: leadPriorityFromIntent(intent),
    projectId: '',
    projectType: sanitizeSingleLine(input.projectType, 180),
    read: false,
    serviceType,
    source: 'website-contact',
    status: 'New',
    updatedAt: nowIso(),
    whatsappNumber: sanitizePhone(input.whatsappNumber),
  };

  if (!lead.name || !lead.email || !lead.mobileNumber || !lead.message) {
    throw new Error('Name, email, mobile number, and message are required.');
  }

  const existing = await getContactLeads(supabase);
  await saveContactLeads(supabase, [lead, ...existing].slice(0, 500));
  return lead;
}

export type UpdateLeadPatch = Partial<
  Pick<
    ContactLead,
    | 'archived'
    | 'attachmentLink'
    | 'briefId'
    | 'briefStatus'
    | 'budgetRange'
    | 'category'
    | 'clientId'
    | 'deadline'
    | 'important'
    | 'lastContactedAt'
    | 'preferredContactMethod'
    | 'priority'
    | 'projectId'
    | 'projectType'
    | 'read'
    | 'serviceType'
    | 'status'
    | 'whatsappNumber'
  >
>;

export async function updateContactLead(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateLeadPatch
) {
  const leads = await getContactLeads(supabase);
  let updatedLead: ContactLead | null = null;
  const nextLeads = leads.map(lead => {
    if (lead.id !== id) {
      return lead;
    }

    const nextLead: ContactLead = {
      ...lead,
      archived:
        typeof patch.archived === 'boolean' ? patch.archived : lead.archived,
      attachmentLink:
        patch.attachmentLink !== undefined
          ? sanitizeUrl(patch.attachmentLink)
          : lead.attachmentLink,
      briefId:
        patch.briefId !== undefined
          ? sanitizeSingleLine(patch.briefId, 120)
          : lead.briefId,
      briefStatus:
        patch.briefStatus !== undefined
          ? enumValue(patch.briefStatus, BRIEF_STATUSES, lead.briefStatus)
          : lead.briefStatus,
      budgetRange:
        patch.budgetRange !== undefined
          ? sanitizeSingleLine(patch.budgetRange, 120)
          : lead.budgetRange,
      category:
        patch.category !== undefined
          ? enumValue(patch.category, LEAD_CATEGORIES, lead.category)
          : lead.category,
      clientId:
        patch.clientId !== undefined
          ? sanitizeSingleLine(patch.clientId, 120)
          : lead.clientId,
      deadline:
        patch.deadline !== undefined
          ? sanitizeProjectDate(patch.deadline)
          : lead.deadline,
      important:
        typeof patch.important === 'boolean' ? patch.important : lead.important,
      lastContactedAt:
        patch.lastContactedAt !== undefined
          ? sanitizeIsoDate(patch.lastContactedAt)
          : lead.lastContactedAt,
      preferredContactMethod:
        patch.preferredContactMethod !== undefined
          ? enumValue(
              patch.preferredContactMethod,
              PREFERRED_CONTACT_METHODS,
              lead.preferredContactMethod
            )
          : lead.preferredContactMethod,
      priority:
        patch.priority !== undefined
          ? enumValue(patch.priority, LEAD_PRIORITIES, lead.priority)
          : lead.priority,
      projectId:
        patch.projectId !== undefined
          ? sanitizeSingleLine(patch.projectId, 120)
          : lead.projectId,
      projectType:
        patch.projectType !== undefined
          ? sanitizeSingleLine(patch.projectType, 180)
          : lead.projectType,
      read: typeof patch.read === 'boolean' ? patch.read : lead.read,
      serviceType:
        patch.serviceType !== undefined
          ? enumValue(patch.serviceType, SERVICE_TYPES, lead.serviceType)
          : lead.serviceType,
      status:
        patch.status !== undefined
          ? enumValue(patch.status, LEAD_STATUSES, lead.status)
          : lead.status,
      updatedAt: nowIso(),
      whatsappNumber:
        patch.whatsappNumber !== undefined
          ? sanitizePhone(patch.whatsappNumber)
          : lead.whatsappNumber,
    };

    updatedLead = nextLead;
    return nextLead;
  });

  await saveContactLeads(supabase, nextLeads);
  return updatedLead;
}

export async function deleteContactLead(
  supabase: SupabaseClient,
  id: string
) {
  const leads = await getContactLeads(supabase);
  await saveContactLeads(
    supabase,
    leads.filter(lead => lead.id !== id)
  );
}

export async function getMessageTemplates(supabase: SupabaseClient) {
  const raw = await readSettingJson(supabase, CRM_MESSAGE_TEMPLATES_SETTING_KEY);
  const defaults = defaultMessageTemplates();

  if (!Array.isArray(raw)) {
    return defaults;
  }

  return defaults.map(defaultTemplate => {
    const stored = raw.find(
      item => isRecord(item) && sanitizeSingleLine(item.key, 120) === defaultTemplate.key
    );
    return sanitizeMessageTemplate(stored, defaultTemplate) || defaultTemplate;
  });
}

export async function saveMessageTemplates(
  supabase: SupabaseClient,
  templates: MessageTemplate[]
) {
  await saveSettingJson(supabase, CRM_MESSAGE_TEMPLATES_SETTING_KEY, templates);
}

export async function upsertMessageTemplate(
  supabase: SupabaseClient,
  template: Partial<MessageTemplate> & { key: MessageTemplateKey }
) {
  const templates = await getMessageTemplates(supabase);
  const fallback = templates.find(item => item.key === template.key);
  if (!fallback) {
    throw new Error('Template not found.');
  }

  const nextTemplate =
    sanitizeMessageTemplate(
      {
        ...fallback,
        ...template,
        updatedAt: nowIso(),
      },
      fallback
    ) || fallback;

  const nextTemplates = templates.map(item =>
    item.key === template.key ? nextTemplate : item
  );
  await saveMessageTemplates(supabase, nextTemplates);
  return nextTemplate;
}

export async function getRateTemplates(supabase: SupabaseClient) {
  const raw = await readSettingJson(supabase, CRM_RATE_TEMPLATES_SETTING_KEY);
  const defaults = defaultRateTemplates();

  if (!Array.isArray(raw)) {
    return defaults;
  }

  return defaults.map(defaultTemplate => {
    const stored = raw.find(
      item => isRecord(item) && sanitizeSingleLine(item.id, 120) === defaultTemplate.id
    );
    return sanitizeRateTemplate(stored, defaultTemplate) || defaultTemplate;
  });
}

export async function saveRateTemplates(
  supabase: SupabaseClient,
  templates: RateTemplate[]
) {
  await saveSettingJson(supabase, CRM_RATE_TEMPLATES_SETTING_KEY, templates);
}

export async function upsertRateTemplate(
  supabase: SupabaseClient,
  template: Partial<RateTemplate> & { id: string }
) {
  const templates = await getRateTemplates(supabase);
  const fallback = templates.find(item => item.id === template.id);
  if (!fallback) {
    throw new Error('Rate template not found.');
  }

  const nextTemplate =
    sanitizeRateTemplate(
      {
        ...fallback,
        ...template,
        updatedAt: nowIso(),
      },
      fallback
    ) || fallback;

  const nextTemplates = templates.map(item =>
    item.id === template.id ? nextTemplate : item
  );
  await saveRateTemplates(supabase, nextTemplates);
  return nextTemplate;
}

export async function getCreativeBriefs(supabase: SupabaseClient) {
  return sanitizeBriefs(await readSettingJson(supabase, CRM_CREATIVE_BRIEFS_SETTING_KEY));
}

export async function saveCreativeBriefs(
  supabase: SupabaseClient,
  briefs: CreativeBrief[]
) {
  await saveSettingJson(supabase, CRM_CREATIVE_BRIEFS_SETTING_KEY, briefs);
}

export async function findCreativeBriefByToken(
  supabase: SupabaseClient,
  token: string
) {
  const briefs = await getCreativeBriefs(supabase);
  return briefs.find(brief => brief.token === token) || null;
}

export async function createCreativeBriefRequest(
  supabase: SupabaseClient,
  leadId: string
) {
  const lead = await getLeadById(supabase, leadId);
  if (!lead) {
    throw new Error('Lead not found.');
  }

  const brief: CreativeBrief = {
    brandName: '',
    budget: lead.budgetRange,
    colorPreference: '',
    contactEmail: lead.email,
    contentScript: '',
    createdAt: nowIso(),
    deadline: lead.deadline,
    id: createId('brief'),
    leadId: lead.id,
    notes: '',
    openedAt: '',
    projectGoal: '',
    projectTitle: lead.projectType,
    referencesLinks: '',
    requiredFilesLinks: '',
    sentAt: nowIso(),
    serviceNeeded: lead.serviceType,
    status: 'sent',
    stylePreference: '',
    submittedAt: '',
    targetAudience: '',
    token: randomUUID().replace(/-/g, ''),
    updatedAt: nowIso(),
    whatsappNumber: lead.whatsappNumber || lead.mobileNumber,
  };

  const briefs = await getCreativeBriefs(supabase);
  await saveCreativeBriefs(supabase, [brief, ...briefs]);

  await updateContactLead(supabase, lead.id, {
    briefId: brief.id,
    briefStatus: 'sent',
    category: 'Creative Brief Needed',
    read: true,
    status: 'Brief Sent',
  });

  return brief;
}

export async function markCreativeBriefOpened(
  supabase: SupabaseClient,
  token: string
) {
  const briefs = await getCreativeBriefs(supabase);
  const briefIndex = briefs.findIndex(brief => brief.token === token);
  if (briefIndex === -1) {
    return null;
  }

  const currentBrief = briefs[briefIndex];
  const updatedBrief: CreativeBrief = {
    ...currentBrief,
    openedAt: currentBrief.openedAt || nowIso(),
    status: currentBrief.status === 'submitted' ? 'submitted' : 'opened',
    updatedAt: nowIso(),
  };
  const nextBriefs = briefs.map((brief, index) =>
    index === briefIndex ? updatedBrief : brief
  );

  await saveCreativeBriefs(supabase, nextBriefs);
  if (updatedBrief.leadId) {
    await updateContactLead(supabase, updatedBrief.leadId, {
      briefStatus: updatedBrief.status === 'submitted' ? 'submitted' : 'opened',
      category: 'Creative Brief Needed',
      status: updatedBrief.status === 'submitted' ? 'Brief Submitted' : 'Brief Opened',
    });
  }

  return updatedBrief;
}

export type SubmitCreativeBriefInput = Pick<
  CreativeBrief,
  | 'brandName'
  | 'budget'
  | 'colorPreference'
  | 'contentScript'
  | 'deadline'
  | 'notes'
  | 'projectGoal'
  | 'projectTitle'
  | 'referencesLinks'
  | 'requiredFilesLinks'
  | 'serviceNeeded'
  | 'stylePreference'
  | 'targetAudience'
  | 'whatsappNumber'
>;

export async function submitCreativeBrief(
  supabase: SupabaseClient,
  token: string,
  input: SubmitCreativeBriefInput
) {
  const briefs = await getCreativeBriefs(supabase);
  const briefIndex = briefs.findIndex(brief => brief.token === token);
  if (briefIndex === -1) {
    throw new Error('Creative brief not found.');
  }

  const currentBrief = briefs[briefIndex];
  const updatedBrief: CreativeBrief = {
    ...currentBrief,
    brandName: sanitizeSingleLine(input.brandName, 160),
    budget: sanitizeSingleLine(input.budget, 120),
    colorPreference: sanitizeSingleLine(input.colorPreference, 220),
    contentScript: sanitizeMultiline(input.contentScript, 4000),
    deadline: sanitizeProjectDate(input.deadline),
    notes: sanitizeMultiline(input.notes, 4000),
    openedAt: currentBrief.openedAt || nowIso(),
    projectGoal: sanitizeMultiline(input.projectGoal, 1200),
    projectTitle: sanitizeSingleLine(input.projectTitle, 180),
    referencesLinks: sanitizeMultiline(input.referencesLinks, 2000),
    requiredFilesLinks: sanitizeMultiline(input.requiredFilesLinks, 2000),
    serviceNeeded: sanitizeSingleLine(input.serviceNeeded, 160),
    status: 'submitted',
    stylePreference: sanitizeSingleLine(input.stylePreference, 220),
    submittedAt: nowIso(),
    targetAudience: sanitizeMultiline(input.targetAudience, 1200),
    updatedAt: nowIso(),
    whatsappNumber: sanitizePhone(input.whatsappNumber),
  };
  const nextBriefs = briefs.map((brief, index) =>
    index === briefIndex ? updatedBrief : brief
  );

  await saveCreativeBriefs(supabase, nextBriefs);
  if (updatedBrief.leadId) {
    await updateContactLead(supabase, updatedBrief.leadId, {
      briefStatus: 'submitted',
      category: 'Creative Brief Needed',
      status: 'Brief Submitted',
    });
  }

  const projects = await getProjects(supabase);
  const matchedProject = projects.find(project => project.leadId === updatedBrief?.leadId);
  if (matchedProject) {
    await updateProject(supabase, matchedProject.id, {
      currentStatus: 'Brief Received',
      nextStep:
        matchedProject.nextStep || 'Review the submitted brief and confirm the scope.',
      requirements:
        matchedProject.requirements ||
        [updatedBrief.projectGoal, updatedBrief.targetAudience]
          .filter(Boolean)
          .join('\n\n'),
    });
  }

  return updatedBrief;
}

export async function getClientAccounts(supabase: SupabaseClient) {
  return sanitizeClients(await readSettingJson(supabase, CRM_CLIENTS_SETTING_KEY));
}

export async function saveClientAccounts(
  supabase: SupabaseClient,
  clients: ClientAccount[]
) {
  await saveSettingJson(supabase, CRM_CLIENTS_SETTING_KEY, clients);
}

export async function findClientAccountById(
  supabase: SupabaseClient,
  clientId: string
) {
  const clients = await getClientAccounts(supabase);
  return clients.find(client => client.id === clientId) || null;
}

export async function createOrRefreshClientPortalAccess(
  supabase: SupabaseClient,
  lead: ContactLead,
  preferredAccessCode?: string
) {
  const clients = await getClientAccounts(supabase);
  const email = lead.email.toLowerCase();
  const phone = getLeadPreferredNumber(lead);
  const existingClient =
    clients.find(client => client.email && client.email === email) ||
    clients.find(client => getLeadPreferredNumber(client) === phone);

  const accessCode =
    preferredAccessCode || existingClient?.portalAccessCode || generateClientAccessCode();
  const issuedAt = nowIso();

  const nextClient: ClientAccount = existingClient
    ? {
        ...existingClient,
        accessCodeHash: hashAccessCode(accessCode),
        active: true,
        authVersion: existingClient.authVersion + 1,
        email,
        fullName: lead.name,
        lastLeadId: lead.id,
        mobileNumber: lead.mobileNumber,
        portalAccessCode: accessCode,
        portalAccessIssuedAt: issuedAt,
        updatedAt: nowIso(),
        whatsappNumber: lead.whatsappNumber || lead.mobileNumber,
      }
    : {
        accessCodeHash: hashAccessCode(accessCode),
        active: true,
        authVersion: 1,
        createdAt: nowIso(),
        email,
        fullName: lead.name,
        id: createId('client'),
        lastLeadId: lead.id,
        lastLoginAt: '',
        mobileNumber: lead.mobileNumber,
        portalAccessCode: accessCode,
        portalAccessIssuedAt: issuedAt,
        projectIds: [],
        updatedAt: nowIso(),
        whatsappNumber: lead.whatsappNumber || lead.mobileNumber,
      };

  const nextClients = existingClient
    ? clients.map(client => (client.id === nextClient.id ? nextClient : client))
    : [nextClient, ...clients];

  await saveClientAccounts(supabase, nextClients);

  return {
    accessCode,
    client: nextClient,
  };
}

export async function markClientLogin(
  supabase: SupabaseClient,
  clientId: string
) {
  const clients = await getClientAccounts(supabase);
  const nextClients = clients.map(client =>
    client.id === clientId
      ? { ...client, lastLoginAt: nowIso(), updatedAt: nowIso() }
      : client
  );
  await saveClientAccounts(supabase, nextClients);
}

export async function getProjects(supabase: SupabaseClient) {
  return sanitizeProjects(await readSettingJson(supabase, CRM_PROJECTS_SETTING_KEY));
}

export async function saveProjects(
  supabase: SupabaseClient,
  projects: ClientProject[]
) {
  await saveSettingJson(supabase, CRM_PROJECTS_SETTING_KEY, projects);
}

export async function getProjectById(supabase: SupabaseClient, projectId: string) {
  const projects = await getProjects(supabase);
  return projects.find(project => project.id === projectId) || null;
}

export async function getProjectMilestones(supabase: SupabaseClient) {
  return sanitizeMilestones(
    await readSettingJson(supabase, CRM_PROJECT_MILESTONES_SETTING_KEY)
  );
}

export async function saveProjectMilestones(
  supabase: SupabaseClient,
  milestones: ProjectMilestone[]
) {
  await saveSettingJson(supabase, CRM_PROJECT_MILESTONES_SETTING_KEY, milestones);
}

export async function getProjectUpdates(supabase: SupabaseClient) {
  return sanitizeProjectUpdates(
    await readSettingJson(supabase, CRM_PROJECT_UPDATES_SETTING_KEY)
  );
}

export async function saveProjectUpdates(
  supabase: SupabaseClient,
  updates: ProjectUpdate[]
) {
  await saveSettingJson(supabase, CRM_PROJECT_UPDATES_SETTING_KEY, updates);
}

export async function createProjectFromLead(
  supabase: SupabaseClient,
  input: CreateProjectFromLeadInput
) {
  const lead = await getLeadById(supabase, input.leadId);
  if (!lead) {
    throw new Error('Lead not found.');
  }

  const serviceType = enumValue(
    input.serviceType,
    SERVICE_TYPES,
    lead.serviceType || 'Other'
  );
  const existingProjects = await getProjects(supabase);
  const nextProjectSerial =
    existingProjects.reduce(
      (highestSerial, project, index) =>
        Math.max(highestSerial, project.projectSerial || 0, index + 1),
      0
    ) + 1;
  const accessCode = generateClientAccessCode(nextProjectSerial, serviceType);
  const { client } = await createOrRefreshClientPortalAccess(supabase, lead, accessCode);
  const project: ClientProject = {
    budgetPrice: sanitizeSingleLine(input.budgetPrice, 120) || lead.budgetRange,
    clientEmail: lead.email,
    clientId: client.id,
    clientName: lead.name,
    clientVisibleNotes: sanitizeMultiline(input.clientVisibleNotes, 4000),
    createdAt: nowIso(),
    currentStatus: enumValue(input.currentStatus, PROJECT_STATUSES, 'Accepted'),
    deadline: sanitizeProjectDate(input.deadline) || lead.deadline,
    id: createId('project'),
    leadId: lead.id,
    mobileNumber: lead.mobileNumber,
    nextStep:
      sanitizeSingleLine(input.nextStep, 220) ||
      'Kick off the project and confirm the first delivery milestone.',
    paymentStatus: enumValue(input.paymentStatus, PAYMENT_STATUSES, 'Pending'),
    privateAdminNotes: sanitizeMultiline(input.privateAdminNotes, 4000),
    progressPercentage: Math.min(
      100,
      Math.max(0, numberValue(input.progressPercentage, 10))
    ),
    projectSerial: nextProjectSerial,
    projectTitle: sanitizeSingleLine(input.projectTitle, 180),
    requirements: sanitizeMultiline(input.requirements, 4000),
    resources: [],
    serviceType,
    updatedAt: nowIso(),
    whatsappNumber: lead.whatsappNumber || lead.mobileNumber,
  };

  const [milestones, updates, clients] = await Promise.all([
    getProjectMilestones(supabase),
    getProjectUpdates(supabase),
    getClientAccounts(supabase),
  ]);

  const nextProjects = [project, ...existingProjects];
  const nextMilestones: ProjectMilestone[] = [
    {
      clientVisible: true,
      description: 'Project kickoff, scope alignment, and production setup.',
      dueDate: project.deadline,
      id: createId('milestone'),
      order: 1,
      projectId: project.id,
      status: 'Pending',
      title: 'Kickoff & Creative Alignment',
      updatedAt: nowIso(),
    },
    ...milestones,
  ];
  const nextUpdates: ProjectUpdate[] = [
    {
      body: 'Project created from inbox lead and portal access prepared for the client.',
      createdAt: nowIso(),
      id: createId('update'),
      progressSnapshot: project.progressPercentage,
      projectId: project.id,
      statusSnapshot: project.currentStatus,
      title: 'Project created',
      type: 'note',
      visibility: 'admin',
    },
    ...updates,
  ];
  const nextClients = clients.map(existingClient =>
    existingClient.id === client.id
      ? {
          ...existingClient,
          projectIds: dedupeStrings([...existingClient.projectIds, project.id]),
          updatedAt: nowIso(),
        }
      : existingClient
  );

  await Promise.all([
    saveProjects(supabase, nextProjects),
    saveProjectMilestones(supabase, nextMilestones),
    saveProjectUpdates(supabase, nextUpdates),
    saveClientAccounts(supabase, nextClients),
    updateContactLead(supabase, lead.id, {
      category: 'Active Project',
      clientId: client.id,
      projectId: project.id,
      read: true,
      status: 'Project Created',
    }),
  ]);

  return {
    accessCode,
    client,
    project,
  };
}

export async function ensureLeadPortalAccess(
  supabase: SupabaseClient,
  leadId: string,
  forceRegenerate = false
) {
  const lead = await getLeadById(supabase, leadId);
  if (!lead) {
    throw new Error('Lead not found.');
  }

  const [clients, projects] = await Promise.all([
    getClientAccounts(supabase),
    getProjects(supabase),
  ]);

  const project =
    projects.find(item => item.id === lead.projectId) ||
    projects.find(item => item.leadId === lead.id) ||
    null;

  if (!project) {
    throw new Error('Create the project before sending portal access.');
  }

  const client =
    clients.find(item => item.id === project.clientId || item.id === lead.clientId) ||
    clients.find(item => item.email && item.email === lead.email.toLowerCase()) ||
    clients.find(item => getLeadPreferredNumber(item) === getLeadPreferredNumber(lead)) ||
    null;

  if (client?.portalAccessCode && !forceRegenerate) {
    return {
      accessCode: client.portalAccessCode,
      client,
      project,
    };
  }

  const accessCode = generateClientAccessCode(
    project.projectSerial || 1,
    project.serviceType || lead.serviceType
  );
  const { client: refreshedClient } = await createOrRefreshClientPortalAccess(
    supabase,
    lead,
    accessCode
  );

  const projectNeedsLinkUpdate = project.clientId !== refreshedClient.id;
  const leadNeedsLinkUpdate =
    lead.clientId !== refreshedClient.id || lead.projectId !== project.id;

  if (projectNeedsLinkUpdate) {
    await saveProjects(
      supabase,
      projects.map(item =>
        item.id === project.id
          ? {
              ...item,
              clientId: refreshedClient.id,
              updatedAt: nowIso(),
            }
          : item
      )
    );
  }

  if (leadNeedsLinkUpdate) {
    await updateContactLead(supabase, lead.id, {
      clientId: refreshedClient.id,
      projectId: project.id,
    });
  }

  return {
    accessCode,
    client: refreshedClient,
    project: projectNeedsLinkUpdate
      ? {
          ...project,
          clientId: refreshedClient.id,
          updatedAt: nowIso(),
        }
      : project,
  };
}

export type UpdateProjectPatch = Partial<
  Pick<
    ClientProject,
    | 'budgetPrice'
    | 'clientVisibleNotes'
    | 'currentStatus'
    | 'deadline'
    | 'nextStep'
    | 'paymentStatus'
    | 'privateAdminNotes'
    | 'progressPercentage'
    | 'projectTitle'
    | 'requirements'
    | 'resources'
    | 'serviceType'
  >
>;

export async function updateProject(
  supabase: SupabaseClient,
  projectId: string,
  patch: UpdateProjectPatch
) {
  const projects = await getProjects(supabase);
  const projectIndex = projects.findIndex(project => project.id === projectId);
  if (projectIndex === -1) {
    return null;
  }

  const currentProject = projects[projectIndex];
  const updatedProject: ClientProject = {
    ...currentProject,
    budgetPrice:
      patch.budgetPrice !== undefined
        ? sanitizeSingleLine(patch.budgetPrice, 120)
        : currentProject.budgetPrice,
    clientVisibleNotes:
      patch.clientVisibleNotes !== undefined
        ? sanitizeMultiline(patch.clientVisibleNotes, 4000)
        : currentProject.clientVisibleNotes,
    currentStatus:
      patch.currentStatus !== undefined
        ? enumValue(patch.currentStatus, PROJECT_STATUSES, currentProject.currentStatus)
        : currentProject.currentStatus,
    deadline:
      patch.deadline !== undefined
        ? sanitizeProjectDate(patch.deadline)
        : currentProject.deadline,
    nextStep:
      patch.nextStep !== undefined
        ? sanitizeSingleLine(patch.nextStep, 220)
        : currentProject.nextStep,
    paymentStatus:
      patch.paymentStatus !== undefined
        ? enumValue(patch.paymentStatus, PAYMENT_STATUSES, currentProject.paymentStatus)
        : currentProject.paymentStatus,
    privateAdminNotes:
      patch.privateAdminNotes !== undefined
        ? sanitizeMultiline(patch.privateAdminNotes, 4000)
        : currentProject.privateAdminNotes,
    progressPercentage:
      patch.progressPercentage !== undefined
        ? Math.min(
            100,
            Math.max(
              0,
              numberValue(patch.progressPercentage, currentProject.progressPercentage)
            )
          )
        : currentProject.progressPercentage,
    projectTitle:
      patch.projectTitle !== undefined
        ? sanitizeSingleLine(patch.projectTitle, 180)
        : currentProject.projectTitle,
    requirements:
      patch.requirements !== undefined
        ? sanitizeMultiline(patch.requirements, 4000)
        : currentProject.requirements,
    resources:
      patch.resources !== undefined
        ? patch.resources
            .map(sanitizeResource)
            .filter((item): item is ProjectResource => Boolean(item))
        : currentProject.resources,
    serviceType:
      patch.serviceType !== undefined
        ? enumValue(patch.serviceType, SERVICE_TYPES, currentProject.serviceType)
        : currentProject.serviceType,
    updatedAt: nowIso(),
  };
  const nextProjects = projects.map((project, index) =>
    index === projectIndex ? updatedProject : project
  );

  await saveProjects(supabase, nextProjects);

  if (updatedProject?.currentStatus === 'Completed') {
    await updateContactLead(supabase, updatedProject.leadId, {
      category: 'Completed',
      status: 'Completed',
    });
  }

  return updatedProject;
}

export async function upsertProjectMilestone(
  supabase: SupabaseClient,
  milestone: Partial<ProjectMilestone> & { projectId: string }
) {
  const milestones = await getProjectMilestones(supabase);
  const nextMilestone: ProjectMilestone = {
    clientVisible: boolValue(milestone.clientVisible, true),
    description: sanitizeSingleLine(milestone.description, 320),
    dueDate: sanitizeProjectDate(milestone.dueDate),
    id: sanitizeSingleLine(milestone.id, 120) || createId('milestone'),
    order: Math.max(1, numberValue(milestone.order, 1)),
    projectId: sanitizeSingleLine(milestone.projectId, 120),
    status: enumValue(milestone.status, MILESTONE_STATUSES, 'Pending'),
    title: sanitizeSingleLine(milestone.title, 140),
    updatedAt: nowIso(),
  };

  const exists = milestones.some(item => item.id === nextMilestone.id);
  const nextMilestones = exists
    ? milestones.map(item => (item.id === nextMilestone.id ? nextMilestone : item))
    : [...milestones, nextMilestone];

  await saveProjectMilestones(supabase, nextMilestones);
  return nextMilestone;
}

export async function deleteProjectMilestone(
  supabase: SupabaseClient,
  milestoneId: string
) {
  const milestones = await getProjectMilestones(supabase);
  await saveProjectMilestones(
    supabase,
    milestones.filter(item => item.id !== milestoneId)
  );
}

export async function createProjectUpdate(
  supabase: SupabaseClient,
  input: Omit<ProjectUpdate, 'createdAt' | 'id'>
) {
  const update: ProjectUpdate = {
    ...input,
    body: sanitizeMultiline(input.body, 4000),
    createdAt: nowIso(),
    id: createId('update'),
    progressSnapshot: Math.min(100, Math.max(0, numberValue(input.progressSnapshot, 0))),
    statusSnapshot: enumValue(input.statusSnapshot, PROJECT_STATUSES, 'New'),
    title: sanitizeSingleLine(input.title, 160),
    type: enumValue(input.type, PROJECT_UPDATE_TYPES, 'note'),
    visibility: enumValue(input.visibility, ['admin', 'client'] as const, 'admin'),
  };

  const updates = await getProjectUpdates(supabase);
  await saveProjectUpdates(supabase, [update, ...updates]);
  return update;
}

export async function getClientPortalData(
  supabase: SupabaseClient,
  clientId: string
) {
  const [client, projects, milestones, updates] = await Promise.all([
    findClientAccountById(supabase, clientId),
    getProjects(supabase),
    getProjectMilestones(supabase),
    getProjectUpdates(supabase),
  ]);

  if (!client || !client.active) {
    return null;
  }

  const clientProjects = projects.filter(project => project.clientId === clientId);

  return {
    client: {
      email: client.email,
      fullName: client.fullName,
      id: client.id,
      lastLoginAt: client.lastLoginAt,
    } satisfies ClientPortalProfile,
    milestones: milestones.filter(
      milestone =>
        clientProjects.some(project => project.id === milestone.projectId) &&
        milestone.clientVisible
    ),
    projects: clientProjects,
    updates: updates.filter(
      update =>
        clientProjects.some(project => project.id === update.projectId) &&
        update.visibility === 'client'
    ),
  };
}
