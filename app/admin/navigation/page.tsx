'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AdminImageField from '@/components/admin/AdminImageField';
import AdminShell from '@/components/admin/AdminShell';
import { adminUploadFile } from '@/lib/admin-storage-client';
import { verifyAdminSessionClient } from '@/lib/admin-session-client';
import {
  AdminActionButton,
  AdminBuilderSection,
  AdminChip,
  AdminField,
  AdminNotice,
  getAdminInputStyle,
  getAdminTextareaStyle,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import { toSettingMap } from '@/lib/hero-settings';
import {
  createDefaultNavigationConfig,
  createDropdownChild,
  createNavigationItem,
  DEFAULT_USER_LOGIN_ROUTE,
  getNavigationBranding,
  getNextNavigationOrder,
  getVisibleNavigationItems,
  NAVIGATION_ICON_SUGGESTIONS,
  NAVIGATION_PRESET_OPTIONS,
  NAVIGATION_SETTINGS_KEY,
  parseNavigationConfig,
  resolveLoginButton,
  serializeNavigationConfig,
  type NavigationConfig,
  type NavigationItem,
  type NavigationItemType,
} from '@/lib/navigation-config';
import { writeSiteSetting } from '@/lib/site-settings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SettingRow = { key: string; value: string };
type LegacyRow = { id: string; label: string; href: string; order_num: number; visible: boolean };

function normalizeItemOrder(items: NavigationItem[]): NavigationItem[] {
  return items.map((item, index) => ({
    ...item,
    order: index,
    children: normalizeItemOrder(item.children || []),
  }));
}

function sortItems(items: NavigationItem[]): NavigationItem[] {
  return normalizeItemOrder(
    [...items].sort((leftItem, rightItem) => leftItem.order - rightItem.order)
  );
}

function replaceItem(
  items: NavigationItem[],
  itemId: string,
  updater: (item: NavigationItem) => NavigationItem
): NavigationItem[] {
  return items.map(item => {
    if (item.id === itemId) {
      return updater(item);
    }

    if (item.children.length > 0) {
      return {
        ...item,
        children: replaceItem(item.children, itemId, updater),
      };
    }

    return item;
  });
}

function removeItem(items: NavigationItem[], itemId: string): NavigationItem[] {
  return items
    .filter(item => item.id !== itemId)
    .map(item => ({
      ...item,
      children: removeItem(item.children, itemId),
    }));
}

function moveItem(
  items: NavigationItem[],
  itemId: string,
  direction: 'up' | 'down'
): NavigationItem[] {
  const index = items.findIndex(item => item.id === itemId);
  if (index === -1) {
    return items.map(item => ({
      ...item,
      children: moveItem(item.children, itemId, direction),
    }));
  }

  const nextIndex = direction === 'up' ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return normalizeItemOrder(items);
  }

  const copy = [...items];
  const [picked] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, picked);
  return normalizeItemOrder(copy);
}

function duplicateConfig(config: NavigationConfig) {
  return parseNavigationConfig(serializeNavigationConfig(config));
}

function validateItem(item: NavigationItem, trail: string[]): string[] {
  const errors: string[] = [];
  const name = [...trail, item.label || 'Untitled item'].join(' / ');

  if (!item.label.trim()) {
    errors.push(`${name}: label is required.`);
  }

  if (item.type !== 'dropdown' && !item.href.trim()) {
    errors.push(`${name}: destination URL is required.`);
  }

  if (item.type === 'dropdown' && item.children.length === 0) {
    errors.push(`${name}: add at least one child item for the dropdown.`);
  }

  item.children.forEach(child => {
    errors.push(...validateItem(child, [...trail, item.label || 'Untitled dropdown']));
  });

  return errors;
}

function validateConfig(config: NavigationConfig) {
  const errors = config.items.flatMap(item => validateItem(item, []));

  if (
    config.loginButton.visible &&
    config.loginButton.destinationType === 'custom' &&
    !config.loginButton.customUrl.trim()
  ) {
    errors.push('Login button: custom URL is required when destination type is Custom URL.');
  }

  if (
    config.design.logo.showImageLogo &&
    !getNavigationBranding(config).imageLogoUrl
  ) {
    errors.push('Logo settings: add an image URL or turn off the image logo.');
  }

  return errors;
}

