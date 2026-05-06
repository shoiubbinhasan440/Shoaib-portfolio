'use client';

import React from 'react';

import {
  AdminField,
  AdminSectionTabs,
  AdminChip,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import AdminImageField from '@/components/admin/AdminImageField';
import {
  buildCanonicalUrl,
  getSeoChecklist,
  getSeoScore,
  SEO_PAGE_OPTIONS,
  type SeoPageId,
  type SeoPageSettings,
  type SiteSeoSettings,
  type TwitterCardType,
} from '@/lib/site-seo';

type SeoEditorProps = {
  onChange: (value: SiteSeoSettings) => void;
  onError?: (message: string) => void;
  onImageUpload: (
    scope: 'default' | SeoPageId,
    file: File
  ) => void | Promise<void>;
  siteName: string;
  uploadingField: string;
  value: SiteSeoSettings;
};

const twitterOptions: Array<{ label: string; value: TwitterCardType }> = [
  { value: 'summary_large_image', label: 'Large Image' },
  { value: 'summary', label: 'Summary' },
];

function scoreTone(score: number) {
  if (score >= 80) {
    return 'success';
  }

  if (score >= 55) {
    return 'accent';
  }

  return 'danger';
}

export default function SeoEditor({
  onChange,
  onError,
  onImageUpload,
  siteName,
  uploadingField,
  value,
}: SeoEditorProps) {
  const tokens = useAdminThemeTokens();
  const [activeTab, setActiveTab] = React.useState<'global' | SeoPageId>('global');

  function updateGlobal<K extends keyof SiteSeoSettings>(key: K, nextValue: SiteSeoSettings[K]) {
    onChange({
      ...value,
      [key]: nextValue,
    });
  }

  function updatePage<K extends keyof SeoPageSettings>(
    pageId: SeoPageId,
    key: K,
    nextValue: SeoPageSettings[K]
  ) {
    onChange({
      ...value,
      pages: {
        ...value.pages,
        [pageId]: {
          ...value.pages[pageId],
          [key]: nextValue,
        },
      },
    });
  }

  const pageTabs = [
    { id: 'global' as const, label: 'Global SEO', description: 'Site-wide metadata and crawl settings' },
    ...SEO_PAGE_OPTIONS.map(page => ({
      id: page.id,
      label: page.label,
      description: `${page.label} page metadata and social share settings`,
    })),
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          borderRadius: 22,
          border: `1px solid ${tokens.line}`,
          background: tokens.fieldSoft,
          padding: 18,
        }}
      >
        <div
          style={{
            color: tokens.accentText,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Honest SEO Workflow
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
          Optimize what the site can actually control
        </div>
        <div style={{ color: tokens.muted, fontSize: 14, lineHeight: 1.75 }}>
          These settings improve metadata quality, crawl hints, and social previews. They do not guarantee rankings, but they help keep the site technically prepared and easier to share.
        </div>
      </div>

      <AdminSectionTabs items={pageTabs} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'global' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div
            style={{
              borderRadius: 22,
              border: `1px solid ${tokens.line}`,
              background: tokens.panel,
              padding: 18,
              boxShadow: tokens.softShadow,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Global SEO</div>
            <div style={{ color: tokens.muted, fontSize: 14, lineHeight: 1.75, marginBottom: 16 }}>
              Set the default title, description, canonical domain, robots behavior, sitemap support, and the default social share image.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
              }}
            >
              <AdminField label="Global site title" hint="Used as the home page title unless a page overrides it.">
                <input
                  value={value.siteTitle}
                  onChange={event => updateGlobal('siteTitle', event.target.value)}
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </AdminField>
              <AdminField
                label="Canonical site URL"
                hint="Use the full live domain, for example `https://yourdomain.com`."
              >
                <input
                  value={value.canonicalUrl}
                  onChange={event => updateGlobal('canonicalUrl', event.target.value)}
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </AdminField>
              <AdminField label="Global keywords" hint="Optional comma-separated brand and service keywords.">
                <input
                  value={value.keywords}
                  onChange={event => updateGlobal('keywords', event.target.value)}
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </AdminField>
              <AdminField label="Twitter card" hint="Choose how shared links should render on Twitter/X.">
                <select
                  value={value.twitterCard}
                  onChange={event =>
                    updateGlobal('twitterCard', event.target.value as TwitterCardType)
                  }
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                >
                  {twitterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Global meta description" full hint="This is the default description for the home page and a fallback for other pages.">
                <textarea
                  value={value.metaDescription}
                  onChange={event => updateGlobal('metaDescription', event.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 110,
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </AdminField>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.3fr) minmax(300px, 0.9fr)',
              gap: 16,
            }}
          >
            <div
              style={{
                borderRadius: 22,
                border: `1px solid ${tokens.line}`,
                background: tokens.panel,
                padding: 18,
                boxShadow: tokens.softShadow,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Default social preview</div>
              <div style={{ color: tokens.muted, fontSize: 14, lineHeight: 1.75, marginBottom: 16 }}>
                This image is used when a specific page does not set its own OG image.
              </div>
              <AdminImageField
                label="Default OG image / social preview"
                value={value.defaultOgImage}
                onChange={nextValue => updateGlobal('defaultOgImage', nextValue)}
                onFileSelected={file => onImageUpload('default', file)}
                uploading={uploadingField === 'default'}
                onError={onError}
                uploadProfile="showcase"
                hint="Used as the fallback image for link shares on social apps."
                previewAlt={`${siteName} default social preview`}
                full
              />
              <AdminField
                label="Default OG image alt text"
                hint="Useful for accessibility metadata and richer social previews."
                full
              >
                <input
                  value={value.defaultOgImageAlt}
                  onChange={event => updateGlobal('defaultOgImageAlt', event.target.value)}
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </AdminField>
            </div>

            <div
              style={{
                borderRadius: 22,
                border: `1px solid ${tokens.line}`,
                background: tokens.panel,
                padding: 18,
                boxShadow: tokens.softShadow,
                display: 'grid',
                gap: 12,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>Robots, sitemap, and schema</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={value.robotsIndex}
                  onChange={event => updateGlobal('robotsIndex', event.target.checked)}
                />
                <span>Allow indexing</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={value.robotsFollow}
                  onChange={event => updateGlobal('robotsFollow', event.target.checked)}
                />
                <span>Allow link following</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={value.robotsNoarchive}
                  onChange={event => updateGlobal('robotsNoarchive', event.target.checked)}
                />
                <span>Request noarchive</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={value.sitemapEnabled}
                  onChange={event => updateGlobal('sitemapEnabled', event.target.checked)}
                />
                <span>Enable sitemap route</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={value.sitemapIncludeImages}
                  onChange={event => updateGlobal('sitemapIncludeImages', event.target.checked)}
                />
                <span>Include image references when possible</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={value.structuredDataEnabled}
                  onChange={event =>
                    updateGlobal('structuredDataEnabled', event.target.checked)
                  }
                />
                <span>Enable structured data basics</span>
              </label>
              <AdminField label="Structured data type" hint="Choose the most honest representation for the portfolio site.">
                <select
                  value={value.structuredDataType}
                  onChange={event =>
                    updateGlobal(
                      'structuredDataType',
                      event.target.value as SiteSeoSettings['structuredDataType']
                    )
                  }
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="person">Person / Portfolio</option>
                  <option value="professional-service">Professional Service</option>
                </select>
              </AdminField>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab !== 'global' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.9fr)',
            gap: 16,
          }}
        >
          <div
            style={{
              borderRadius: 22,
              border: `1px solid ${tokens.line}`,
              background: tokens.panel,
              padding: 18,
              boxShadow: tokens.softShadow,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
                  {SEO_PAGE_OPTIONS.find(page => page.id === activeTab)?.label} SEO
                </div>
                <div style={{ color: tokens.muted, fontSize: 14, lineHeight: 1.75 }}>
                  Set page-specific metadata when this route needs more precise search or social copy than the global defaults.
                </div>
              </div>
              <AdminChip tone={scoreTone(getSeoScore(value, activeTab, siteName)) as 'accent' | 'success' | 'danger'}>
                SEO Score {getSeoScore(value, activeTab, siteName)}
              </AdminChip>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
              }}
            >
              <AdminField label="SEO title" hint="This is the page title shown in search results and browser tabs.">
                <input
                  value={value.pages[activeTab].seoTitle}
                  onChange={event => updatePage(activeTab, 'seoTitle', event.target.value)}
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </AdminField>
              <AdminField label="Canonical path" hint="Use a clean path like `/about` or `/tutorial`.">
                <input
                  value={value.pages[activeTab].canonicalPath}
                  onChange={event =>
                    updatePage(activeTab, 'canonicalPath', event.target.value)
                  }
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </AdminField>
              <AdminField label="Page keywords" hint="Optional comma-separated keywords for this page only.">
                <input
                  value={value.pages[activeTab].keywords}
                  onChange={event => updatePage(activeTab, 'keywords', event.target.value)}
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </AdminField>
              <AdminField label="Twitter card" hint="Override the global Twitter card setting if needed.">
                <select
                  value={value.pages[activeTab].twitterCard}
                  onChange={event =>
                    updatePage(
                      activeTab,
                      'twitterCard',
                      event.target.value as TwitterCardType
                    )
                  }
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                >
                  {twitterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="SEO description" full hint="Describe what the visitor should expect from this page in plain language.">
                <textarea
                  value={value.pages[activeTab].seoDescription}
                  onChange={event =>
                    updatePage(activeTab, 'seoDescription', event.target.value)
                  }
                  style={{
                    width: '100%',
                    minHeight: 110,
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </AdminField>
              <AdminField label="OG title" hint="Optional override for social shares. If left blank, the SEO title is used.">
                <input
                  value={value.pages[activeTab].ogTitle}
                  onChange={event => updatePage(activeTab, 'ogTitle', event.target.value)}
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </AdminField>
              <AdminField label="OG description" hint="Optional override for social shares. If left blank, the SEO description is used.">
                <input
                  value={value.pages[activeTab].ogDescription}
                  onChange={event =>
                    updatePage(activeTab, 'ogDescription', event.target.value)
                  }
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </AdminField>
              <AdminImageField
                label="OG image"
                value={value.pages[activeTab].ogImage}
                onChange={nextValue => updatePage(activeTab, 'ogImage', nextValue)}
                onFileSelected={file => onImageUpload(activeTab, file)}
                uploading={uploadingField === activeTab}
                onError={onError}
                uploadProfile="showcase"
                previewAlt={`${activeTab} social preview`}
                full
              />
              <AdminField label="OG image alt text" full hint="Use this when the page uses its own social preview image.">
                <input
                  value={value.pages[activeTab].ogImageAlt}
                  onChange={event =>
                    updatePage(activeTab, 'ogImageAlt', event.target.value)
                  }
                  style={{
                    width: '100%',
                    background: tokens.field,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 14,
                    color: tokens.text,
                    padding: '12px 14px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </AdminField>
            </div>
          </div>

          <div
            style={{
              borderRadius: 22,
              border: `1px solid ${tokens.line}`,
              background: tokens.panel,
              padding: 18,
              boxShadow: tokens.softShadow,
              display: 'grid',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Checklist</div>
              <div style={{ color: tokens.muted, fontSize: 14, lineHeight: 1.75 }}>
                Score based on the actual fields above. Warnings are suggestions, not promises.
              </div>
            </div>
            <div
              style={{
                borderRadius: 18,
                border: `1px solid ${tokens.line}`,
                background: tokens.fieldSoft,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
                {getSeoScore(value, activeTab, siteName)}
              </div>
              <div style={{ color: tokens.muted, fontSize: 13 }}>
                {buildCanonicalUrl(value.canonicalUrl, value.pages[activeTab].canonicalPath) ||
                  'Canonical preview appears here after a site URL is set.'}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {getSeoChecklist(value, activeTab, siteName).map(item => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 18,
                    border: `1px solid ${tokens.line}`,
                    background: tokens.fieldSoft,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{item.label}</div>
                    <AdminChip tone={item.status === 'pass' ? 'success' : 'danger'}>
                      {item.status === 'pass' ? 'OK' : 'Review'}
                    </AdminChip>
                  </div>
                  <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.65 }}>
                    {item.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
