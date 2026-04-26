import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeWhatsAppNumber } from '@/lib/crm-shared';

type TwilioWhatsAppConfig = {
  accountSid: string;
  authToken: string;
  from: string;
};

export type WhatsAppProviderStatus = {
  configured: boolean;
  provider: 'twilio' | null;
  source: 'env' | 'runtime' | null;
};

export type WhatsAppSendResult = {
  messageId: string;
  provider: 'twilio';
  status: string;
};

const RUNTIME_CONFIG_PATH = path.join(
  process.cwd(),
  '.runtime',
  'whatsapp-config.json'
);

async function readRuntimeTwilioConfig(): Promise<TwilioWhatsAppConfig | null> {
  try {
    const raw = await readFile(RUNTIME_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<TwilioWhatsAppConfig>;

    const accountSid = parsed.accountSid?.trim() || '';
    const authToken = parsed.authToken?.trim() || '';
    const from = parsed.from?.trim() || '';

    if (!accountSid || !authToken || !from) {
      return null;
    }

    return { accountSid, authToken, from };
  } catch {
    return null;
  }
}

function getTwilioConfig(): TwilioWhatsAppConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() || '';
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim() || '';

  if (!accountSid || !authToken || !from) {
    return null;
  }

  return { accountSid, authToken, from };
}

export async function saveRuntimeTwilioConfig(config: TwilioWhatsAppConfig) {
  await mkdir(path.dirname(RUNTIME_CONFIG_PATH), { recursive: true });
  await writeFile(RUNTIME_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

export async function clearRuntimeTwilioConfig() {
  await rm(RUNTIME_CONFIG_PATH, { force: true });
}

export async function getWhatsAppProviderStatus(): Promise<WhatsAppProviderStatus> {
  const envConfig = getTwilioConfig();
  if (envConfig) {
    return {
      configured: true,
      provider: 'twilio',
      source: 'env',
    };
  }

  const runtimeConfig = await readRuntimeTwilioConfig();
  return {
    configured: Boolean(runtimeConfig),
    provider: runtimeConfig ? ('twilio' as const) : null,
    source: runtimeConfig ? 'runtime' : null,
  };
}

async function getResolvedTwilioConfig() {
  const envConfig = getTwilioConfig();
  if (envConfig) {
    return envConfig;
  }

  return readRuntimeTwilioConfig();
}

export async function sendWhatsAppMessage(input: {
  body: string;
  to: string;
}): Promise<WhatsAppSendResult> {
  const twilio = await getResolvedTwilioConfig();
  if (!twilio) {
    throw new Error(
      'Direct WhatsApp sending is not configured. Add Twilio credentials from admin or environment variables.'
    );
  }

  const normalizedTo = normalizeWhatsAppNumber(input.to);
  if (!normalizedTo) {
    throw new Error('No valid WhatsApp number found for this lead.');
  }

  const body = input.body.trim();
  if (!body) {
    throw new Error('WhatsApp message body is empty.');
  }

  const auth = Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString('base64');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: new URLSearchParams({
        Body: body,
        From: `whatsapp:${twilio.from}`,
        To: `whatsapp:+${normalizedTo}`,
      }),
    }
  );

  const result = (await response.json()) as {
    code?: number;
    message?: string;
    sid?: string;
    status?: string;
  };

  if (!response.ok || !result.sid) {
    throw new Error(result.message || 'Failed to send the WhatsApp message.');
  }

  return {
    messageId: result.sid,
    provider: 'twilio',
    status: result.status || 'queued',
  };
}
