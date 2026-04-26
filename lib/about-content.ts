import type { CSSProperties } from 'react';
import {
  getFirstSetting,
  parseStyledSetting,
  type SettingMap,
} from './hero-settings';
import {
  createDefaultBuilderSectionStyles,
  sanitizeBuilderSectionStyles,
  type BuilderSectionStyles,
} from './page-builder-styles';

export const ABOUT_SETTING_KEYS = {
  eyebrow: 'about_eyebrow',
  title: 'about_title',
  role: 'about_role',
  subheading: 'about_subheading',
  bio: 'about_bio',
  skillTitle: 'about_skill_title',
  skill1: 'about_skill1',
  skill2: 'about_skill2',
  skill3: 'about_skill3',
  skill4: 'about_skill4',
  cta: 'about_cta',
  image: 'about_image',
} as const;

export const ABOUT_SYSTEM_SETTING_KEY = 'about_system_config';

export type AboutLayoutMode =
  | 'image-left'
  | 'image-right'
  | 'stacked'
  | 'centered'
  | 'card-left'
  | 'card-right'
  | 'grid';

export type AboutAlignment = 'left' | 'center' | 'right';
export type AboutWidthPreset = 'normal' | 'wide' | 'full';
export type AboutSpacingPreset = 'compact' | 'balanced' | 'spacious';

export type AboutPageSectionType = 'hero' | 'stats' | 'skills' | 'story' | 'services' | 'cta';

export type AboutText = {
  value: string;
  style: CSSProperties;
};

export type AboutContent = {
  eyebrow: AboutText;
  title: AboutText;
  role: AboutText;
  subheading: AboutText;
  bio: AboutText;
  skillTitle: AboutText;
  cta: AboutText;
  image: string;
  skills: AboutText[];
};

export type AboutStatItem = {
  id: string;
  icon?: string;
  value: string;
  label: string;
};

export type AboutCardItem = {
  id: string;
  icon?: string;
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
};

export type HomepageAboutConfig = {
  enabled: boolean;
  order: number;
  layout: AboutLayoutMode;
  alignment: AboutAlignment;
  width: AboutWidthPreset;
  spacing: AboutSpacingPreset;
  label: string;
  title: string;
  role: string;
  description: string;
  image: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  showStats: boolean;
  showCards: boolean;
  maxCards: number;
  stats: AboutStatItem[];
  cards: AboutCardItem[];
  styles: BuilderSectionStyles;
};

export type AboutPageSectionConfig = {
  id: string;
  type: AboutPageSectionType;
  enabled: boolean;
  order: number;
  layout: AboutLayoutMode;
  alignment: AboutAlignment;
  label?: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  stats?: AboutStatItem[];
  cards?: AboutCardItem[];
  styles?: BuilderSectionStyles;
};

export type AboutSystemConfig = {
  homepage: HomepageAboutConfig;
  pageSections: AboutPageSectionConfig[];
};

export type AboutRuntimeStats = {
  projectsValue?: string;
  projectsLabel?: string;
  clientsValue?: string;
  clientsLabel?: string;
  yearsValue?: string;
  yearsLabel?: string;
};

export const ABOUT_FALLBACKS = {
  eyebrow: 'আমার সম্পর্কে',
  title: 'আমি একজন cinematic visual creator',
  role: 'Video Editor, Motion Designer & Graphic Designer',
  subheading:
    'ভিডিও, মোশন আর ডিজাইনের মাধ্যমে ব্র্যান্ড ও ক্রিয়েটরদের গল্পকে premium visual experience-এ রূপ দিই।',
  bio:
    'আমি একজন পেশাদার ভিডিও এডিটর ও গ্রাফিক্স ডিজাইনার। বিভিন্ন ব্র্যান্ড, কনটেন্ট ক্রিয়েটর এবং উদ্যোক্তার জন্য cinematic edits, motion graphics, poster, branding ও social media creatives তৈরি করি।',
  skillTitle: 'দক্ষতা ও creative focus',
  skill1: 'Video Editing',
  skill2: 'Motion Graphics',
  skill3: 'Graphic Design',
  skill4: 'Branding & Social Media',
  cta: 'যোগাযোগ করুন',
} as const;

