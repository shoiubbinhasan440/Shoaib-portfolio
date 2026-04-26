import { getFirstSetting, type SettingMap } from '@/lib/hero-settings';
import {
  createDefaultBuilderSectionStyles,
  sanitizeBuilderSectionStyles,
  type BuilderSectionStyles,
} from '@/lib/page-builder-styles';

export const CONTACT_PAGE_SETTING_KEY = 'contact_page_config';

export type ContactAlignment = 'left' | 'center';
export type ContactWidthPreset = 'normal' | 'wide' | 'full';
export type ContactSpacingPreset = 'compact' | 'balanced' | 'spacious';
export type ContactLayoutMode =
  | 'split'
  | 'stacked'
  | 'centered'
  | 'card-left'
  | 'card-right';

export type ContactLinkItem = {
  id: string;
  label: string;
  url: string;
  icon?: string;
  enabled: boolean;
  order: number;
};

export type ContactInfoCard = {
  id: string;
  icon?: string;
  title: string;
  value: string;
  href?: string;
  description?: string;
  enabled: boolean;
  order: number;
};

export type ContactHeroSection = {
  enabled: boolean;
  order: number;
  layout: ContactLayoutMode;
  alignment: ContactAlignment;
  width: ContactWidthPreset;
  spacing: ContactSpacingPreset;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  showPrimaryButton: boolean;
  primaryButtonText: string;
  primaryButtonLink: string;
  showSecondaryButton: boolean;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  styles: BuilderSectionStyles;
};

export type ContactFormSection = {
  enabled: boolean;
  order: number;
  layout: ContactLayoutMode;
  alignment: ContactAlignment;
  width: ContactWidthPreset;
  spacing: ContactSpacingPreset;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  formLabel: string;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
  successTitle: string;
  successMessage: string;
  showSubjectField: boolean;
  showInfoCards: boolean;
  showSocialLinks: boolean;
  showAvailabilityCard: boolean;
  availabilityTitle: string;
  availabilityText: string;
  infoCards: ContactInfoCard[];
  socialLinks: ContactLinkItem[];
  styles: BuilderSectionStyles;
};

export type ContactExtraSection = {
  enabled: boolean;
  order: number;
  layout: ContactLayoutMode;
  alignment: ContactAlignment;
  width: ContactWidthPreset;
  spacing: ContactSpacingPreset;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  showButton: boolean;
  buttonText: string;
  buttonLink: string;
  styles: BuilderSectionStyles;
};

export type ContactCtaSection = {
  enabled: boolean;
  order: number;
  layout: ContactLayoutMode;
  alignment: ContactAlignment;
  width: ContactWidthPreset;
  spacing: ContactSpacingPreset;
  label: string;
  title: string;
  description: string;
  showPrimaryButton: boolean;
  primaryButtonText: string;
  primaryButtonLink: string;
  showSecondaryButton: boolean;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  styles: BuilderSectionStyles;
};

export type ContactPageConfig = {
  pageEnabled: boolean;
  hero: ContactHeroSection;
  formSection: ContactFormSection;
  extraSection: ContactExtraSection;
  cta: ContactCtaSection;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function num(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function widthPreset(
  value: unknown,
  fallback: ContactWidthPreset
): ContactWidthPreset {
  return value === 'normal' || value === 'wide' || value === 'full' ? value : fallback;
}

function spacingPreset(
  value: unknown,
  fallback: ContactSpacingPreset
): ContactSpacingPreset {
  return value === 'compact' || value === 'balanced' || value === 'spacious'
    ? value
    : fallback;
}

function alignment(
  value: unknown,
  fallback: ContactAlignment
): ContactAlignment {
  return value === 'left' || value === 'center' ? value : fallback;
}

function layout(
  value: unknown,
  fallback: ContactLayoutMode
): ContactLayoutMode {
  return value === 'split' ||
    value === 'stacked' ||
    value === 'centered' ||
    value === 'card-left' ||
    value === 'card-right'
    ? value
    : fallback;
}

function sanitizeLinks(
  value: unknown,
  fallback: ContactLinkItem[]
): ContactLinkItem[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: text(item.id, fallback[index]?.id || `social-${index + 1}`),
      label: text(item.label, fallback[index]?.label || ''),
      url: text(item.url, fallback[index]?.url || ''),
      icon: text(item.icon, fallback[index]?.icon || ''),
      enabled: bool(item.enabled, fallback[index]?.enabled ?? true),
      order: Math.max(1, num(item.order, fallback[index]?.order ?? index + 1)),
    }))
    .sort((leftItem, rightItem) => leftItem.order - rightItem.order);
}

