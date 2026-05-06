export type AdminModuleGroupId =
  | 'overview'
  | 'crm'
  | 'content'
  | 'builder'
  | 'settings';

export type AdminModuleItem = {
  badge?: string;
  group: AdminModuleGroupId;
  href: string;
  icon: string;
  keywords?: string[];
  label: string;
  meta: string;
};

export const ADMIN_MODULE_GROUPS: Array<{
  description: string;
  id: AdminModuleGroupId;
  label: string;
}> = [
  {
    id: 'overview',
    label: 'Dashboard',
    description: 'Workspace home, stats, and module shortcuts',
  },
  {
    id: 'crm',
    label: 'CRM / Leads',
    description: 'Inbox, project flow, templates, and client delivery',
  },
  {
    id: 'builder',
    label: 'Page Builders',
    description: 'Homepage, portfolio, about, contact, tutorial, navigation, and footer builders',
  },
  {
    id: 'content',
    label: 'Content',
    description: 'Video, graphics, categories, and tutorial content operations',
  },
  {
    id: 'settings',
    label: 'System',
    description: 'Global settings, preferences, and live site access',
  },
];

export const ADMIN_MODULES: AdminModuleItem[] = [
  {
    group: 'overview',
    href: '/admin/dashboard',
    icon: '◩',
    label: 'Dashboard',
    meta: 'System overview, quick actions, and module access',
    badge: 'Home',
    keywords: ['overview', 'stats', 'home'],
  },
  {
    group: 'crm',
    href: '/admin/inbox',
    icon: '✉',
    label: 'Inbox',
    meta: 'Leads, contact messages, statuses, and follow-ups',
    badge: 'CRM',
    keywords: ['leads', 'messages', 'follow up', 'briefs'],
  },
  {
    group: 'crm',
    href: '/admin/projects',
    icon: '▣',
    label: 'Projects',
    meta: 'Client delivery, milestones, files, and progress tracking',
    badge: 'Client',
    keywords: ['delivery', 'milestones', 'portal'],
  },
  {
    group: 'crm',
    href: '/admin/templates',
    icon: '⌘',
    label: 'Templates',
    meta: 'Replies, package templates, rates, and WhatsApp drafts',
    badge: 'Rates',
    keywords: ['pricing', 'quotes', 'messages'],
  },
  {
    group: 'builder',
    href: '/admin/homepage-portfolio',
    icon: '▦',
    label: 'Homepage Builder',
    meta: 'Homepage sections, showreel, CTA, and shared footer handoff',
    badge: 'Builder',
    keywords: ['hero', 'homepage', 'cta', 'showreel'],
  },
  {
    group: 'builder',
    href: '/admin/portfolio',
    icon: '◫',
    label: 'Portfolio Builder',
    meta: 'Portfolio hero, filters, tabs, archive behavior, and presentation',
    badge: 'Builder',
    keywords: ['portfolio', 'grid', 'archive', 'preview'],
  },
  {
    group: 'builder',
    href: '/admin/about',
    icon: '◌',
    label: 'About Builder',
    meta: 'Homepage about block and full About page content system',
    badge: 'Builder',
    keywords: ['bio', 'story', 'skills', 'services'],
  },
  {
    group: 'content',
    href: '/admin/experiences',
    icon: '✦',
    label: 'Experience Manager',
    meta: 'Roles, organizations, logos, dates, skills, and highlighted achievement bullets',
    badge: 'Content',
    keywords: ['experience', 'work', 'timeline', 'achievements', 'jobs'],
  },
  {
    group: 'builder',
    href: '/admin/contact',
    icon: '✦',
    label: 'Contact Builder',
    meta: 'Public contact page content, layout, and conversion flow',
    badge: 'Form',
    keywords: ['contact', 'form', 'cta', 'social links'],
  },
  {
    group: 'builder',
    href: '/admin/tutorials',
    icon: '◧',
    label: 'Tutorial Workspace',
    meta: 'Tutorial page builder and lesson presentation controls',
    badge: 'Builder',
    keywords: ['tutorials', 'lessons', 'thumbnails', 'content'],
  },
  {
    group: 'builder',
    href: '/admin/navigation',
    icon: '≡',
    label: 'Navigation Editor',
    meta: 'Primary site navigation, visibility, and menu order',
    badge: 'Builder',
    keywords: ['menu', 'navbar', 'links', 'order'],
  },
  {
    group: 'builder',
    href: '/admin/footer',
    icon: '⌄',
    label: 'Global Footer',
    meta: 'Shared footer content, links, and bottom-of-site actions',
    badge: 'Builder',
    keywords: ['footer', 'social', 'contact', 'copyright'],
  },
  {
    group: 'content',
    href: '/admin/videos',
    icon: '▶',
    label: 'Video Manager',
    meta: 'Manage videos, categories, order, and homepage placement',
    badge: 'Media',
    keywords: ['thumbnail', 'youtube', 'video'],
  },
  {
    group: 'content',
    href: '/admin/graphics',
    icon: '▤',
    label: 'Graphics Manager',
    meta: 'Upload graphics, set visibility, and control previews',
    badge: 'Media',
    keywords: ['graphics', 'images', 'portfolio items'],
  },
  {
    group: 'content',
    href: '/admin/categories',
    icon: '⌂',
    label: 'Category Manager',
    meta: 'Video and graphics categories across the site',
    badge: 'Taxonomy',
    keywords: ['taxonomy', 'filters', 'labels'],
  },
  {
    group: 'settings',
    href: '/admin/settings',
    icon: '⚙',
    label: 'Settings',
    meta: 'Site identity, theme, SEO, contact info, socials, and admin preferences',
    badge: 'System',
    keywords: ['seo', 'theme', 'identity', 'social'],
  },
  {
    group: 'settings',
    href: '/admin/system-monitor',
    icon: '!',
    label: 'System Monitor',
    meta: 'Production security, API, storage, database, and SEO issue reports',
    badge: 'Safety',
    keywords: ['security', 'health', 'issues', 'rls', 'logs', 'production'],
  },
  {
    group: 'settings',
    href: '/',
    icon: '↗',
    label: 'View Site',
    meta: 'Open the live portfolio in a new tab',
    badge: 'Live',
    keywords: ['website', 'public site', 'preview'],
  },
];

export function getAdminModulesByGroup(group: AdminModuleGroupId) {
  return ADMIN_MODULES.filter(item => item.group === group);
}

export function findAdminModule(pathname: string) {
  return ADMIN_MODULES.find(item =>
    item.href === '/'
      ? false
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
}