function OptionSelect({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  const groups = ['Internal pages', 'Homepage sections', 'Utility routes', 'Custom'] as const;

  return (
    <select
      value={value}
      onChange={event => onChange(event.target.value)}
      style={{ width: '100%' }}
    >
      <option value="">Custom destination</option>
      {groups.map(group => (
        <optgroup key={group} label={group}>
          {NAVIGATION_PRESET_OPTIONS.filter(option => option.group === group).map(option => (
            <option key={`${group}-${option.label}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function ItemEditor({
  item,
  onAddChild,
  onDelete,
  onMove,
  onUpdate,
}: {
  item: NavigationItem;
  onAddChild: (parentId: string) => void;
  onDelete: (itemId: string) => void;
  onMove: (itemId: string, direction: 'up' | 'down') => void;
  onUpdate: (itemId: string, updater: (item: NavigationItem) => NavigationItem) => void;
}) {
  const tokens = useAdminThemeTokens();
  const inputStyle = getAdminInputStyle(tokens);
  const compactSelectStyle = { ...inputStyle, appearance: 'auto' as const };
  const presetMatch =
    NAVIGATION_PRESET_OPTIONS.find(option => option.value === item.href)?.value || '';
  const childCount = item.children.length;

  return (
    <div
      style={{
        border: `1px solid ${tokens.line}`,
        borderRadius: 22,
        padding: 18,
        background: tokens.fieldSoft,
        boxShadow: tokens.softShadow,
        display: 'grid',
        gap: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 16 }}>{item.label || 'Untitled menu item'}</strong>
          <AdminChip tone={item.visible ? 'success' : 'neutral'}>
            {item.visible ? 'Visible' : 'Hidden'}
          </AdminChip>
          <AdminChip tone="accent">{item.type}</AdminChip>
          {item.type === 'dropdown' ? (
            <AdminChip tone="neutral">{childCount} children</AdminChip>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <AdminActionButton onClick={() => onMove(item.id, 'up')} variant="secondary">
            Move Up
          </AdminActionButton>
          <AdminActionButton onClick={() => onMove(item.id, 'down')} variant="secondary">
            Move Down
          </AdminActionButton>
          <AdminActionButton onClick={() => onDelete(item.id)} variant="danger">
            Delete
          </AdminActionButton>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        <AdminField label="Label">
          <input
            value={item.label}
            onChange={event =>
              onUpdate(item.id, current => ({ ...current, label: event.target.value }))
            }
            style={inputStyle}
          />
        </AdminField>

        <AdminField label="Menu type">
          <select
            value={item.type}
            onChange={event =>
              onUpdate(item.id, current => ({
                ...current,
                type: event.target.value as NavigationItemType,
                children:
                  event.target.value === 'dropdown'
                    ? current.children.length > 0
                      ? current.children
                      : [createDropdownChild(0)]
                    : [],
              }))
            }
            style={compactSelectStyle}
          >
            <option value="internal">Internal page</option>
            <option value="external">External link</option>
            <option value="section">Section anchor</option>
            <option value="dropdown">Dropdown parent</option>
            <option value="button">Custom button</option>
          </select>
        </AdminField>

        <AdminField label="Known destinations">
          <div style={compactSelectStyle}>
            <OptionSelect
              value={presetMatch}
              onChange={value =>
                onUpdate(item.id, current => ({
                  ...current,
                  href: value || current.href,
                  type:
                    NAVIGATION_PRESET_OPTIONS.find(option => option.value === value)?.type ||
                    current.type,
                }))
              }
            />
          </div>
        </AdminField>

        <AdminField label="URL / Path">
          <input
            value={item.href}
            onChange={event =>
              onUpdate(item.id, current => ({ ...current, href: event.target.value }))
            }
            style={inputStyle}
            placeholder={item.type === 'section' ? '/#portfolio' : '/portfolio or https://'}
          />
        </AdminField>

        <AdminField label="Icon">
          <div style={{ display: 'grid', gap: 8 }}>
            <input
              value={item.icon}
              onChange={event =>
                onUpdate(item.id, current => ({ ...current, icon: event.target.value }))
              }
              style={inputStyle}
              placeholder="Optional icon or symbol"
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {NAVIGATION_ICON_SUGGESTIONS.map(option => (
                <button
                  key={`${item.id}-${option || 'empty'}`}
                  type="button"
                  onClick={() =>
                    onUpdate(item.id, current => ({ ...current, icon: option }))
                  }
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: `1px solid ${tokens.line}`,
                    background: item.icon === option ? tokens.accentSoft : tokens.field,
                    color: tokens.text,
                    cursor: 'pointer',
                  }}
                >
                  {option || '∅'}
                </button>
              ))}
            </div>
          </div>
        </AdminField>

        <AdminField label="Active behavior">
          <select
            value={item.activeMode}
            onChange={event =>
              onUpdate(item.id, current => ({
                ...current,
                activeMode: event.target.value as NavigationItem['activeMode'],
              }))
            }
            style={compactSelectStyle}
          >
            <option value="exact">Exact match</option>
            <option value="prefix">Starts with path</option>
            <option value="none">Never mark active</option>
          </select>
        </AdminField>

        <AdminField label="Order">
          <input
            type="number"
            value={item.order}
            onChange={event =>
              onUpdate(item.id, current => ({
                ...current,
                order: Number(event.target.value) || 0,
              }))
            }
            style={inputStyle}
          />
        </AdminField>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={item.visible}
            onChange={event =>
              onUpdate(item.id, current => ({ ...current, visible: event.target.checked }))
            }
          />
          <span>Visible in navbar</span>
        </label>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={item.newTab}
            onChange={event =>
              onUpdate(item.id, current => ({ ...current, newTab: event.target.checked }))
            }
          />
          <span>Open in new tab</span>
        </label>
      </div>

      {item.type === 'dropdown' ? (
        <div
          style={{
            borderTop: `1px solid ${tokens.line}`,
            paddingTop: 16,
            display: 'grid',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 800 }}>Dropdown options</div>
            <AdminActionButton onClick={() => onAddChild(item.id)} variant="secondary">
              Add Child Item
            </AdminActionButton>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}
          >
            <AdminField label="Dropdown alignment">
              <select
                value={item.dropdownAlignment}
                onChange={event =>
                  onUpdate(item.id, current => ({
                    ...current,
                    dropdownAlignment:
                      event.target.value as NavigationItem['dropdownAlignment'],
                  }))
                }
                style={compactSelectStyle}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </AdminField>
            <AdminField label="Dropdown trigger">
              <select
                value={item.dropdownTrigger}
                onChange={event =>
                  onUpdate(item.id, current => ({
                    ...current,
                    dropdownTrigger: event.target.value as NavigationItem['dropdownTrigger'],
                  }))
                }
                style={compactSelectStyle}
              >
                <option value="hover">Hover</option>
                <option value="click">Click</option>
              </select>
            </AdminField>
          </div>

          {item.children.length === 0 ? (
            <div
              style={{
                borderRadius: 18,
                border: `1px dashed ${tokens.line}`,
                padding: 18,
                color: tokens.muted,
                background: tokens.field,
              }}
            >
              This dropdown is empty. Add child items to populate the submenu.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {sortItems(item.children).map(child => (
                <div
                  key={child.id}
                  style={{
                    borderRadius: 18,
                    border: `1px solid ${tokens.line}`,
                    background: tokens.field,
                    padding: 14,
                    display: 'grid',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong>{child.label || 'Untitled child'}</strong>
                      <AdminChip tone={child.visible ? 'success' : 'neutral'}>
                        {child.visible ? 'Visible' : 'Hidden'}
                      </AdminChip>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <AdminActionButton onClick={() => onMove(child.id, 'up')} variant="ghost">
                        Up
                      </AdminActionButton>
                      <AdminActionButton onClick={() => onMove(child.id, 'down')} variant="ghost">
                        Down
                      </AdminActionButton>
                      <AdminActionButton onClick={() => onDelete(child.id)} variant="danger">
                        Delete
                      </AdminActionButton>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 12,
                    }}
                  >
                    <AdminField label="Label">
                      <input
                        value={child.label}
                        onChange={event =>
                          onUpdate(child.id, current => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                        style={inputStyle}
                      />
                    </AdminField>
                    <AdminField label="URL / Path">
                      <input
                        value={child.href}
                        onChange={event =>
                          onUpdate(child.id, current => ({
                            ...current,
                            href: event.target.value,
                          }))
                        }
                        style={inputStyle}
                      />
                    </AdminField>
                    <AdminField label="Icon">
                      <input
                        value={child.icon}
                        onChange={event =>
                          onUpdate(child.id, current => ({
                            ...current,
                            icon: event.target.value,
                          }))
                        }
                        style={inputStyle}
                      />
                    </AdminField>
                    <AdminField label="Order">
                      <input
                        type="number"
                        value={child.order}
                        onChange={event =>
                          onUpdate(child.id, current => ({
                            ...current,
                            order: Number(event.target.value) || 0,
                          }))
                        }
                        style={inputStyle}
                      />
                    </AdminField>
                  </div>

                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={child.visible}
                        onChange={event =>
                          onUpdate(child.id, current => ({
                            ...current,
                            visible: event.target.checked,
                          }))
                        }
                      />
                      <span>Visible</span>
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={child.newTab}
                        onChange={event =>
                          onUpdate(child.id, current => ({
                            ...current,
                            newTab: event.target.checked,
                          }))
                        }
                      />
                      <span>Open in new tab</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminNavigationPage() {
  const router = useRouter();
  const tokens = useAdminThemeTokens();
  const [config, setConfig] = useState<NavigationConfig | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('Md. Minhajul Hoque');
  const [siteLogo, setSiteLogo] = useState('');
  const [siteLogoAlt, setSiteLogoAlt] = useState('Site logo');

  async function loadSystem() {
    const [{ data: settingsRows }, { data: legacyRows }] = await Promise.all([
      supabase.from('site_settings').select('key, value'),
      supabase
        .from('navigation')
        .select('id, label, href, order_num, visible')
        .order('order_num', { ascending: true }),
    ]);

    const map = toSettingMap((settingsRows || []) as SettingRow[]);
    const rawConfig = map[NAVIGATION_SETTINGS_KEY];
    const nextConfig = parseNavigationConfig(rawConfig, {
      legacyItems: (legacyRows || []) as LegacyRow[],
    });
    setConfig(nextConfig);
    setSavedSnapshot(serializeNavigationConfig(nextConfig));
    setSiteName(map.site_name || 'Md. Minhajul Hoque');
    setSiteLogo(map.site_logo || '');
    setSiteLogoAlt(map.site_logo_alt || map.site_name || 'Site logo');
  }

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        await loadSystem();
      } finally {
        setLoading(false);
      }
    }

    async function verifyAndBoot() {
      const ok = await verifyAdminSessionClient();
      if (!active) {
        return;
      }
      if (!ok) {
        router.replace('/admin/login');
        return;
      }
      await boot();
    }

    void verifyAndBoot();

    return () => {
      active = false;
    };
  }, [router]);

  const inputStyle = getAdminInputStyle(tokens);
  const textareaStyle = getAdminTextareaStyle(tokens, { minHeight: 90 });

  const normalizedConfig = useMemo(
    () => (config ? parseNavigationConfig(serializeNavigationConfig(config)) : null),
    [config]
  );
  const hasUnsavedChanges =
    normalizedConfig !== null &&
    serializeNavigationConfig(normalizedConfig) !== savedSnapshot;
  const visibleItems = normalizedConfig ? getVisibleNavigationItems(normalizedConfig.items) : [];
  const loginPreview = normalizedConfig
    ? resolveLoginButton(normalizedConfig, { userLoginRoute: DEFAULT_USER_LOGIN_ROUTE })
    : null;
  const branding = normalizedConfig
    ? {
        imageLogoUrl: normalizedConfig.design.logo.imageLogoUrl || siteLogo,
        logoAlt: siteLogoAlt,
        textLogo: normalizedConfig.design.logo.textLogo || siteName,
      }
    : null;

  function updateConfig(updater: (current: NavigationConfig) => NavigationConfig) {
    setConfig(current => (current ? updater(duplicateConfig(current)) : current));
  }

  function handleAddItem() {
    updateConfig(current => ({
      ...current,
      items: sortItems([
        ...current.items,
        createNavigationItem(getNextNavigationOrder(current.items)),
      ]),
    }));
  }

  function handleUpdateItem(itemId: string, updater: (item: NavigationItem) => NavigationItem) {
    updateConfig(current => ({
      ...current,
      items: sortItems(replaceItem(current.items, itemId, updater)),
    }));
  }

  function handleDeleteItem(itemId: string) {
    if (!confirm('Delete this navigation item?')) {
      return;
    }

    updateConfig(current => ({
      ...current,
      items: sortItems(removeItem(current.items, itemId)),
    }));
  }

  function handleMoveItem(itemId: string, direction: 'up' | 'down') {
    updateConfig(current => ({
      ...current,
      items: sortItems(moveItem(current.items, itemId, direction)),
    }));
  }

  function handleAddChild(parentId: string) {
    updateConfig(current => ({
      ...current,
      items: sortItems(
        replaceItem(current.items, parentId, item => ({
          ...item,
          type: 'dropdown',
          children: sortItems([
            ...item.children,
            createDropdownChild(getNextNavigationOrder(item.children)),
          ]),
        }))
      ),
    }));
  }

  async function handleLogoUpload(file: File) {
    const ext = file.name.split('.').pop() || 'png';
    const path = `navigation/${Date.now()}-logo.${ext}`;
    setUploadingField('logo');

    try {
      const { publicUrl } = await adminUploadFile('media', path, file, {
        uploadProfile: 'logo',
      });
      updateConfig(current => ({
        ...current,
        design: {
          ...current.design,
          logo: {
            ...current.design.logo,
            imageLogoUrl: publicUrl,
          },
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logo upload failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setUploadingField(null);
    }
  }

  async function saveNavigation() {
    if (!normalizedConfig) {
      return;
    }

    const errors = validateConfig(normalizedConfig);
    if (errors.length > 0) {
      setMsg(`❌ ${errors[0]}`);
      return;
    }

    setSaving(true);
    try {
      const serialized = serializeNavigationConfig(normalizedConfig);
      await writeSiteSetting(supabase, NAVIGATION_SETTINGS_KEY, serialized);
      setSavedSnapshot(serialized);
      setConfig(normalizedConfig);
      setMsg('✅ Navigation settings saved successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Navigation settings save failed.';
      setMsg(`❌ ${message}`);
    } finally {
      setSaving(false);
    }
  }

  function resetDraft() {
    if (!savedSnapshot) {
      setConfig(createDefaultNavigationConfig());
      return;
    }

    setConfig(parseNavigationConfig(savedSnapshot));
    setMsg('Navigation draft reset to the last saved state.');
  }

  if (loading || !config || !normalizedConfig) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: tokens.muted,
          background: tokens.dark ? '#020617' : '#f8fbff',
        }}
      >
        Navigation builder loading...
      </div>
    );
  }

  return (
    <AdminShell
      eyebrow="Navigation Builder"
      title="Control the public navbar from one dynamic admin system"
      description="Build menu items, dropdowns, login behavior, theme toggle placement, mobile navigation, and brand styling from one shared navbar config that the public site reads directly."
      actions={
        <>
          <AdminActionButton onClick={handleAddItem} variant="secondary">
            Add Menu Item
          </AdminActionButton>
          <AdminActionButton onClick={resetDraft} variant="ghost">
            Reset Draft
          </AdminActionButton>
          <AdminActionButton onClick={() => void saveNavigation()} disabled={saving}>
            {saving ? 'Saving...' : 'Save Navigation'}
          </AdminActionButton>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {msg ? <AdminNotice message={msg} /> : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
          }}
        >
          {[
            { label: 'Total items', value: normalizedConfig.items.length },
            { label: 'Visible items', value: visibleItems.length },
            { label: 'Dropdown parents', value: normalizedConfig.items.filter(item => item.type === 'dropdown').length },
            { label: 'Unsaved changes', value: hasUnsavedChanges ? 'Yes' : 'No' },
          ].map(metric => (
            <article
              key={metric.label}
              style={{
                borderRadius: 22,
                padding: '18px 20px',
                border: `1px solid ${tokens.line}`,
                background: tokens.fieldSoft,
                boxShadow: tokens.softShadow,
              }}
            >
              <div style={{ color: tokens.muted, fontSize: 13, marginBottom: 8 }}>{metric.label}</div>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{metric.value}</div>
            </article>
          ))}
        </div>

        <AdminBuilderSection
          title="Live Preview"
          description="This preview mirrors the saved navbar structure: logo, visible links, login CTA, and theme toggle placement. Hidden items stay out of the preview."
          badge={`${visibleItems.length} live links`}
          status={hasUnsavedChanges ? 'Unsaved edits' : 'Saved'}
          statusTone={hasUnsavedChanges ? 'danger' : 'success'}
          tabs={[
            {
              id: 'desktop',
              label: 'Desktop',
              description: 'See the primary order and CTA placement.',
              content: (
                <div
                  style={{
                    borderRadius: 26,
                    border: `1px solid ${tokens.line}`,
                    padding: 18,
                    background: normalizedConfig.design.backgroundDark,
                    color: '#f8fafc',
                    boxShadow: '0 22px 60px rgba(2,6,23,0.24)',
                    display: 'grid',
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 18,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                      {normalizedConfig.design.logo.showImageLogo && branding?.imageLogoUrl ? (
                        <img
                          src={branding.imageLogoUrl}
                          alt={branding.logoAlt}
                          style={{
                            width: 42,
                            height: 42,
                            objectFit: 'cover',
                            borderRadius: 14,
                          }}
                        />
                      ) : null}
                      {normalizedConfig.design.logo.showTextLogo ? (
                        <div style={{ fontWeight: 900, color: normalizedConfig.design.logo.brandColor, fontSize: 22 }}>
                          {branding?.textLogo}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      {visibleItems.map(item => (
                        <div
                          key={item.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: item.type === 'button' ? '10px 14px' : '8px 0',
                            borderRadius: item.type === 'button' ? 999 : 0,
                            background:
                              item.type === 'button' ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: item.type === 'button'
                              ? '#ffffff'
                              : normalizedConfig.design.textColorDark,
                          }}
                        >
                          {item.icon ? <span>{item.icon}</span> : null}
                          <span>{item.label}</span>
                          {item.type === 'dropdown' ? (
                            <span style={{ color: normalizedConfig.design.accentColor }}>
                              {item.children.filter(child => child.visible).length} sub
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      {normalizedConfig.themeToggle.visible &&
                      normalizedConfig.themeToggle.position === 'before-login' ? (
                        <span
                          style={{
                            borderRadius: 999,
                            padding: '10px 14px',
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.06)',
                          }}
                        >
                          Theme
                        </span>
                      ) : null}
                      {loginPreview?.visible ? (
                        <span
                          style={{
                            borderRadius: 999,
                            padding: '10px 16px',
                            background: normalizedConfig.design.accentColor,
                            color: '#fff',
                            fontWeight: 800,
                          }}
                        >
                          {normalizedConfig.loginButton.label}
                        </span>
                      ) : null}
                      {normalizedConfig.themeToggle.visible &&
                      normalizedConfig.themeToggle.position === 'after-login' ? (
                        <span
                          style={{
                            borderRadius: 999,
                            padding: '10px 14px',
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.06)',
                          }}
                        >
                          Theme
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ color: 'rgba(255,255,255,0.64)', fontSize: 13 }}>
                    Layout: {normalizedConfig.design.layout} | Width: {normalizedConfig.design.width} | Mobile: {normalizedConfig.design.mobile.style}
                  </div>
                </div>
              ),
            },
          ]}
        />

        <AdminBuilderSection
          title="Menu Items Manager"
          description="Create, edit, reorder, hide, or remove top-level items and dropdown children. Use the known-destination dropdown for fast route linking or enter any custom path you need."
          badge={`${normalizedConfig.items.length} items`}
          tabs={[
            {
              id: 'items',
              label: 'Items',
              description: 'Each item controls its own type, destination, visibility, and dropdown behavior.',
              content:
                normalizedConfig.items.length === 0 ? (
                  <div
                    style={{
                      borderRadius: 22,
                      border: `1px dashed ${tokens.line}`,
                      padding: 24,
                      background: tokens.fieldSoft,
                      color: tokens.muted,
                    }}
                  >
                    No custom menu items yet. Add one to start building the navbar.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 14 }}>
                    {sortItems(normalizedConfig.items).map(item => (
                      <ItemEditor
                        key={item.id}
                        item={item}
                        onAddChild={handleAddChild}
                        onDelete={handleDeleteItem}
                        onMove={handleMoveItem}
                        onUpdate={handleUpdateItem}
                      />
                    ))}
                  </div>
                ),
            },
          ]}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 18,
          }}
        >
          <AdminBuilderSection
            title="Login Button"
            description="Control the login CTA label, style, target route, and fallback behavior."
            badge={normalizedConfig.loginButton.visible ? 'Enabled' : 'Hidden'}
            tabs={[
              {
                id: 'login',
                label: 'Settings',
                content: (
                  <div style={{ display: 'grid', gap: 14 }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                      }}
                    >
                      <AdminField label="Show login button">
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={normalizedConfig.loginButton.visible}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                loginButton: {
                                  ...current.loginButton,
                                  visible: event.target.checked,
                                },
                              }))
                            }
                          />
                          <span>Visible</span>
                        </label>
                      </AdminField>
                      <AdminField label="Label">
                        <input
                          value={normalizedConfig.loginButton.label}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              loginButton: {
                                ...current.loginButton,
                                label: event.target.value,
                              },
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField label="Destination type">
                        <select
                          value={normalizedConfig.loginButton.destinationType}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              loginButton: {
                                ...current.loginButton,
                                destinationType:
                                  event.target.value as NavigationConfig['loginButton']['destinationType'],
                              },
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="admin">Admin Login</option>
                          <option value="user">User Login</option>
                          <option value="custom">Custom URL</option>
                          <option value="hidden">Hide button</option>
                        </select>
                      </AdminField>
                      <AdminField label="Button style">
                        <select
                          value={normalizedConfig.loginButton.style}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              loginButton: {
                                ...current.loginButton,
                                style: event.target.value as NavigationConfig['loginButton']['style'],
                              },
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="filled">Filled</option>
                          <option value="outline">Outline</option>
                          <option value="ghost">Ghost</option>
                          <option value="glass">Glass</option>
                        </select>
                      </AdminField>
                      <AdminField label="Button icon">
                        <input
                          value={normalizedConfig.loginButton.icon}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              loginButton: {
                                ...current.loginButton,
                                icon: event.target.value,
                              },
                            }))
                          }
                          style={inputStyle}
                          placeholder="Optional icon"
                        />
                      </AdminField>
                      <AdminField label="Custom URL">
                        <input
                          value={normalizedConfig.loginButton.customUrl}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              loginButton: {
                                ...current.loginButton,
                                customUrl: event.target.value,
                              },
                            }))
                          }
                          style={inputStyle}
                          placeholder="/client/login or https://"
                        />
                      </AdminField>
                    </div>

                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={normalizedConfig.loginButton.newTab}
                        onChange={event =>
                          updateConfig(current => ({
                            ...current,
                            loginButton: {
                              ...current.loginButton,
                              newTab: event.target.checked,
                            },
                          }))
                        }
                      />
                      <span>Open login action in a new tab</span>
                    </label>

                    {loginPreview?.warning ? <AdminNotice message={`❌ ${loginPreview.warning}`} /> : null}
                    <div
                      style={{
                        borderRadius: 18,
                        border: `1px solid ${tokens.line}`,
                        padding: 16,
                        background: tokens.fieldSoft,
                        color: tokens.muted,
                      }}
                    >
                      Resolved destination: {loginPreview?.href || 'Hidden'} {DEFAULT_USER_LOGIN_ROUTE ? '(user route available)' : '(user route unavailable)'}
                    </div>
                  </div>
                ),
              },
            ]}
          />

          <AdminBuilderSection
            title="Theme Toggle"
            description="Keep the theme switch visible where you want it while staying hydration-safe on the public site."
            badge={normalizedConfig.themeToggle.visible ? 'Visible' : 'Hidden'}
            tabs={[
              {
                id: 'theme',
                label: 'Settings',
                content: (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 14,
                    }}
                  >
                    <AdminField label="Show theme toggle">
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={normalizedConfig.themeToggle.visible}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              themeToggle: {
                                ...current.themeToggle,
                                visible: event.target.checked,
                              },
                            }))
                          }
                        />
                        <span>Visible</span>
                      </label>
                    </AdminField>
                    <AdminField label="Position">
                      <select
                        value={normalizedConfig.themeToggle.position}
                        onChange={event =>
                          updateConfig(current => ({
                            ...current,
                            themeToggle: {
                              ...current.themeToggle,
                              position: event.target.value as NavigationConfig['themeToggle']['position'],
                            },
                          }))
                        }
                        style={inputStyle}
                      >
                        <option value="before-login">Before login button</option>
                        <option value="after-login">After login button</option>
                        <option value="mobile-only">Inside mobile menu only</option>
                      </select>
                    </AdminField>
                    <AdminField label="Style">
                      <select
                        value={normalizedConfig.themeToggle.style}
                        onChange={event =>
                          updateConfig(current => ({
                            ...current,
                            themeToggle: {
                              ...current.themeToggle,
                              style: event.target.value as NavigationConfig['themeToggle']['style'],
                            },
                          }))
                        }
                        style={inputStyle}
                      >
                        <option value="icon-only">Icon only</option>
                        <option value="pill">Pill</option>
                        <option value="text-icon">Text + icon</option>
                      </select>
                    </AdminField>
                  </div>
                ),
              },
            ]}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 18,
          }}
        >
          <AdminBuilderSection
            title="Navbar Layout + Design"
            description="Tune layout, width, sticky behavior, colors, spacing, and surface treatment."
            badge={normalizedConfig.design.layout}
            tabs={[
              {
                id: 'design',
                label: 'Global',
                content: (
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                      }}
                    >
                      <AdminField label="Layout style">
                        <select
                          value={normalizedConfig.design.layout}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                layout: event.target.value as NavigationConfig['design']['layout'],
                              },
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="centered">Centered</option>
                          <option value="left-right">Left logo / right menu</option>
                          <option value="split">Split</option>
                        </select>
                      </AdminField>
                      <AdminField label="Width">
                        <select
                          value={normalizedConfig.design.width}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                width: event.target.value as NavigationConfig['design']['width'],
                              },
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="full">Full</option>
                          <option value="contained">Contained</option>
                          <option value="wide">Wide</option>
                        </select>
                      </AdminField>
                      <AdminField label="Height / spacing">
                        <select
                          value={normalizedConfig.design.heightPreset}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                heightPreset:
                                  event.target.value as NavigationConfig['design']['heightPreset'],
                              },
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="compact">Compact</option>
                          <option value="default">Default</option>
                          <option value="spacious">Spacious</option>
                        </select>
                      </AdminField>
                      <AdminField label="Accent color">
                        <input
                          value={normalizedConfig.design.accentColor}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                accentColor: event.target.value,
                              },
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField label="Light background">
                        <input
                          value={normalizedConfig.design.backgroundLight}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                backgroundLight: event.target.value,
                              },
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField label="Dark background">
                        <input
                          value={normalizedConfig.design.backgroundDark}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                backgroundDark: event.target.value,
                              },
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField label="Light text color">
                        <input
                          value={normalizedConfig.design.textColorLight}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                textColorLight: event.target.value,
                              },
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField label="Dark text color">
                        <input
                          value={normalizedConfig.design.textColorDark}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                textColorDark: event.target.value,
                              },
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField label="Active link color">
                        <input
                          value={normalizedConfig.design.activeLinkColor}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                activeLinkColor: event.target.value,
                              },
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField label="Hover color">
                        <input
                          value={normalizedConfig.design.hoverColor}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                hoverColor: event.target.value,
                              },
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                    </div>

                    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                      {[
                        ['sticky', 'Sticky navbar'],
                        ['transparentOnTop', 'Transparent on top'],
                        ['blur', 'Blur / glass'],
                        ['shadow', 'Shadow'],
                        ['border', 'Border'],
                      ].map(([key, label]) => (
                        <label
                          key={key}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(normalizedConfig.design[key as keyof typeof normalizedConfig.design])}
                            onChange={event =>
                              updateConfig(current => ({
                                ...current,
                                design: {
                                  ...current.design,
                                  [key]: event.target.checked,
                                },
                              }))
                            }
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ),
              },
            ]}
          />

          <AdminBuilderSection
            title="Logo + Brand"
            description="Control text branding, image logo, link target, size, and brand color."
            badge="Brand"
            tabs={[
              {
                id: 'logo',
                label: 'Logo',
                content: (
                  <div style={{ display: 'grid', gap: 16 }}>
                    <AdminImageField
                      label="Image logo"
                      value={normalizedConfig.design.logo.imageLogoUrl}
                      onChange={value =>
                        updateConfig(current => ({
                          ...current,
                          design: {
                            ...current.design,
                            logo: {
                              ...current.design.logo,
                              imageLogoUrl: value,
                            },
                          },
                        }))
                      }
                      onFileSelected={handleLogoUpload}
                      uploading={uploadingField === 'logo'}
                      uploadProfile="logo"
                      previewAlt="Navbar logo"
                      urlPlaceholder="Paste logo URL or upload an image"
                    />

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                      }}
                    >
                      <AdminField label="Text logo">
                        <input
                          value={normalizedConfig.design.logo.textLogo}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                logo: {
                                  ...current.design.logo,
                                  textLogo: event.target.value,
                                },
                              },
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField label="Logo link">
                        <input
                          value={normalizedConfig.design.logo.logoLink}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                logo: {
                                  ...current.design.logo,
                                  logoLink: event.target.value,
                                },
                              },
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                      <AdminField label="Logo size">
                        <select
                          value={normalizedConfig.design.logo.logoSize}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                logo: {
                                  ...current.design.logo,
                                  logoSize: event.target.value as NavigationConfig['design']['logo']['logoSize'],
                                },
                              },
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                        </select>
                      </AdminField>
                      <AdminField label="Brand color">
                        <input
                          value={normalizedConfig.design.logo.brandColor}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                logo: {
                                  ...current.design.logo,
                                  brandColor: event.target.value,
                                },
                              },
                            }))
                          }
                          style={inputStyle}
                        />
                      </AdminField>
                    </div>

                    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={normalizedConfig.design.logo.showTextLogo}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                logo: {
                                  ...current.design.logo,
                                  showTextLogo: event.target.checked,
                                },
                              },
                            }))
                          }
                        />
                        <span>Show text logo</span>
                      </label>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={normalizedConfig.design.logo.showImageLogo}
                          onChange={event =>
                            updateConfig(current => ({
                              ...current,
                              design: {
                                ...current.design,
                                logo: {
                                  ...current.design.logo,
                                  showImageLogo: event.target.checked,
                                },
                              },
                            }))
                          }
                        />
                        <span>Show image logo</span>
                      </label>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        <AdminBuilderSection
          title="Mobile Navigation"
          description="Tune the mobile menu style, opening side, CTA visibility, and toggle placement."
          badge={normalizedConfig.design.mobile.style}
          tabs={[
            {
              id: 'mobile',
              label: 'Mobile',
              content: (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 14,
                    }}
                  >
                    <AdminField label="Menu style">
                      <select
                        value={normalizedConfig.design.mobile.style}
                        onChange={event =>
                          updateConfig(current => ({
                            ...current,
                            design: {
                              ...current.design,
                              mobile: {
                                ...current.design.mobile,
                                style: event.target.value as NavigationConfig['design']['mobile']['style'],
                              },
                            },
                          }))
                        }
                        style={inputStyle}
                      >
                        <option value="drawer">Drawer</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="fullscreen">Fullscreen overlay</option>
                      </select>
                    </AdminField>
                    <AdminField label="Menu position">
                      <select
                        value={normalizedConfig.design.mobile.position}
                        onChange={event =>
                          updateConfig(current => ({
                            ...current,
                            design: {
                              ...current.design,
                              mobile: {
                                ...current.design.mobile,
                                position:
                                  event.target.value as NavigationConfig['design']['mobile']['position'],
                              },
                            },
                          }))
                        }
                        style={inputStyle}
                      >
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </AdminField>
                    <AdminField label="Animation">
                      <select
                        value={normalizedConfig.design.mobile.animation}
                        onChange={event =>
                          updateConfig(current => ({
                            ...current,
                            design: {
                              ...current.design,
                              mobile: {
                                ...current.design.mobile,
                                animation:
                                  event.target.value as NavigationConfig['design']['mobile']['animation'],
                              },
                            },
                          }))
                        }
                        style={inputStyle}
                      >
                        <option value="slide">Slide</option>
                        <option value="fade">Fade</option>
                        <option value="scale">Scale</option>
                      </select>
                    </AdminField>
                  </div>

                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={normalizedConfig.design.mobile.showLoginButton}
                        onChange={event =>
                          updateConfig(current => ({
                            ...current,
                            design: {
                              ...current.design,
                              mobile: {
                                ...current.design.mobile,
                                showLoginButton: event.target.checked,
                              },
                            },
                          }))
                        }
                      />
                      <span>Show login button in mobile menu</span>
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={normalizedConfig.design.mobile.showThemeToggle}
                        onChange={event =>
                          updateConfig(current => ({
                            ...current,
                            design: {
                              ...current.design,
                              mobile: {
                                ...current.design.mobile,
                                showThemeToggle: event.target.checked,
                              },
                            },
                          }))
                        }
                      />
                      <span>Show theme toggle in mobile menu</span>
                    </label>
                  </div>
                </div>
              ),
            },
          ]}
        />

        <AdminBuilderSection
          title="Validation + Notes"
          description="Helpful checks before saving, plus quick reminders about fallbacks."
          badge="Guardrails"
          tabs={[
            {
              id: 'notes',
              label: 'Status',
              content: (
                <div style={{ display: 'grid', gap: 14 }}>
                  <div
                    style={{
                      borderRadius: 18,
                      border: `1px solid ${tokens.line}`,
                      background: tokens.fieldSoft,
                      padding: 16,
                      color: tokens.muted,
                      lineHeight: 1.8,
                    }}
                  >
                    If no admin navigation config is saved, the public navbar falls back to the legacy
                    `navigation` table. If that is also empty, it falls back again to the built-in
                    default menu.
                  </div>

                  {validateConfig(normalizedConfig).length > 0 ? (
                    <div
                      style={{
                        borderRadius: 18,
                        border: `1px solid ${tokens.dangerSoft}`,
                        background: tokens.dangerSoft,
                        color: tokens.dangerText,
                        padding: 16,
                        lineHeight: 1.8,
                      }}
                    >
                      {validateConfig(normalizedConfig).map(error => (
                        <div key={error}>{error}</div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        borderRadius: 18,
                        border: `1px solid ${tokens.successSoft}`,
                        background: tokens.successSoft,
                        color: tokens.successText,
                        padding: 16,
                      }}
                    >
                      No validation issues found in the current draft.
                    </div>
                  )}

                  <textarea
                    value="Use known route presets for /, /portfolio, /about, /contact, /tutorial, /admin/login, and /client/login. Custom section anchors like /#portfolio are supported too."
                    readOnly
                    style={textareaStyle}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>
    </AdminShell>
  );
}