function sanitizeCards(
  value: unknown,
  fallback: ContactInfoCard[]
): ContactInfoCard[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: text(item.id, fallback[index]?.id || `contact-${index + 1}`),
      icon: text(item.icon, fallback[index]?.icon || ''),
      title: text(item.title, fallback[index]?.title || ''),
      value: text(item.value, fallback[index]?.value || ''),
      href: text(item.href, fallback[index]?.href || ''),
      description: text(item.description, fallback[index]?.description || ''),
      enabled: bool(item.enabled, fallback[index]?.enabled ?? true),
      order: Math.max(1, num(item.order, fallback[index]?.order ?? index + 1)),
    }))
    .sort((leftItem, rightItem) => leftItem.order - rightItem.order);
}

function sanitizeHero(
  value: unknown,
  fallback: ContactHeroSection
): ContactHeroSection {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: Math.max(1, Math.min(100, num(value.order, fallback.order))),
    layout: layout(value.layout, fallback.layout),
    alignment: alignment(value.alignment, fallback.alignment),
    width: widthPreset(value.width, fallback.width),
    spacing: spacingPreset(value.spacing, fallback.spacing),
    label: text(value.label, fallback.label),
    title: text(value.title, fallback.title),
    subtitle: text(value.subtitle, fallback.subtitle),
    description: text(value.description, fallback.description),
    showPrimaryButton: bool(value.showPrimaryButton, fallback.showPrimaryButton),
    primaryButtonText: text(value.primaryButtonText, fallback.primaryButtonText),
    primaryButtonLink: text(value.primaryButtonLink, fallback.primaryButtonLink),
    showSecondaryButton: bool(value.showSecondaryButton, fallback.showSecondaryButton),
    secondaryButtonText: text(value.secondaryButtonText, fallback.secondaryButtonText),
    secondaryButtonLink: text(value.secondaryButtonLink, fallback.secondaryButtonLink),
    styles: sanitizeBuilderSectionStyles(value.styles, fallback.styles),
  };
}

function sanitizeFormSection(
  value: unknown,
  fallback: ContactFormSection
): ContactFormSection {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: Math.max(1, Math.min(100, num(value.order, fallback.order))),
    layout: layout(value.layout, fallback.layout),
    alignment: alignment(value.alignment, fallback.alignment),
    width: widthPreset(value.width, fallback.width),
    spacing: spacingPreset(value.spacing, fallback.spacing),
    label: text(value.label, fallback.label),
    title: text(value.title, fallback.title),
    subtitle: text(value.subtitle, fallback.subtitle),
    description: text(value.description, fallback.description),
    formLabel: text(value.formLabel, fallback.formLabel),
    formTitle: text(value.formTitle, fallback.formTitle),
    formDescription: text(value.formDescription, fallback.formDescription),
    submitButtonText: text(value.submitButtonText, fallback.submitButtonText),
    successTitle: text(value.successTitle, fallback.successTitle),
    successMessage: text(value.successMessage, fallback.successMessage),
    showSubjectField: bool(value.showSubjectField, fallback.showSubjectField),
    showInfoCards: bool(value.showInfoCards, fallback.showInfoCards),
    showSocialLinks: bool(value.showSocialLinks, fallback.showSocialLinks),
    showAvailabilityCard: bool(value.showAvailabilityCard, fallback.showAvailabilityCard),
    availabilityTitle: text(value.availabilityTitle, fallback.availabilityTitle),
    availabilityText: text(value.availabilityText, fallback.availabilityText),
    infoCards: sanitizeCards(value.infoCards, fallback.infoCards),
    socialLinks: sanitizeLinks(value.socialLinks, fallback.socialLinks),
    styles: sanitizeBuilderSectionStyles(value.styles, fallback.styles),
  };
}

