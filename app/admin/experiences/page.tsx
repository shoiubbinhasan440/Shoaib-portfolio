'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AdminImageField from '@/components/admin/AdminImageField';
import AdminShell from '@/components/admin/AdminShell';
import AdminTextStyleControls from '@/components/admin/AdminTextStyleControls';
import { adminSelectRows } from '@/lib/admin-data-client';
import { adminUploadFile } from '@/lib/admin-storage-client';
import { verifyAdminSessionClient } from '@/lib/admin-session-client';
import {
  AdminActionButton,
  AdminBuilderSection,
  AdminField,
  AdminNotice,
  getAdminInputStyle,
  getAdminTextareaStyle,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import {
  ABOUT_SYSTEM_SETTING_KEY,
  createDefaultExperienceItem,
  getAboutSystemConfig,
  normalizeExperienceAchievements,
  serializeAboutSystemConfig,
  type AboutExperienceConfig,
  type AboutSystemConfig,
  type ExperienceAchievement,
  type ExperienceBulletAlignment,
  type ExperienceBulletBackground,
  type ExperienceBulletFontSize,
  type ExperienceBulletFontWeight,
  type ExperienceBulletIcon,
  type ExperienceBulletSpacing,
  type ExperienceEmploymentType,
  type ExperienceItem,
  type ExperienceLayoutStyle,
  type ExperienceLocationType,
} from '@/lib/about-content';
import { toSettingMap } from '@/lib/hero-settings';
import { writeSiteSetting } from '@/lib/site-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const employmentTypeOptions: ExperienceEmploymentType[] = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Volunteer',
  'Internship',
];

const locationTypeOptions: ExperienceLocationType[] = ['On-site', 'Hybrid', 'Remote'];

const experienceLayoutOptions: Array<{ value: ExperienceLayoutStyle; label: string }> = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'card-grid', label: 'Card Grid' },
  { value: 'compact-list', label: 'Compact List' },
];

const monthOptions = [
  ['01', 'January'],
  ['02', 'February'],
  ['03', 'March'],
  ['04', 'April'],
  ['05', 'May'],
  ['06', 'June'],
  ['07', 'July'],
  ['08', 'August'],
  ['09', 'September'],
  ['10', 'October'],
  ['11', 'November'],
  ['12', 'December'],
];

const bulletIcons: Array<{ value: ExperienceBulletIcon; label: string }> = [
  { value: 'dot', label: 'Dot' },
  { value: 'check', label: 'Check' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'star', label: 'Star' },
  { value: 'line', label: 'Minimal line' },
];

const bulletBackgrounds: Array<{ value: ExperienceBulletBackground; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'soft-pill', label: 'Soft pill' },
  { value: 'subtle-card', label: 'Subtle card' },
  { value: 'glow-accent', label: 'Glow accent' },
];

function createExperience(): ExperienceItem {
  const next = createDefaultExperienceItem();
  return {
    ...next,
    sortOrder: Date.now(),
    startMonth: '06',
    startYear: String(new Date().getFullYear()),
    isCurrent: true,
    achievements: [
      {
        text: '',
        highlighted: false,
      },
    ],
  };
}

function createAchievement(): ExperienceAchievement {
  return {
    text: '',
    highlighted: false,
  };
}

function getEditableAchievements(item: ExperienceItem) {
  return item.achievements.map(point => ({
    text: point.text || '',
    highlighted: Boolean(point.highlighted),
    icon: point.icon,
    color: point.color || '',
  }));
}

function cleanExperienceDraft(config: AboutSystemConfig): AboutSystemConfig {
  return {
    ...config,
    experience: {
      ...config.experience,
      items: config.experience.items.map(item => ({
        ...item,
        achievements: normalizeExperienceAchievements(item.achievements),
      })),
    },
  };
}

