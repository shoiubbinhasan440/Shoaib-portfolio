'use client';

import AdminImageField from '@/components/admin/AdminImageField';
import {
  AdminChip,
  AdminField,
  getAdminInputStyle,
  getAdminTextareaStyle,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import { getCanonicalUrl } from '@/lib/site-config';
import type { ImageUploadProfile } from '@/lib/image-upload-validation';

export type SeoRobotsMode = 'index-follow' | 'noindex-nofollow';
export type SeoStructuredDataType =
  | 'WebPage'
  | 'CollectionPage'
  | 'ProfilePage'
  | 'CreativeWork'
  | 'Article';
export type SeoVisibilityStatus = 'draft' | 'published' | 'hidden';

export type SeoVisibilityValue = {
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  canonicalPath: string;
  ogImage: string;
  coverImage: string;
  socialImage: string;
  visible: boolean;
  showOnHomepage: boolean;
  showOnPortfolio: boolean;
  featured: boolean;
  sortOrder: number;
  slug: string;
  robots: SeoRobotsMode;
  structuredDataType: SeoStructuredDataType;
  status: SeoVisibilityStatus;
  altText: string;
};

type SeoVisibilityPanelProps = {
  value: SeoVisibilityValue;
  onChange: (patch: Partial<SeoVisibilityValue>) => void;
  titleFallback: string;
  descriptionFallback: string;
  onCoverUpload?: (file: File) => Promise<string | void> | string | void;
  onOgUpload?: (file: File) => Promise<string | void> | string | void;
  uploadingCover?: boolean;
  uploadingOg?: boolean;
  coverUploadProfile?: ImageUploadProfile;
  ogUploadProfile?: ImageUploadProfile;
  showHomepageToggle?: boolean;
  showPortfolioToggle?: boolean;
  helperText?: string;
};

const structuredDataOptions: SeoStructuredDataType[] = [
  'WebPage',
  'CollectionPage',
  'ProfilePage',
  'CreativeWork',
  'Article',
];

function scoreTitle(value: string) {
  const length = value.trim().length;
  return length >= 30 && length <= 60;
}

function scoreDescription(value: string) {
  const length = value.trim().length;
  return length >= 120 && length <= 160;
}

function isCleanSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim());
}