function sanitizeExtraSection(
  value: unknown,
  fallback: ContactExtraSection
): ContactExtraSection {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: Math.max(1, Math.min(100, num(value.order, fallback.order))),
    layout: layout(value.layout, fallback.layout),
    alignment: alignment(value.alignment, fallback.alignment),
    width: widthPreset(value.width, fallback.width),
    spacing: spacingPreset(value.spacing, fallback.spacing),
    label: text(value.label, fallback.label),
    title: text(value.title, fallback.title),
    subtitle: text(value.subtitle, fallback.subtitle),
    description: text(value.description, fallback.description),
    image: text(value.image, fallback.image),
    showButton: bool(value.showButton, fallback.showButton),
    buttonText: text(value.buttonText, fallback.buttonText),
    buttonLink: text(value.buttonLink, fallback.buttonLink),
    styles: sanitizeBuilderSectionStyles(value.styles, fallback.styles),
  };
}

function sanitizeCta(
  value: unknown,
  fallback: ContactCtaSection
): ContactCtaSection {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: Math.max(1, Math.min(100, num(value.order, fallback.order))),
    layout: layout(value.layout, fallback.layout),
    alignment: alignment(value.alignment, fallback.alignment),
    width: widthPreset(value.width, fallback.width),
    spacing: spacingPreset(value.spacing, fallback.spacing),
    label: text(value.label, fallback.label),
    title: text(value.title, fallback.title),
    description: text(value.description, fallback.description),
    showPrimaryButton: bool(value.showPrimaryButton, fallback.showPrimaryButton),
    primaryButtonText: text(value.primaryButtonText, fallback.primaryButtonText),
    primaryButtonLink: text(value.primaryButtonLink, fallback.primaryButtonLink),
    showSecondaryButton: bool(value.showSecondaryButton, fallback.showSecondaryButton),
    secondaryButtonText: text(value.secondaryButtonText, fallback.secondaryButtonText),
    secondaryButtonLink: text(value.secondaryButtonLink, fallback.secondaryButtonLink),
    styles: sanitizeBuilderSectionStyles(value.styles, fallback.styles),
  };
}

