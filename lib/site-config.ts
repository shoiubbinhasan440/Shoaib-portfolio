export const SITE_CONFIG = {
  siteName: 'Md Minhajul Hoque',
  ownerName: 'Md. Minhajul Hoque',
  profession: 'Graphics & Video Editor',
  url: 'https://www.mdminhajulhoque.com',
  title: 'Md Minhajul Hoque | Graphics & Video Editor',
  description:
    'Official portfolio of Md Minhajul Hoque, Graphics & Video Editor specializing in graphic design, video editing, motion graphics, and digital marketing.',
  shortDescription: 'Official portfolio of Md Minhajul Hoque, Graphics & Video Editor.',
  keywords: [
    'Graphic Design',
    'Video Editing',
    'Motion Graphics',
    'Digital Marketing',
    'Portfolio',
    'Visual Designer',
    'Video Editor',
    'Bangladesh',
  ],
  ogImage: '/og-image.jpg',
  linkedIn: 'https://www.linkedin.com/in/muhammad-minhajul-hoque-a34b73342/',
  alternateSiteNames: [
    'Md. Minhajul Hoque',
    'Minhajul Hoque',
    'Md Minhaj',
    'Muhammad Minhajul Hoque',
  ],
  alternatePersonNames: ['Md Minhajul Hoque', 'Minhajul Hoque', 'Md Minhaj'],
  knowsAbout: ['Graphic Design', 'Video Editing', 'Motion Graphics', 'Digital Marketing'],
} as const;

export function absoluteSiteUrl(path = '/') {
  const normalizedPath = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${normalizedPath}`;
}

export function absoluteAssetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${normalizedPath}`;
}