export default function AdminExperiencesPage() {
  const router = useRouter();
  const tokens = useAdminThemeTokens();
  const [aboutSystem, setAboutSystem] = useState<AboutSystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState('');
  const [msg, setMsg] = useState('');

  async function loadSystem() {
    const data = await adminSelectRows<Array<{ key: string; value: string }>>(
      'site_settings'
    );
    const map = toSettingMap(data || []);
    setAboutSystem(getAboutSystemConfig(map));
  }

  useEffect(() => {
    let active = true;

    async function verifyAndLoad() {
      const ok = await verifyAdminSessionClient();
      if (!active) {
        return;
      }
      if (!ok) {
        router.replace('/admin/login');
        return;
      }
      try {
        await loadSystem();
      } finally {
        setLoading(false);
      }
    }

    void verifyAndLoad();

    return () => {
      active = false;
    };
  }, [router]);

  const experience = aboutSystem?.experience;
  const sortedItems = useMemo(
    () => [...(experience?.items || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [experience?.items]
  );

  function updateExperienceConfig<K extends keyof AboutExperienceConfig>(
    key: K,
    value: AboutExperienceConfig[K]
  ) {
    setAboutSystem(current =>
      current
        ? {
            ...current,
            experience: {
              ...current.experience,
              [key]: value,
            },
          }
        : current
    );
  }

  function updateExperienceItem(itemId: string, patch: Partial<ExperienceItem>) {
    setAboutSystem(current =>
      current
        ? {
            ...current,
            experience: {
              ...current.experience,
              items: current.experience.items.map(item =>
                item.id === itemId ? { ...item, ...patch } : item
              ),
            },
          }
        : current
    );
  }

  function updateAchievements(item: ExperienceItem, achievements: ExperienceAchievement[]) {
    updateExperienceItem(item.id, {
      achievements,
    });
  }

  async function uploadLogo(item: ExperienceItem, file: File) {
    const ext = file.name.split('.').pop() || 'png';
    const fieldKey = `experience-logo-${item.id}`;
    setUploadingField(fieldKey);

    try {
      const { publicUrl } = await adminUploadFile('media', `about/${fieldKey}-${Date.now()}.${ext}`, file, {
        uploadProfile: 'logo',
      });
      updateExperienceItem(item.id, { logoUrl: publicUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Experience logo upload failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setUploadingField('');
    }
  }

  async function saveSystem() {
    if (!aboutSystem) {
      return;
    }

    setSaving(true);
    try {
      await writeSiteSetting(
        supabase,
        ABOUT_SYSTEM_SETTING_KEY,
        serializeAboutSystemConfig(cleanExperienceDraft(aboutSystem))
      );
      await loadSystem();
      setMsg('✅ Experience Manager saved successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Experience save failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !aboutSystem || !experience) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: tokens.dark ? '#020617' : '#f8fbff',
          color: tokens.muted,
        }}
      >
        Loading Experience Manager...
      </div>
    );
  }

  const inputStyle = getAdminInputStyle(tokens);
  const textareaStyle = getAdminTextareaStyle(tokens);

  return (
    <AdminShell
      eyebrow="Content Manager"
      title="Experience Manager"
      description="Manage professional roles, company logos, dates, responsibilities, highlighted bullets, skills, ordering, and page visibility from one dedicated workspace."
      actions={
        <>
          <AdminActionButton href="/admin/about" variant="secondary">
            About Builder
          </AdminActionButton>
          <AdminActionButton onClick={() => void saveSystem()} disabled={saving}>
            {saving ? 'Saving...' : 'Save Experience'}
          </AdminActionButton>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {msg ? <AdminNotice message={msg} /> : null}

        <AdminBuilderSection
          title="Display Controls"
          description="These settings control where the experience block appears and how bullet styling renders on the homepage preview and About page."
          status={`${sortedItems.filter(item => item.isVisible).length} visible`}
          tabs={[
            {
              id: 'display',
              label: 'Display',
              description: 'Section labels, visibility, limits, layout, and bullet typography.',
              content: (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={experience.showOnHomepage}
                        onChange={event => updateExperienceConfig('showOnHomepage', event.target.checked)}
                      />
                      Show on Homepage About
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={experience.showOnAboutPage}
                        onChange={event => updateExperienceConfig('showOnAboutPage', event.target.checked)}
                      />
                      Show on About Page
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <AdminField label="Section title">
                      <input value={experience.title} onChange={event => updateExperienceConfig('title', event.target.value)} style={inputStyle} />
                    </AdminField>
                    <AdminField label="View full label">
                      <input value={experience.viewAllLabel} onChange={event => updateExperienceConfig('viewAllLabel', event.target.value)} style={inputStyle} />
                    </AdminField>
                    <AdminField label="Homepage item limit">
                      <input type="number" min={1} max={8} value={experience.homepageItemLimit} onChange={event => updateExperienceConfig('homepageItemLimit', Number(event.target.value))} style={inputStyle} />
                    </AdminField>
                    <AdminField label="Layout style">
                      <select value={experience.layoutStyle} onChange={event => updateExperienceConfig('layoutStyle', event.target.value as ExperienceLayoutStyle)} style={inputStyle}>
                        {experienceLayoutOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </AdminField>
                    <AdminField label="Section subtitle" full>
                      <textarea value={experience.subtitle} onChange={event => updateExperienceConfig('subtitle', event.target.value)} rows={3} style={textareaStyle} />
                    </AdminField>
                  </div>

                  <AdminTextStyleControls
                    title="Bullet Typography"
                    helper="These controls affect the responsibility/achievement bullets rendered under each role."
                    value={{
                      fontSize: experience.bulletFontSize,
                      fontWeight: experience.bulletFontWeight,
                      textAlign: experience.bulletAlignment,
                      lightColor: experience.bulletTextColor || '#475569',
                      darkColor: experience.bulletTextColor || '#cbd5e1',
                      accentColor: experience.bulletHighlightColor,
                      backgroundStyle: experience.bulletBackgroundStyle,
                      spacing: experience.bulletSpacing,
                    }}
                    onChange={nextValue => {
                      updateExperienceConfig('bulletFontSize', (nextValue.fontSize || 'sm') as ExperienceBulletFontSize);
                      updateExperienceConfig('bulletFontWeight', (nextValue.fontWeight || 'medium') as ExperienceBulletFontWeight);
                      updateExperienceConfig('bulletAlignment', (nextValue.textAlign || 'left') as ExperienceBulletAlignment);
                      updateExperienceConfig('bulletTextColor', nextValue.lightColor || '');
                      updateExperienceConfig('bulletHighlightColor', nextValue.accentColor || '#38bdf8');
                      updateExperienceConfig('bulletBackgroundStyle', (nextValue.backgroundStyle || 'none') as ExperienceBulletBackground);
                      updateExperienceConfig('bulletSpacing', (nextValue.spacing || 'normal') as ExperienceBulletSpacing);
                    }}
                    onReset={() => {
                      updateExperienceConfig('bulletStyle', 'check');
                      updateExperienceConfig('bulletTextColor', '');
                      updateExperienceConfig('bulletHighlightColor', '#38bdf8');
                      updateExperienceConfig('bulletIconColor', '#38bdf8');
                      updateExperienceConfig('bulletBackgroundStyle', 'none');
                      updateExperienceConfig('bulletSpacing', 'normal');
                      updateExperienceConfig('bulletFontSize', 'sm');
                      updateExperienceConfig('bulletFontWeight', 'medium');
                      updateExperienceConfig('bulletAlignment', 'left');
                      updateExperienceConfig('showBulletIcons', true);
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                    <AdminField label="Default bullet style">
                      <select value={experience.bulletStyle} onChange={event => updateExperienceConfig('bulletStyle', event.target.value as ExperienceBulletIcon)} style={inputStyle}>
                        {bulletIcons.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </AdminField>
                    <AdminField label="Icon color">
                      <input type="color" value={experience.bulletIconColor || '#38bdf8'} onChange={event => updateExperienceConfig('bulletIconColor', event.target.value)} style={{ ...inputStyle, padding: 6, height: 45 }} />
                    </AdminField>
                    <AdminField label="Highlight color">
                      <input type="color" value={experience.bulletHighlightColor || '#38bdf8'} onChange={event => updateExperienceConfig('bulletHighlightColor', event.target.value)} style={{ ...inputStyle, padding: 6, height: 45 }} />
                    </AdminField>
                    <AdminField label="Bullet background">
                      <select value={experience.bulletBackgroundStyle} onChange={event => updateExperienceConfig('bulletBackgroundStyle', event.target.value as ExperienceBulletBackground)} style={inputStyle}>
                        {bulletBackgrounds.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </AdminField>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                      <input
                        type="checkbox"
                        checked={experience.showBulletIcons}
                        onChange={event => updateExperienceConfig('showBulletIcons', event.target.checked)}
                      />
                      Show bullet icons
                    </label>
                  </div>
                </div>
              ),
            },
          ]}
        />

        <AdminBuilderSection
          title="Experience Items"
          description="Add, edit, delete, reorder, upload logos, and style each responsibility bullet individually."
          headerControls={
            <AdminActionButton
              onClick={() => updateExperienceConfig('items', [...experience.items, createExperience()])}
            >
              + Add Experience
            </AdminActionButton>
          }
          tabs={[
            {
              id: 'items',
              label: 'Items',
              description: 'Each role keeps its own details, visibility, logo, skills, and achievement bullets.',
              content: (
                <div style={{ display: 'grid', gap: 14 }}>
                  {sortedItems.length === 0 ? (
                    <div style={{ color: tokens.muted, border: `1px dashed ${tokens.line}`, borderRadius: 18, padding: 18 }}>
                      No experience items yet. Add one to start building the timeline.
                    </div>
                  ) : null}
                  {sortedItems.map(item => {
                    const achievements = getEditableAchievements(item);

                    return (
                      <div
                        key={item.id}
                        style={{
                          border: `1px solid ${tokens.line}`,
                          borderRadius: 22,
                          background: tokens.fieldSoft,
                          padding: 16,
                          display: 'grid',
                          gap: 14,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <strong>{item.roleTitle || 'New role'}</strong>
                            <div style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                              {item.organizationName || 'Organization name'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input type="checkbox" checked={item.isVisible} onChange={event => updateExperienceItem(item.id, { isVisible: event.target.checked })} />
                              Visible
                            </label>
                            <button
                              type="button"
                              onClick={() => updateExperienceConfig('items', experience.items.filter(candidate => candidate.id !== item.id))}
                              style={{
                                background: tokens.dangerSoft,
                                color: tokens.dangerText,
                                border: `1px solid ${tokens.dangerSoft}`,
                                borderRadius: 10,
                                cursor: 'pointer',
                                padding: '8px 10px',
                                fontWeight: 800,
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                          <AdminField label="Organization">
                            <input value={item.organizationName} onChange={event => updateExperienceItem(item.id, { organizationName: event.target.value })} style={inputStyle} />
                          </AdminField>
                          <AdminField label="Role title">
                            <input value={item.roleTitle} onChange={event => updateExperienceItem(item.id, { roleTitle: event.target.value })} style={inputStyle} />
                          </AdminField>
                          <AdminField label="Employment type">
                            <select value={item.employmentType} onChange={event => updateExperienceItem(item.id, { employmentType: event.target.value as ExperienceEmploymentType })} style={inputStyle}>
                              {employmentTypeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                          </AdminField>
                          <AdminField label="Display order">
                            <input type="number" value={item.sortOrder} onChange={event => updateExperienceItem(item.id, { sortOrder: Number(event.target.value) })} style={inputStyle} />
                          </AdminField>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                          <AdminField label="Start month">
                            <select value={item.startMonth} onChange={event => updateExperienceItem(item.id, { startMonth: event.target.value })} style={inputStyle}>
                              <option value="">Month</option>
                              {monthOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                          </AdminField>
                          <AdminField label="Start year">
                            <input value={item.startYear} onChange={event => updateExperienceItem(item.id, { startYear: event.target.value })} style={inputStyle} placeholder="2025" />
                          </AdminField>
                          <AdminField label="End month">
                            <select value={item.endMonth} onChange={event => updateExperienceItem(item.id, { endMonth: event.target.value })} style={inputStyle} disabled={item.isCurrent}>
                              <option value="">Month</option>
                              {monthOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                          </AdminField>
                          <AdminField label="End year">
                            <input value={item.endYear} onChange={event => updateExperienceItem(item.id, { endYear: event.target.value })} style={inputStyle} disabled={item.isCurrent} placeholder="2026" />
                          </AdminField>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                            <input
                              type="checkbox"
                              checked={item.isCurrent}
                              onChange={event => updateExperienceItem(item.id, {
                                isCurrent: event.target.checked,
                                endMonth: event.target.checked ? '' : item.endMonth,
                                endYear: event.target.checked ? '' : item.endYear,
                              })}
                            />
                            Current role
                          </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                          <AdminField label="Location">
                            <input value={item.location} onChange={event => updateExperienceItem(item.id, { location: event.target.value })} style={inputStyle} placeholder="Dhaka, Bangladesh" />
                          </AdminField>
                          <AdminField label="Location type">
                            <select value={item.locationType} onChange={event => updateExperienceItem(item.id, { locationType: event.target.value as ExperienceLocationType })} style={inputStyle}>
                              {locationTypeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                          </AdminField>
                          <AdminField label="Company website/profile">
                            <input value={item.websiteUrl} onChange={event => updateExperienceItem(item.id, { websiteUrl: event.target.value })} style={inputStyle} placeholder="https://..." />
                          </AdminField>
                        </div>

                        <AdminField label="Short description">
                          <textarea value={item.description} onChange={event => updateExperienceItem(item.id, { description: event.target.value })} rows={3} style={textareaStyle} />
                        </AdminField>

                        <div style={{ display: 'grid', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                              <strong>Responsibilities / achievements</strong>
                              <div style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>
                                Edit bullets one by one, mark important points, and override icon or color when needed.
                              </div>
                            </div>
                            <AdminActionButton
                              variant="secondary"
                              onClick={() => updateAchievements(item, [...achievements, createAchievement()])}
                            >
                              + Add bullet
                            </AdminActionButton>
                          </div>

                          {achievements.map((point, pointIndex) => (
                            <div
                              key={`${item.id}-achievement-${pointIndex}`}
                              style={{
                                border: `1px solid ${tokens.line}`,
                                borderRadius: 16,
                                background: tokens.field,
                                padding: 12,
                                display: 'grid',
                                gap: 10,
                              }}
                            >
                              <AdminField label={`Bullet ${pointIndex + 1}`} full>
                                <textarea
                                  value={point.text}
                                  onChange={event => {
                                    const next = [...achievements];
                                    next[pointIndex] = { ...point, text: event.target.value };
                                    updateAchievements(item, next);
                                  }}
                                  rows={2}
                                  style={textareaStyle}
                                  placeholder="Describe one responsibility or achievement"
                                />
                              </AdminField>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <input
                                    type="checkbox"
                                    checked={point.highlighted}
                                    onChange={event => {
                                      const next = [...achievements];
                                      next[pointIndex] = { ...point, highlighted: event.target.checked };
                                      updateAchievements(item, next);
                                    }}
                                  />
                                  Highlight important bullet
                                </label>
                                <AdminField label="Bullet icon">
                                  <select
                                    value={point.icon || ''}
                                    onChange={event => {
                                      const next = [...achievements];
                                      next[pointIndex] = {
                                        ...point,
                                        icon: event.target.value ? event.target.value as ExperienceBulletIcon : undefined,
                                      };
                                      updateAchievements(item, next);
                                    }}
                                    style={inputStyle}
                                  >
                                    <option value="">Use default</option>
                                    {bulletIcons.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                  </select>
                                </AdminField>
                                <AdminField label="Bullet text/icon color">
                                  <input
                                    type="color"
                                    value={point.color || experience.bulletHighlightColor || '#38bdf8'}
                                    onChange={event => {
                                      const next = [...achievements];
                                      next[pointIndex] = { ...point, color: event.target.value };
                                      updateAchievements(item, next);
                                    }}
                                    style={{ ...inputStyle, padding: 6, height: 45 }}
                                  />
                                </AdminField>
                                <div style={{ display: 'flex', alignItems: 'end' }}>
                                  <button
                                    type="button"
                                    onClick={() => updateAchievements(item, achievements.filter((_, index) => index !== pointIndex))}
                                    style={{
                                      width: '100%',
                                      border: `1px solid ${tokens.line}`,
                                      background: tokens.fieldSoft,
                                      color: tokens.text,
                                      borderRadius: 12,
                                      padding: '12px 14px',
                                      cursor: 'pointer',
                                      fontWeight: 800,
                                    }}
                                  >
                                    Remove bullet
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <AdminField label="Related skills" full>
                          <textarea
                            value={item.skills.join('\n')}
                            onChange={event => updateExperienceItem(item.id, {
                              skills: event.target.value.split('\n').map(value => value.trim()).filter(Boolean),
                            })}
                            rows={4}
                            style={textareaStyle}
                            placeholder="Graphic Design&#10;Video Editing&#10;Motion Graphics"
                          />
                        </AdminField>

                        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" checked={item.showHomepage} onChange={event => updateExperienceItem(item.id, { showHomepage: event.target.checked })} />
                            Show on Homepage
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" checked={item.showAboutPage} onChange={event => updateExperienceItem(item.id, { showAboutPage: event.target.checked })} />
                            Show on About Page
                          </label>
                        </div>

                        <AdminImageField
                          label="Company logo"
                          value={item.logoUrl}
                          onChange={value => updateExperienceItem(item.id, { logoUrl: value })}
                          onFileSelected={file => void uploadLogo(item, file)}
                          uploading={uploadingField === `experience-logo-${item.id}`}
                          onError={message => setMsg(message)}
                          uploadProfile="logo"
                          hint="Square logo/icon. Max 100KB."
                          previewHeight={120}
                          full
                        />
                      </div>
                    );
                  })}
                </div>
              ),
            },
          ]}
        />
      </div>
    </AdminShell>
  );
}