export const ABOUT_SKILL_META = [
  {
    accent: 'Cinematic rhythm',
    description: 'Cuts, pacing, sound flow and color mood for high-retention videos.',
  },
  {
    accent: 'Motion clarity',
    description: 'Clean kinetic typography, visual effects and layered transitions.',
  },
  {
    accent: 'Visual identity',
    description: 'Posters, thumbnails, layouts and campaign-ready static designs.',
  },
  {
    accent: 'Content systems',
    description: 'Brand-consistent visuals for reels, ads and social platforms.',
  },
] as const;

export function getAboutContent(map: SettingMap): AboutContent {
  const skillKeys = [
    ABOUT_SETTING_KEYS.skill1,
    ABOUT_SETTING_KEYS.skill2,
    ABOUT_SETTING_KEYS.skill3,
    ABOUT_SETTING_KEYS.skill4,
  ];

  return {
    eyebrow: parseStyledSetting(map[ABOUT_SETTING_KEYS.eyebrow], ABOUT_FALLBACKS.eyebrow),
    title: parseStyledSetting(map[ABOUT_SETTING_KEYS.title], ABOUT_FALLBACKS.title),
    role: parseStyledSetting(map[ABOUT_SETTING_KEYS.role], ABOUT_FALLBACKS.role),
    subheading: parseStyledSetting(map[ABOUT_SETTING_KEYS.subheading], ABOUT_FALLBACKS.subheading),
    bio: parseStyledSetting(map[ABOUT_SETTING_KEYS.bio], ABOUT_FALLBACKS.bio),
    skillTitle: parseStyledSetting(map[ABOUT_SETTING_KEYS.skillTitle], ABOUT_FALLBACKS.skillTitle),
    cta: parseStyledSetting(map[ABOUT_SETTING_KEYS.cta], ABOUT_FALLBACKS.cta),
    image: getFirstSetting(map, ABOUT_SETTING_KEYS.image),
    skills: skillKeys.map((key, index) =>
      parseStyledSetting(
        map[key],
        ABOUT_FALLBACKS[`skill${index + 1}` as keyof typeof ABOUT_FALLBACKS]
      )
    ),
  };
}

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

function layout(value: unknown, fallback: AboutLayoutMode): AboutLayoutMode {
  const allowed: AboutLayoutMode[] = [
    'image-left',
    'image-right',
    'stacked',
    'centered',
    'card-left',
    'card-right',
    'grid',
  ];

  return allowed.includes(value as AboutLayoutMode) ? (value as AboutLayoutMode) : fallback;
}

function alignment(value: unknown, fallback: AboutAlignment): AboutAlignment {
  return value === 'left' || value === 'center' || value === 'right'
    ? value
    : fallback;
}

function widthPreset(value: unknown, fallback: AboutWidthPreset): AboutWidthPreset {
  return value === 'normal' || value === 'wide' || value === 'full'
    ? value
    : fallback;
}

function spacingPreset(value: unknown, fallback: AboutSpacingPreset): AboutSpacingPreset {
  return value === 'compact' || value === 'balanced' || value === 'spacious'
    ? value
    : fallback;
}

function sectionType(value: unknown, fallback: AboutPageSectionType): AboutPageSectionType {
  const allowed: AboutPageSectionType[] = ['hero', 'stats', 'skills', 'story', 'services', 'cta'];
  return allowed.includes(value as AboutPageSectionType)
    ? (value as AboutPageSectionType)
    : fallback;
}

function sanitizeStats(value: unknown, fallback: AboutStatItem[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: text(item.id, fallback[index]?.id || `stat-${index + 1}`),
      icon: text(item.icon, fallback[index]?.icon || ''),
      value: text(item.value, fallback[index]?.value || ''),
      label: text(item.label, fallback[index]?.label || ''),
    }))
    .filter(item => item.value || item.label);
}

function sanitizeCards(value: unknown, fallback: AboutCardItem[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: text(item.id, fallback[index]?.id || `card-${index + 1}`),
      icon: text(item.icon, fallback[index]?.icon || ''),
      title: text(item.title, fallback[index]?.title || ''),
      subtitle: text(item.subtitle, fallback[index]?.subtitle || ''),
      description: text(item.description, fallback[index]?.description || ''),
      image: text(item.image, fallback[index]?.image || ''),
    }))
    .filter(item => item.title || item.description);
}

