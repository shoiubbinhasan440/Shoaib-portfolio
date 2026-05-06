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
export type ExperienceEmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Contract'
  | 'Freelance'
  | 'Volunteer'
  | 'Internship';
export type ExperienceLocationType = 'On-site' | 'Hybrid' | 'Remote';
export type ExperienceLayoutStyle = 'timeline' | 'card-grid' | 'compact-list';

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

export type ExperienceItem = {
  id: string;
  organizationName: string;
  roleTitle: string;
  employmentType: ExperienceEmploymentType;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
  location: string;
  locationType: ExperienceLocationType;
  description: string;
  achievements: string[];
  logoUrl: string;
  websiteUrl: string;
  skills: string[];
  showHomepage: boolean;
  showAboutPage: boolean;
  sortOrder: number;
  isVisible: boolean;
};

export type AboutExperienceConfig = {
  showOnHomepage: boolean;
  showOnAboutPage: boolean;
  homepageItemLimit: number;
  layoutStyle: ExperienceLayoutStyle;
  title: string;
  subtitle: string;
  viewAllLabel: string;
  items: ExperienceItem[];
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
  experience: AboutExperienceConfig;
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

function employmentType(value: unknown, fallback: ExperienceEmploymentType): ExperienceEmploymentType {
  const allowed: ExperienceEmploymentType[] = [
    'Full-time',
    'Part-time',
    'Contract',
    'Freelance',
    'Volunteer',
    'Internship',
  ];
  return allowed.includes(value as ExperienceEmploymentType)
    ? (value as ExperienceEmploymentType)
    : fallback;
}

function locationType(value: unknown, fallback: ExperienceLocationType): ExperienceLocationType {
  return value === 'On-site' || value === 'Hybrid' || value === 'Remote'
    ? value
    : fallback;
}

function experienceLayoutStyle(
  value: unknown,
  fallback: ExperienceLayoutStyle
): ExperienceLayoutStyle {
  return value === 'timeline' || value === 'card-grid' || value === 'compact-list'
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

function stringList(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .flatMap(line => line.split(','))
      .map(item => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

export function createDefaultExperienceItem(): ExperienceItem {
  return {
    id: `experience-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    organizationName: '',
    roleTitle: '',
    employmentType: 'Full-time',
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    isCurrent: false,
    location: '',
    locationType: 'On-site',
    description: '',
    achievements: [],
    logoUrl: '',
    websiteUrl: '',
    skills: [],
    showHomepage: true,
    showAboutPage: true,
    sortOrder: 10,
    isVisible: true,
  };
}

function sanitizeExperienceItem(value: unknown, fallback: ExperienceItem): ExperienceItem {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    id: text(value.id, fallback.id),
    organizationName: text(value.organizationName, text(value.organization_name, fallback.organizationName)),
    roleTitle: text(value.roleTitle, text(value.role_title, fallback.roleTitle)),
    employmentType: employmentType(value.employmentType ?? value.employment_type, fallback.employmentType),
    startMonth: text(value.startMonth, fallback.startMonth),
    startYear: text(value.startYear, fallback.startYear),
    endMonth: text(value.endMonth, fallback.endMonth),
    endYear: text(value.endYear, fallback.endYear),
    isCurrent: bool(value.isCurrent ?? value.is_current, fallback.isCurrent),
    location: text(value.location, fallback.location),
    locationType: locationType(value.locationType ?? value.location_type, fallback.locationType),
    description: text(value.description, fallback.description),
    achievements: stringList(value.achievements, fallback.achievements),
    logoUrl: text(value.logoUrl, text(value.logo_url, fallback.logoUrl)),
    websiteUrl: text(value.websiteUrl, text(value.website_url, fallback.websiteUrl)),
    skills: stringList(value.skills, fallback.skills),
    showHomepage: bool(value.showHomepage ?? value.show_homepage, fallback.showHomepage),
    showAboutPage: bool(value.showAboutPage ?? value.show_about_page, fallback.showAboutPage),
    sortOrder: num(value.sortOrder ?? value.sort_order, fallback.sortOrder),
    isVisible: bool(value.isVisible ?? value.is_visible, fallback.isVisible),
  };
}

function createDefaultExperienceConfig(): AboutExperienceConfig {
  return {
    showOnHomepage: true,
    showOnAboutPage: true,
    homepageItemLimit: 3,
    layoutStyle: 'timeline',
    title: 'Professional Experience',
    subtitle: 'Selected roles, organizations, and creative responsibilities.',
    viewAllLabel: 'View full experience',
    items: [],
  };
}

function sanitizeExperienceConfig(
  value: unknown,
  fallback: AboutExperienceConfig
): AboutExperienceConfig {
  if (!isRecord(value)) {
    return fallback;
  }

  const items = Array.isArray(value.items)
    ? value.items
        .filter(isRecord)
        .map((item, index) =>
          sanitizeExperienceItem(item, {
            ...createDefaultExperienceItem(),
            id: text(item.id, `experience-${index + 1}`),
            sortOrder: index + 1,
          })
        )
    : fallback.items;

  return {
    showOnHomepage: bool(value.showOnHomepage, fallback.showOnHomepage),
    showOnAboutPage: bool(value.showOnAboutPage, fallback.showOnAboutPage),
    homepageItemLimit: Math.max(1, Math.min(8, num(value.homepageItemLimit, fallback.homepageItemLimit))),
    layoutStyle: experienceLayoutStyle(value.layoutStyle, fallback.layoutStyle),
    title: text(value.title, fallback.title),
    subtitle: text(value.subtitle, fallback.subtitle),
    viewAllLabel: text(value.viewAllLabel, fallback.viewAllLabel),
    items: items.sort((a, b) => a.sortOrder - b.sortOrder),
  };
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
    experience: createDefaultExperienceConfig(),
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
      experience: sanitizeExperienceConfig(parsed.experience, fallback.experience),
      homepage: sanitizeHomepage(parsed.homepage, fallback.homepage),
      pageSections: [...sections, ...extraSections].sort((a, b) => a.order - b.order),
    };
  } catch {
    return fallback;
  }
}

export function serializeAboutSystemConfig(config: AboutSystemConfig) {
  return JSON.stringify({
    experience: {
      ...config.experience,
      items: [...config.experience.items].sort((a, b) => a.sortOrder - b.sortOrder),
    },
    homepage: config.homepage,
    pageSections: [...config.pageSections].sort((a, b) => a.order - b.order),
  });
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec',
};

function monthIndex(month: string) {
  const value = Number(month);
  return Number.isFinite(value) && value >= 1 && value <= 12 ? value - 1 : 0;
}

function formatMonthYear(month: string, year: string) {
  if (!year) {
    return '';
  }

  return `${MONTH_LABELS[month] || MONTH_LABELS[month.padStart(2, '0')] || 'Jan'} ${year}`;
}

function monthsBetween(item: ExperienceItem) {
  const startYear = Number(item.startYear);
  const endYear = item.isCurrent ? new Date().getFullYear() : Number(item.endYear);
  const startMonth = monthIndex(item.startMonth || '01');
  const endMonth = item.isCurrent ? new Date().getMonth() : monthIndex(item.endMonth || '01');

  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    return 0;
  }

  return Math.max(0, (endYear - startYear) * 12 + (endMonth - startMonth) + 1);
}

export function getExperienceDurationText(item: ExperienceItem) {
  const months = monthsBetween(item);
  if (months <= 0) {
    return '';
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts = [];

  if (years > 0) {
    parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  }

  if (remainingMonths > 0) {
    parts.push(`${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}

export function getExperienceDateRange(item: ExperienceItem) {
  const start = formatMonthYear(item.startMonth, item.startYear);
  const end = item.isCurrent ? 'Present' : formatMonthYear(item.endMonth, item.endYear);

  if (!start && !end) {
    return '';
  }

  return `${start || 'Start'} – ${end || 'Present'}`;
}

export function getVisibleExperienceItems(
  config: AboutExperienceConfig,
  target: 'homepage' | 'about'
) {
  return config.items
    .filter(item => item.isVisible)
    .filter(item => (target === 'homepage' ? item.showHomepage : item.showAboutPage))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
