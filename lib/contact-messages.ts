import type { SupabaseClient } from '@supabase/supabase-js';
import { writeSiteSetting } from '@/lib/site-settings';

export const CONTACT_MESSAGES_SETTING_KEY = 'contact_messages_store';

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
  archived: boolean;
};

export type ContactMessageInput = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function sanitizeMessages(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ContactMessage[];
  }

  return value
    .filter(isRecord)
    .map(item => ({
      id: text(item.id),
      name: text(item.name),
      email: text(item.email),
      subject: text(item.subject),
      message: text(item.message),
      createdAt: text(item.createdAt),
      read: bool(item.read, false),
      archived: bool(item.archived, false),
    }))
    .filter(item => item.id && item.name && item.email && item.message && item.createdAt)
    .sort((leftItem, rightItem) => rightItem.createdAt.localeCompare(leftItem.createdAt))
    .slice(0, 300);
}

export function serializeContactMessages(messages: ContactMessage[]) {
  return JSON.stringify(messages);
}

export async function getContactMessages(
  supabase: SupabaseClient
): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', CONTACT_MESSAGES_SETTING_KEY)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.value) {
    return [];
  }

  try {
    return sanitizeMessages(JSON.parse(data.value));
  } catch {
    return [];
  }
}

export async function saveContactMessages(
  supabase: SupabaseClient,
  messages: ContactMessage[]
) {
  await writeSiteSetting(
    supabase,
    CONTACT_MESSAGES_SETTING_KEY,
    serializeContactMessages(messages)
  );
}

export async function createContactMessage(
  supabase: SupabaseClient,
  input: ContactMessageInput
) {
  const nextMessage: ContactMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    email: input.email.trim(),
    subject: (input.subject || '').trim(),
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
    read: false,
    archived: false,
  };

  const existing = await getContactMessages(supabase);
  const nextMessages = [nextMessage, ...existing].slice(0, 300);
  await saveContactMessages(supabase, nextMessages);

  return nextMessage;
}

export async function updateContactMessage(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<ContactMessage, 'read' | 'archived'>>
) {
  const messages = await getContactMessages(supabase);
  const nextMessages = messages.map(message =>
    message.id === id ? { ...message, ...patch } : message
  );
  await saveContactMessages(supabase, nextMessages);
  return nextMessages.find(message => message.id === id) || null;
}

export async function deleteContactMessage(
  supabase: SupabaseClient,
  id: string
) {
  const messages = await getContactMessages(supabase);
  const nextMessages = messages.filter(message => message.id !== id);
  await saveContactMessages(supabase, nextMessages);
}