export function createDefaultContactPageConfig(
  map: SettingMap = {}
): ContactPageConfig {
  const email = getFirstSetting(map, 'contact_email') || 'hello@minhajulhoque.com';
  const phone = getFirstSetting(map, 'contact_phone') || '+880 1700-000000';

  return {
    pageEnabled: true,
    hero: {
      enabled: true,
      order: 10,
      layout: 'centered',
      alignment: 'center',
      width: 'wide',
      spacing: 'balanced',
      label: 'Contact Studio',
      title: 'চলুন আপনার next visual project শুরু করি',
      subtitle: 'Creative collaborations, commercial edits, branding visuals and premium content systems.',
      description:
        'ব্র্যান্ড, creator, agency বা personal project — brief clear হলে আমি polished delivery, clean communication এবং premium presentation-এ কাজ করি।',
      showPrimaryButton: true,
      primaryButtonText: 'বার্তা পাঠান',
      primaryButtonLink: '#contact-form',
      showSecondaryButton: true,
      secondaryButtonText: 'Portfolio দেখুন',
      secondaryButtonLink: '/portfolio',
      styles: createDefaultBuilderSectionStyles(),
    },
    formSection: {
      enabled: true,
      order: 20,
      layout: 'split',
      alignment: 'left',
      width: 'wide',
      spacing: 'balanced',
      label: 'Direct Contact',
      title: 'কীভাবে reach করতে পারবেন',
      subtitle: 'Fast reply, clear process, and structured collaboration.',
      description:
        'নিচের form ব্যবহার করতে পারেন, অথবা সরাসরি email/WhatsApp/social থেকেও যোগাযোগ করতে পারেন।',
      formLabel: 'Project Brief',
      formTitle: 'আপনার project details পাঠান',
      formDescription:
        'Budget range, timeline, deliverables, reference mood এবং expected outcome লিখলে reply আরো দ্রুত ও accurate হবে।',
      submitButtonText: 'বার্তা পাঠান',
      successTitle: 'বার্তা সফলভাবে পাঠানো হয়েছে',
      successMessage: 'ধন্যবাদ। আমি যত দ্রুত সম্ভব আপনার সাথে যোগাযোগ করব।',
      showSubjectField: true,
      showInfoCards: true,
      showSocialLinks: true,
      showAvailabilityCard: true,
      availabilityTitle: 'এখন কাজ নেওয়া যাচ্ছে',
      availabilityText: 'সাধারণত ২৪ ঘণ্টার মধ্যে reply দিই। Urgent হলে WhatsApp-এ short brief পাঠাতে পারেন।',
      infoCards: [
        {
          id: 'email',
          icon: '📧',
          title: 'Email',
          value: email,
          href: email ? `mailto:${email}` : '',
          description: 'Detailed project brief, attachments, proposal এবং timeline discussion-এর জন্য best.',
          enabled: true,
          order: 1,
        },
        {
          id: 'whatsapp',
          icon: '💬',
          title: 'WhatsApp',
          value: phone,
          href: phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : '',
          description: 'Quick follow-up, availability check, and fast communication.',
          enabled: true,
          order: 2,
        },
        {
          id: 'location',
          icon: '📍',
          title: 'Location',
          value: 'Bangladesh · Remote Worldwide',
          href: '',
          description: 'Remote-first workflow with structured revisions and delivery.',
          enabled: true,
          order: 3,
        },
      ],
      socialLinks: [
        {
          id: 'youtube',
          label: 'YouTube',
          url: 'https://youtube.com',
          icon: '▶',
          enabled: true,
          order: 1,
        },
        {
          id: 'facebook',
          label: 'Facebook',
          url: 'https://facebook.com',
          icon: 'f',
          enabled: true,
          order: 2,
        },
        {
          id: 'instagram',
          label: 'Instagram',
          url: 'https://instagram.com',
          icon: '◎',
          enabled: true,
          order: 3,
        },
      ],
      styles: createDefaultBuilderSectionStyles(),
    },
    extraSection: {
      enabled: true,
      order: 30,
      layout: 'card-right',
      alignment: 'left',
      width: 'wide',
      spacing: 'balanced',
      label: 'Workflow',
      title: 'From brief to delivery, the process stays clean and premium',
      subtitle: 'Transparent revisions, clear milestones, and presentation-ready output.',
      description:
        'আমি সাধারণত brief review, style direction, first cut/design pass, revision round এবং final delivery—এই structured flow-তে কাজ করি। এতে collaboration smooth থাকে এবং output predictable quality ধরে রাখে।',
      image: '',
      showButton: true,
      buttonText: 'Tutorial Page',
      buttonLink: '/tutorial',
      styles: createDefaultBuilderSectionStyles(),
    },
    cta: {
      enabled: true,
      order: 40,
      layout: 'centered',
      alignment: 'center',
      width: 'normal',
      spacing: 'balanced',
      label: 'Let’s Work Together',
      title: 'Ready when you are',
      description:
        'Creative support, premium delivery, এবং brand-consistent visual execution দরকার হলে project brief পাঠান।',
      showPrimaryButton: true,
      primaryButtonText: 'Message Me',
      primaryButtonLink: '#contact-form',
      showSecondaryButton: true,
      secondaryButtonText: 'Back to Home',
      secondaryButtonLink: '/',
      styles: createDefaultBuilderSectionStyles(),
    },
  };
}

export function getContactPageConfig(map: SettingMap) {
  const fallback = createDefaultContactPageConfig(map);
  const rawValue = map[CONTACT_PAGE_SETTING_KEY];

  if (!rawValue) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>;

    return {
      pageEnabled: bool(parsed.pageEnabled, fallback.pageEnabled),
      hero: sanitizeHero(parsed.hero, fallback.hero),
      formSection: sanitizeFormSection(parsed.formSection, fallback.formSection),
      extraSection: sanitizeExtraSection(parsed.extraSection, fallback.extraSection),
      cta: sanitizeCta(parsed.cta, fallback.cta),
    };
  } catch {
    return fallback;
  }
}

export function serializeContactPageConfig(config: ContactPageConfig) {
  return JSON.stringify(config);
}