function getSeoScore(value: SeoVisibilityValue, generatedCanonical: string) {
  const checks = [
    scoreTitle(value.seoTitle || ''),
    scoreDescription(value.seoDescription || ''),
    Boolean(value.canonicalUrl || generatedCanonical),
    Boolean(value.ogImage || value.coverImage || value.socialImage),
    isCleanSlug(value.slug || ''),
    Boolean(value.altText || value.ogImage || value.coverImage),
    value.robots === 'index-follow' || value.robots === 'noindex-nofollow',
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

function previewImage(value: SeoVisibilityValue) {
  return value.ogImage || value.socialImage || value.coverImage;
}

export default function SeoVisibilityPanel({
  value,
  onChange,
  titleFallback,
  descriptionFallback,
  onCoverUpload,
  onOgUpload,
  uploadingCover = false,
  uploadingOg = false,
  coverUploadProfile = 'thumbnail',
  ogUploadProfile = 'showcase',
  showHomepageToggle = true,
  showPortfolioToggle = true,
  helperText,
}: SeoVisibilityPanelProps) {
  const tokens = useAdminThemeTokens();
  const inputStyle = getAdminInputStyle(tokens);
  const textareaStyle = getAdminTextareaStyle(tokens, { minHeight: 104 });
  const generatedCanonical = getCanonicalUrl(value.canonicalUrl || value.canonicalPath || '/');
  const score = getSeoScore(value, generatedCanonical);
  const title = value.seoTitle || titleFallback;
  const description = value.seoDescription || descriptionFallback;
  const image = previewImage(value);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          border: `1px solid ${tokens.line}`,
          borderRadius: 20,
          background: tokens.fieldSoft,
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 5 }}>
            SEO & Visibility
          </div>
          <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.6, maxWidth: 760 }}>
            {helperText ||
              'Control search metadata, canonical URL, social images, publishing status, featured state, and display rules from the same panel.'}
          </div>
        </div>
        <AdminChip tone={score >= 80 ? 'success' : score >= 55 ? 'accent' : 'danger'}>
          SEO {score}/100
        </AdminChip>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
        <AdminField label="SEO title" hint="Search result title. Aim for 30-60 characters.">
          <input
            value={value.seoTitle}
            onChange={event => onChange({ seoTitle: event.target.value })}
            placeholder={titleFallback}
            style={inputStyle}
          />
        </AdminField>
        <AdminField label="Custom slug" hint="Lowercase slug used for clean URLs and previews.">
          <input
            value={value.slug}
            onChange={event => onChange({ slug: event.target.value })}
            placeholder="clean-url-slug"
            style={inputStyle}
          />
        </AdminField>
        <AdminField label="Canonical URL" hint="Manual override is optional. Leave empty to use the generated URL.">
          <input
            value={value.canonicalUrl}
            onChange={event => onChange({ canonicalUrl: event.target.value })}
            placeholder={generatedCanonical}
            style={inputStyle}
          />
          <div
            style={{
              marginTop: 10,
              border: `1px solid ${tokens.line}`,
              borderRadius: 14,
              background: tokens.fieldSoft,
              padding: 12,
              display: 'grid',
              gap: 8,
            }}
          >
            <div style={{ color: tokens.subtle, fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
              Generated canonical
            </div>
            <input
              readOnly
              value={generatedCanonical}
              style={{ ...inputStyle, color: tokens.muted, fontFamily: 'monospace' }}
            />
            <button
              type="button"
              onClick={() => onChange({ canonicalUrl: generatedCanonical })}
              style={{
                justifySelf: 'start',
                border: `1px solid ${tokens.line}`,
                borderRadius: 12,
                background: tokens.field,
                color: tokens.text,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 800,
                padding: '9px 12px',
              }}
            >
              Use generated canonical
            </button>
          </div>
        </AdminField>
        <AdminField label="SEO description" full hint="Search and social fallback description. Aim for 120-160 characters.">
          <textarea
            value={value.seoDescription}
            onChange={event => onChange({ seoDescription: event.target.value })}
            placeholder={descriptionFallback}
            style={textareaStyle}
          />
        </AdminField>
        <AdminField label="Robots setting" hint="Noindex items are kept out of sitemap and search metadata where supported.">
          <select
            value={value.robots}
            onChange={event => onChange({ robots: event.target.value as SeoRobotsMode })}
            style={inputStyle}
          >
            <option value="index-follow">index/follow</option>
            <option value="noindex-nofollow">noindex/nofollow</option>
          </select>
        </AdminField>
        <AdminField label="Structured data type">
          <select
            value={value.structuredDataType}
            onChange={event =>
              onChange({ structuredDataType: event.target.value as SeoStructuredDataType })
            }
            style={inputStyle}
          >
            {structuredDataOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Status">
          <select
            value={value.status}
            onChange={event => {
              const status = event.target.value as SeoVisibilityStatus;
              onChange({ status, visible: status === 'published' });
            }}
            style={inputStyle}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
          </select>
        </AdminField>
        <AdminField label="Sort / display order">
          <input
            type="number"
            value={value.sortOrder}
            onChange={event => onChange({ sortOrder: Number(event.target.value) || 0 })}
            style={inputStyle}
          />
        </AdminField>
        <AdminField label="Image alt text">
          <input
            value={value.altText}
            onChange={event => onChange({ altText: event.target.value })}
            placeholder={`${titleFallback} preview image`}
            style={inputStyle}
          />
        </AdminField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <AdminImageField
          label="Thumbnail / cover image"
          value={value.coverImage}
          onChange={nextValue => onChange({ coverImage: nextValue })}
          onFileSelected={async file => {
            const nextUrl = await onCoverUpload?.(file);
            if (nextUrl) {
              onChange({ coverImage: String(nextUrl) });
            }
          }}
          uploading={uploadingCover}
          uploadProfile={coverUploadProfile}
          previewHeight={160}
        />
        <AdminImageField
          label="OG / social share image"
          value={value.ogImage}
          onChange={nextValue => onChange({ ogImage: nextValue })}
          onFileSelected={async file => {
            const nextUrl = await onOgUpload?.(file);
            if (nextUrl) {
              onChange({ ogImage: String(nextUrl), socialImage: String(nextUrl) });
            }
          }}
          uploading={uploadingOg}
          uploadProfile={ogUploadProfile}
          previewHeight={160}
        />
      </div>

      <AdminField label="Visibility controls" full hint="These switches control public display, homepage inclusion, portfolio/page inclusion, and featured ordering.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {([
            ['visible', 'Visible / published', true],
            ['showOnHomepage', 'Show on homepage', showHomepageToggle],
            ['showOnPortfolio', 'Show on portfolio/page', showPortfolioToggle],
            ['featured', 'Featured', true],
          ] as Array<[keyof SeoVisibilityValue, string, boolean]>).filter(([, , enabled]) => enabled).map(([key, label]) => (
            <label
              key={String(key)}
              style={{
                alignItems: 'center',
                background: tokens.fieldSoft,
                border: `1px solid ${tokens.line}`,
                borderRadius: 16,
                color: tokens.text,
                display: 'flex',
                fontSize: 13,
                fontWeight: 800,
                gap: 10,
                padding: 12,
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(value[key as keyof SeoVisibilityValue])}
                onChange={event => onChange({ [key]: event.target.checked } as Partial<SeoVisibilityValue>)}
              />
              {label}
            </label>
          ))}
        </div>
      </AdminField>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        <PreviewCard label="Google search preview" title={title} description={description} url={generatedCanonical} />
        <PreviewCard label="Facebook / LinkedIn preview" title={title} description={description} url={generatedCanonical} image={image} />
        <PreviewCard label="WhatsApp preview" title={title} description={description} url={generatedCanonical} image={image} compact />
      </div>
    </div>
  );
}

function PreviewCard({
  label,
  title,
  description,
  url,
  image,
  compact = false,
}: {
  label: string;
  title: string;
  description: string;
  url: string;
  image?: string;
  compact?: boolean;
}) {
  const tokens = useAdminThemeTokens();

  return (
    <div
      style={{
        border: `1px solid ${tokens.line}`,
        borderRadius: 20,
        background: tokens.fieldSoft,
        padding: 14,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ color: tokens.subtle, fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
        {label}
      </div>
      {image ? (
        <img
          src={image}
          alt=""
          style={{
            width: '100%',
            height: compact ? 86 : 120,
            objectFit: 'cover',
            borderRadius: 14,
            border: `1px solid ${tokens.line}`,
          }}
        />
      ) : null}
      <div style={{ color: '#2563eb', fontSize: compact ? 14 : 16, fontWeight: 800, lineHeight: 1.35 }}>
        {title || 'SEO title preview'}
      </div>
      <div style={{ color: tokens.muted, fontSize: 12, lineHeight: 1.55 }}>
        {description || 'SEO description preview appears here.'}
      </div>
      <div style={{ color: '#16a34a', fontSize: 11, fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
        {url}
      </div>
    </div>
  );
}