export function createDefaultAboutSystemConfig(
  content: AboutContent,
  runtimeStats: AboutRuntimeStats = {}
): AboutSystemConfig {
  const stats: AboutStatItem[] = [
    {
      id: 'years',
      icon: '⚡',
      value: runtimeStats.yearsValue || '3+',
      label: runtimeStats.yearsLabel || 'Years Crafting',
    },
    {
      id: 'projects',
      icon: '🎬',
      value: runtimeStats.projectsValue || '120+',
      label: runtimeStats.projectsLabel || 'Projects',
    },
    {
      id: 'clients',
      icon: '🤝',
      value: runtimeStats.clientsValue || '50+',
      label: runtimeStats.clientsLabel || 'Clients',
    },
    {
      id: 'specialties',
      icon: '✨',
      value: '4+',
      label: 'Creative Specialties',
    },
  ];
  const cards: AboutCardItem[] = content.skills.map((skill, index) => ({
    id: `skill-${index + 1}`,
    icon: ['🎬', '✨', '🎨', '📱'][index] || '✦',
    title: skill.value,
    subtitle: ABOUT_SKILL_META[index]?.accent || 'Creative focus',
    description:
      ABOUT_SKILL_META[index]?.description ||
      'Premium creative execution with clean structure and thoughtful visual details.',
  }));

  return {
    homepage: {
      enabled: true,
      order: 30,
      layout: 'image-right',
      alignment: 'left',
      width: 'wide',
      spacing: 'balanced',
      label: content.eyebrow.value,
      title: content.title.value,
      role: content.role.value,
      description: content.subheading.value,
      image: content.image,
      primaryButtonText: 'আরও জানুন',
      primaryButtonLink: '/about',
      secondaryButtonText: 'কাজ শুরু করি',
      secondaryButtonLink: '/contact',
      showStats: true,
      showCards: true,
      maxCards: 4,
      stats: stats.slice(0, 3),
      cards,
      styles: createDefaultBuilderSectionStyles(),
    },
    pageSections: [
      {
        id: 'about-hero',
        type: 'hero',
        enabled: true,
        order: 10,
        layout: 'image-right',
        alignment: 'left',
        label: content.eyebrow.value,
        title: content.title.value,
        subtitle: content.role.value,
        description: content.subheading.value,
        image: content.image,
        primaryButtonText: content.cta.value,
        primaryButtonLink: '/contact',
        secondaryButtonText: 'Portfolio দেখুন',
        secondaryButtonLink: '/portfolio',
        styles: createDefaultBuilderSectionStyles(),
      },
      {
        id: 'about-stats',
        type: 'stats',
        enabled: true,
        order: 20,
        layout: 'grid',
        alignment: 'center',
        title: 'Numbers with context',
        subtitle: 'Compact proof points from recent creative work.',
        stats,
        styles: createDefaultBuilderSectionStyles(),
      },
      {
        id: 'about-skills',
        type: 'skills',
        enabled: true,
        order: 30,
        layout: 'grid',
        alignment: 'left',
        label: 'Expertise',
        title: content.skillTitle.value,
        subtitle: 'Creative areas where I bring structure, rhythm and polished execution.',
        cards,
        styles: createDefaultBuilderSectionStyles(),
      },
      {
        id: 'about-story',
        type: 'story',
        enabled: true,
        order: 40,
        layout: 'card-left',
        alignment: 'left',
        label: 'Philosophy',
        title: 'গল্পটা আগে, edit তারপর।',
        subtitle: 'Story, clarity and cinematic mood guide every creative decision.',
        description: content.bio.value,
        image: content.image,
        styles: createDefaultBuilderSectionStyles(),
      },
      {
        id: 'about-services',
        type: 'services',
        enabled: true,
        order: 50,
        layout: 'grid',
        alignment: 'left',
        label: 'Services',
        title: 'যেভাবে আমি আপনার project এগিয়ে নিতে পারি',
        subtitle: 'Focused creative support for video, graphics and social content systems.',
        cards,
        styles: createDefaultBuilderSectionStyles(),
      },
      {
        id: 'about-cta',
        type: 'cta',
        enabled: true,
        order: 60,
        layout: 'centered',
        alignment: 'center',
        label: "Let's build something visual",
        title: 'আপনার project-কে premium visual story বানাই।',
        description:
          'Editing, graphics বা complete creative package লাগলে brief পাঠান। আমি concept থেকে delivery পর্যন্ত clean, cinematic এবং brand-focused execution রাখব।',
        primaryButtonText: 'Contact Me',
        primaryButtonLink: '/contact',
        secondaryButtonText: 'View Portfolio',
        secondaryButtonLink: '/portfolio',
        styles: createDefaultBuilderSectionStyles(),
      },
    ],
  };
}

function sanitizeHomepage(value: unknown, fallback: HomepageAboutConfig): HomepageAboutConfig {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    enabled: bool(value.enabled, fallback.enabled),
    order: num(value.order, fallback.order),
    layout: layout(value.layout, fallback.layout),
    alignment: alignment(value.alignment, fallback.alignment),
    width: widthPreset(value.width, fallback.width),
    spacing: spacingPreset(value.spacing, fallback.spacing),
    label: text(value.label, fallback.label),
    title: text(value.title, fallback.title),
    role: text(value.role, fallback.role),
    description: text(value.description, fallback.description),
    image: text(value.image, fallback.image),
    primaryButtonText: text(value.primaryButtonText, fallback.primaryButtonText),
    primaryButtonLink: text(value.primaryButtonLink, fallback.primaryButtonLink),
    secondaryButtonText: text(value.secondaryButtonText, fallback.secondaryButtonText),
    secondaryButtonLink: text(value.secondaryButtonLink, fallback.secondaryButtonLink),
    showStats: bool(value.showStats, fallback.showStats),
    showCards: bool(value.showCards, fallback.showCards),
    maxCards: Math.max(1, Math.min(8, num(value.maxCards, fallback.maxCards))),
    stats: sanitizeStats(value.stats, fallback.stats),
    cards: sanitizeCards(value.cards, fallback.cards),
    styles: sanitizeBuilderSectionStyles(value.styles, fallback.styles),
  };
}

function sanitizeSection(value: unknown, fallback: AboutPageSectionConfig): AboutPageSectionConfig {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    ...fallback,
    id: text(value.id, fallback.id),
    type: sectionType(value.type, fallback.type),
    enabled: bool(value.enabled, fallback.enabled),
    order: num(value.order, fallback.order),
    layout: layout(value.layout, fallback.layout),
    alignment: alignment(value.alignment, fallback.alignment),
    label: text(value.label, fallback.label || ''),
    title: text(value.title, fallback.title),
    subtitle: text(value.subtitle, fallback.subtitle || ''),
    description: text(value.description, fallback.description || ''),
    image: text(value.image, fallback.image || ''),
    primaryButtonText: text(value.primaryButtonText, fallback.primaryButtonText || ''),
    primaryButtonLink: text(value.primaryButtonLink, fallback.primaryButtonLink || ''),
    secondaryButtonText: text(value.secondaryButtonText, fallback.secondaryButtonText || ''),
    secondaryButtonLink: text(value.secondaryButtonLink, fallback.secondaryButtonLink || ''),
    stats: sanitizeStats(value.stats, fallback.stats || []),
    cards: sanitizeCards(value.cards, fallback.cards || []),
    styles: sanitizeBuilderSectionStyles(
      value.styles,
      fallback.styles || createDefaultBuilderSectionStyles()
    ),
  };
}

export function getAboutSystemConfig(
  map: SettingMap,
  runtimeStats: AboutRuntimeStats = {}
): AboutSystemConfig {
  const content = getAboutContent(map);
  const fallback = createDefaultAboutSystemConfig(content, runtimeStats);
  const rawValue = map[ABOUT_SYSTEM_SETTING_KEY];

  if (!rawValue) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!isRecord(parsed)) {
      return fallback;
    }

    const savedSections = Array.isArray(parsed.pageSections) ? parsed.pageSections : [];
    const sections = fallback.pageSections.map(section => {
      const saved = savedSections.find(
        item => isRecord(item) && text(item.id, '') === section.id
      );
      return sanitizeSection(saved, section);
    });
    const extraSections = savedSections
      .filter(isRecord)
      .filter(item => !fallback.pageSections.some(section => section.id === text(item.id, '')))
      .map((item, index) =>
        sanitizeSection(item, {
          id: text(item.id, `custom-section-${index + 1}`),
          type: sectionType(item.type, 'story'),
          enabled: true,
          order: 100 + index,
          layout: 'stacked',
          alignment: 'left',
          title: 'Custom About Section',
          description: '',
          styles: createDefaultBuilderSectionStyles(),
        })
      );

    return {
      homepage: sanitizeHomepage(parsed.homepage, fallback.homepage),
      pageSections: [...sections, ...extraSections].sort((a, b) => a.order - b.order),
    };
  } catch {
    return fallback;
  }
}

export function serializeAboutSystemConfig(config: AboutSystemConfig) {
  return JSON.stringify({
    homepage: config.homepage,
    pageSections: [...config.pageSections].sort((a, b) => a.order - b.order),
  });
}
