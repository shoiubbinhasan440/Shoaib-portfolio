'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import {
  AdminActionButton,
  AdminField,
  AdminPreviewFrame,
  AdminSectionTabs,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import {
  createDefaultBuilderSectionStyles,
  createDefaultTypographyRule,
  getButtonStyleOverrides,
  getCardSurfaceOverrides,
  getTypographyStyleOverrides,
  resolveSectionThemeColor,
  type BuilderButtonSizePreset,
  type BuilderButtonStylePreset,
  type BuilderCardStylePreset,
  type BuilderFontFamilyPreset,
  type BuilderFontSizePreset,
  type BuilderFontWeightPreset,
  type BuilderGlowPreset,
  type BuilderGradientPreset,
  type BuilderGridColumnsPreset,
  type BuilderImagePositionPreset,
  type BuilderLetterSpacingPreset,
  type BuilderLineHeightPreset,
  type BuilderSectionStyles,
  type BuilderShadowPreset,
  type BuilderTextAlignPreset,
  type BuilderTypographyRule,
  type BuilderWidthPreset,
  type BuilderPaddingPreset,
} from '@/lib/page-builder-styles';

type StyleTab = 'typography' | 'colors' | 'layout' | 'components';
type TypographyRole = keyof BuilderSectionStyles['typography'];

const tabs: Array<{ description: string; id: StyleTab; label: string }> = [
  {
    id: 'typography',
    label: 'Text',
    description: 'Label, heading, subtitle, body, and button text styles',
  },
  {
    id: 'colors',
    label: 'Colors',
    description: 'Background, accent, border, and button color choices',
  },
  {
    id: 'layout',
    label: 'Layout',
    description: 'Width, spacing, alignment, and image/grid balance',
  },
  {
    id: 'components',
    label: 'Buttons & Cards',
    description: 'Polish buttons, cards, shadows, glow, and radius',
  },
];

const roleMeta: Record<
  TypographyRole,
  {
    description: string;
    helper: string;
    preview: string;
    title: string;
  }
> = {
  label: {
    description: 'Small section-intro text above the main content.',
    helper: 'This controls the section label.',
    preview: 'Featured Section',
    title: 'Section Label',
  },
  title: {
    description: 'Primary headline that carries the main message.',
    helper: 'This controls the main heading.',
    preview: 'Cinematic visuals with a clearer creative story',
    title: 'Heading / Title',
  },
  subtitle: {
    description: 'Supporting line that explains the headline.',
    helper: 'This controls the subtitle text.',
    preview: 'Refined messaging that gives people context before they keep reading.',
    title: 'Subtitle',
  },
  body: {
    description: 'Paragraph copy, descriptions, and longer explanations.',
    helper: 'This controls the body text.',
    preview:
      'Use this area to preview paragraph rhythm, spacing, and readability in both themes.',
    title: 'Body Text',
  },
  button: {
    description: 'Text styling inside CTAs and action buttons.',
    helper: 'This controls the button text.',
    preview: 'Start the project',
    title: 'Buttons',
  },
};

const fontSizeOptions: Array<{ label: string; value: BuilderFontSizePreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'XL' },
  { value: '2xl', label: '2XL' },
];

const fontFamilyOptions: Array<{ label: string; value: BuilderFontFamilyPreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'system', label: 'System' },
  { value: 'inter', label: 'Inter' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'hind-siliguri', label: 'Hind Siliguri' },
  { value: 'noto-sans-bengali', label: 'Noto Sans Bengali' },
  { value: 'playfair', label: 'Playfair Display' },
];

const fontWeightOptions: Array<{ label: string; value: BuilderFontWeightPreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'regular', label: 'Regular' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
  { value: 'extrabold', label: 'Extra Bold' },
];

const lineHeightOptions: Array<{ label: string; value: BuilderLineHeightPreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'tight', label: 'Tight' },
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Relaxed' },
];

const letterSpacingOptions: Array<{ label: string; value: BuilderLetterSpacingPreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'tight', label: 'Tight' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
];

const alignOptions: Array<{ label: string; value: BuilderTextAlignPreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const widthOptions: Array<{ label: string; value: BuilderWidthPreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'narrow', label: 'Narrow' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
  { value: 'full', label: 'Full' },
];

const paddingOptions: Array<{ label: string; value: BuilderPaddingPreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'spacious', label: 'Spacious' },
];

const gridOptions: Array<{ label: string; value: BuilderGridColumnsPreset }> = [
  { value: 'default', label: 'Auto' },
  { value: '1', label: '1 col' },
  { value: '2', label: '2 col' },
  { value: '3', label: '3 col' },
  { value: '4', label: '4 col' },
];

const imagePositionOptions: Array<{ label: string; value: BuilderImagePositionPreset }> = [
  { value: 'default', label: 'Auto' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'center', label: 'Center' },
  { value: 'split', label: 'Split' },
];

const buttonStyleOptions: Array<{ label: string; value: BuilderButtonStylePreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'solid', label: 'Solid' },
  { value: 'outline', label: 'Outline' },
  { value: 'soft', label: 'Soft' },
  { value: 'glass', label: 'Glass' },
];

const buttonSizeOptions: Array<{ label: string; value: BuilderButtonSizePreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const cardStyleOptions: Array<{ label: string; value: BuilderCardStylePreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'soft', label: 'Soft' },
  { value: 'glass', label: 'Glass' },
  { value: 'outline', label: 'Outline' },
  { value: 'editorial', label: 'Editorial' },
];

const shadowOptions: Array<{ label: string; value: BuilderShadowPreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'none', label: 'None' },
  { value: 'soft', label: 'Soft' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
];

const glowOptions: Array<{ label: string; value: BuilderGlowPreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'none', label: 'None' },
  { value: 'soft', label: 'Soft' },
  { value: 'medium', label: 'Medium' },
];

const gradientOptions: Array<{ label: string; value: BuilderGradientPreset }> = [
  { value: 'default', label: 'Default' },
  { value: 'none', label: 'None' },
  { value: 'soft', label: 'Soft' },
  { value: 'studio', label: 'Studio' },
  { value: 'spotlight', label: 'Spotlight' },
];

function groupCardStyle(tokens: ReturnType<typeof useAdminThemeTokens>): CSSProperties {
  return {
    borderRadius: 24,
    border: `1px solid ${tokens.line}`,
    background: tokens.fieldSoft,
    padding: 18,
    boxShadow: tokens.softShadow,
  };
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  hint?: string;
}) {
  const tokens = useAdminThemeTokens();

  return (
    <AdminField label={label} hint={hint}>
      <select
        value={value}
        onChange={event => onChange(event.target.value as T)}
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
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </AdminField>
  );
}

function ChoiceField<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  hint?: string;
}) {
  const tokens = useAdminThemeTokens();

  return (
    <AdminField label={label} hint={hint}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(76px, 1fr))',
          gap: 8,
        }}
      >
        {options.map(option => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              style={{
                borderRadius: 13,
                border: `1px solid ${active ? 'rgba(56,189,248,0.28)' : tokens.line}`,
                background: active ? tokens.accentSoft : tokens.field,
                color: active ? tokens.accentText : tokens.text,
                padding: '10px 12px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </AdminField>
  );
}

function ColorField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const tokens = useAdminThemeTokens();

  return (
    <AdminField
      label={label}
      hint={hint || 'Leave this blank to keep the current design default.'}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '62px minmax(0, 1fr)', gap: 10 }}>
        <input
          type="color"
          value={value || '#2563eb'}
          onChange={event => onChange(event.target.value)}
          style={{
            width: 62,
            height: 46,
            border: `1px solid ${tokens.line}`,
            borderRadius: 14,
            background: tokens.field,
            padding: 4,
          }}
        />
        <div
          style={{
            display: 'grid',
            gap: 8,
          }}
        >
          <input
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder="#2563eb"
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: tokens.subtle,
              fontSize: 12,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                border: `1px solid ${tokens.line}`,
                background: value || 'transparent',
              }}
            />
            <span>{value || 'Using current default color'}</span>
          </div>
        </div>
      </div>
    </AdminField>
  );
}

function PreviewToggle({
  mode,
  setMode,
}: {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}) {
  const tokens = useAdminThemeTokens();

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(['light', 'dark'] as const).map(item => {
        const active = item === mode;

        return (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            style={{
              borderRadius: 999,
              border: `1px solid ${active ? 'rgba(56,189,248,0.28)' : tokens.line}`,
              background: active ? tokens.accentSoft : tokens.fieldSoft,
              color: active ? tokens.accentText : tokens.text,
              padding: '9px 12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {item === 'light' ? 'Light preview' : 'Dark preview'}
          </button>
        );
      })}
    </div>
  );
}

export default function PageStyleEditor({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description?: string;
  value: BuilderSectionStyles | undefined;
  onChange: (value: BuilderSectionStyles) => void;
}) {
  const tokens = useAdminThemeTokens();
  const [activeTab, setActiveTab] = useState<StyleTab>('typography');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('dark');
  const styles = useMemo(
    () => value || createDefaultBuilderSectionStyles(),
    [value]
  );

  function updateTypography(
    target: TypographyRole,
    key: keyof BuilderTypographyRule,
    nextValue: string
  ) {
    onChange({
      ...styles,
      typography: {
        ...styles.typography,
        [target]: {
          ...styles.typography[target],
          [key]: nextValue,
        },
      },
    });
  }

  function updateColors(
    key: keyof BuilderSectionStyles['colors'],
    nextValue: string
  ) {
    onChange({
      ...styles,
      colors: {
        ...styles.colors,
        [key]: nextValue,
      },
    });
  }

  function updateLayout(
    key: keyof BuilderSectionStyles['layout'],
    nextValue: string
  ) {
    onChange({
      ...styles,
      layout: {
        ...styles.layout,
        [key]: nextValue,
      },
    });
  }

  function updateButtons(
    key: keyof BuilderSectionStyles['buttons'],
    nextValue: string | number | boolean
  ) {
    onChange({
      ...styles,
      buttons: {
        ...styles.buttons,
        [key]: nextValue,
      },
    });
  }

  function updateCard(
    key: keyof BuilderSectionStyles['card'],
    nextValue: string | number | boolean
  ) {
    onChange({
      ...styles,
      card: {
        ...styles.card,
        [key]: nextValue,
      },
    });
  }

  function resetTypographyRole(target: TypographyRole) {
    onChange({
      ...styles,
      typography: {
        ...styles.typography,
        [target]: createDefaultTypographyRule(),
      },
    });
  }

  function resetColors() {
    onChange({
      ...styles,
      colors: createDefaultBuilderSectionStyles().colors,
    });
  }

  function resetLayout() {
    onChange({
      ...styles,
      layout: createDefaultBuilderSectionStyles().layout,
    });
  }

  function resetButtons() {
    onChange({
      ...styles,
      buttons: createDefaultBuilderSectionStyles().buttons,
    });
  }

  function resetCard() {
    onChange({
      ...styles,
      card: createDefaultBuilderSectionStyles().card,
    });
  }

  const previewDark = previewMode === 'dark';
  const previewBackground = resolveSectionThemeColor(
    styles.colors.backgroundLight,
    styles.colors.backgroundDark,
    previewDark,
    previewDark
      ? 'linear-gradient(180deg, rgba(2,6,23,0.92), rgba(15,23,42,0.78))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))'
  );
  const previewBorder = resolveSectionThemeColor(
    styles.colors.borderLight,
    styles.colors.borderDark,
    previewDark,
    previewDark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)'
  );
  const previewText = previewDark ? '#f8fafc' : '#0f172a';
  const previewMuted = previewDark ? '#94a3b8' : '#475569';
  const buttonStyles = getButtonStyleOverrides(styles, {
    dark: previewDark,
    fallbackBackground: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
    fallbackColor: '#ffffff',
    fallbackBorder: previewBorder,
    fallbackShadow: '0 18px 38px rgba(37,99,235,0.2)',
  });
  const cardStyles = getCardSurfaceOverrides(styles, {
    dark: previewDark,
    fallbackBackground: previewDark
      ? 'rgba(15,23,42,0.66)'
      : 'rgba(255,255,255,0.94)',
    fallbackBorder: previewBorder,
  });

  return (
    <div
      style={{
        marginTop: 18,
        paddingTop: 18,
        borderTop: `1px solid ${tokens.line}`,
        display: 'grid',
        gap: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: tokens.accentText,
              fontWeight: 900,
              marginBottom: 6,
            }}
          >
            Advanced Design
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 20 }}>{title}</h3>
          <p style={{ margin: 0, color: tokens.muted, fontSize: 14, lineHeight: 1.75 }}>
            {description ||
              'Keep the content controls above, then use this editor to make the section feel more intentional without losing clarity.'}
          </p>
        </div>
        <PreviewToggle mode={previewMode} setMode={setPreviewMode} />
      </div>

      <AdminPreviewFrame
        title="Mini Live Preview"
        description="Use this quick preview to understand how the current text, colors, cards, and button choices will feel."
      >
        <div
          style={{
            borderRadius: 24,
            border: `1px solid ${previewBorder}`,
            background: previewBackground,
            padding: '22px 20px',
            color: previewText,
            boxShadow: tokens.softShadow,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              ...getTypographyStyleOverrides('label', styles.typography.label, {
                dark: previewDark,
                isMobile: false,
                fallbackColor: resolveSectionThemeColor(
                  styles.colors.accentLight,
                  styles.colors.accentDark,
                  previewDark,
                  previewDark ? '#7dd3fc' : '#2563eb'
                ),
                fallbackFontWeight: 800,
                fallbackLetterSpacing: '0.12em',
              }),
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: resolveSectionThemeColor(
                  styles.colors.accentLight,
                  styles.colors.accentDark,
                  previewDark,
                  '#38bdf8'
                ),
              }}
            />
            {roleMeta.label.preview}
          </div>
          <div
            style={{
              marginBottom: 10,
              ...getTypographyStyleOverrides('title', styles.typography.title, {
                dark: previewDark,
                isMobile: false,
                fallbackColor: previewText,
                fallbackFontWeight: 850,
                fallbackLineHeight: 1.04,
                fallbackLetterSpacing: '-0.05em',
              }),
            }}
          >
            {roleMeta.title.preview}
          </div>
          <div
            style={{
              marginBottom: 12,
              ...getTypographyStyleOverrides('subtitle', styles.typography.subtitle, {
                dark: previewDark,
                isMobile: false,
                fallbackColor: previewMuted,
                fallbackLineHeight: 1.6,
              }),
            }}
          >
            {roleMeta.subtitle.preview}
          </div>
          <div
            style={{
              maxWidth: 640,
              marginBottom: 18,
              ...getTypographyStyleOverrides('body', styles.typography.body, {
                dark: previewDark,
                isMobile: false,
                fallbackColor: previewMuted,
                fallbackLineHeight: 1.75,
              }),
            }}
          >
            {roleMeta.body.preview}
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
            <button
              type="button"
              style={{
                ...buttonStyles,
                fontWeight: 800,
                ...getTypographyStyleOverrides('button', styles.typography.button, {
                  dark: previewDark,
                  isMobile: false,
                  fallbackColor: '#ffffff',
                }),
              }}
            >
              {roleMeta.button.preview}
              {styles.buttons.showIcon ? ' ->' : ''}
            </button>
          </div>
          <div
            style={{
              borderRadius: styles.card.borderRadius,
              padding: 18,
              ...cardStyles,
            }}
          >
            <div
              style={{
                marginBottom: 6,
                fontWeight: 800,
                color: previewText,
              }}
            >
              Preview card
            </div>
            <div style={{ color: previewMuted, lineHeight: 1.7, fontSize: 14 }}>
              Cards, borders, radius, glow, and background choices show up here so you can judge the surface quickly.
            </div>
          </div>
        </div>
      </AdminPreviewFrame>

      <AdminSectionTabs items={tabs} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'typography' ? (
        <div style={{ display: 'grid', gap: 14 }}>
          {(Object.keys(roleMeta) as TypographyRole[]).map(role => (
            <div key={role} style={groupCardStyle(tokens)}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  marginBottom: 14,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
                    {roleMeta[role].title}
                  </div>
                  <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.7 }}>
                    {roleMeta[role].helper} {roleMeta[role].description}
                  </div>
                </div>
                <AdminActionButton
                  onClick={() => resetTypographyRole(role)}
                  variant="secondary"
                >
                  Reset Group
                </AdminActionButton>
              </div>

              <div
                style={{
                  borderRadius: 18,
                  border: `1px solid ${tokens.line}`,
                  background: tokens.field,
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <div
                  style={getTypographyStyleOverrides(role, styles.typography[role], {
                    dark: tokens.dark,
                    isMobile: false,
                    fallbackColor: tokens.text,
                    fallbackFontWeight: role === 'title' ? 850 : 600,
                    fallbackLineHeight: role === 'body' ? 1.75 : 1.3,
                    fallbackLetterSpacing: role === 'label' ? '0.12em' : undefined,
                  })}
                >
                  {roleMeta[role].preview}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                <ChoiceField
                  label="Size preset"
                  value={styles.typography[role].fontSize}
                  onChange={nextValue => updateTypography(role, 'fontSize', nextValue)}
                  options={fontSizeOptions}
                  hint="Choose a friendlier size preset instead of typing raw pixel values."
                />
                <SelectField
                  label="Font family"
                  value={styles.typography[role].fontFamily}
                  onChange={nextValue => updateTypography(role, 'fontFamily', nextValue)}
                  options={fontFamilyOptions}
                  hint="Pick the font personality for this text only."
                />
                <ChoiceField
                  label="Weight"
                  value={styles.typography[role].fontWeight}
                  onChange={nextValue => updateTypography(role, 'fontWeight', nextValue)}
                  options={fontWeightOptions}
                  hint="Make this text lighter, stronger, or leave it on the page default."
                />
                <ChoiceField
                  label="Alignment"
                  value={styles.typography[role].textAlign}
                  onChange={nextValue => updateTypography(role, 'textAlign', nextValue)}
                  options={alignOptions}
                  hint="This controls where the text sits inside the section."
                />
                <SelectField
                  label="Line height"
                  value={styles.typography[role].lineHeight}
                  onChange={nextValue => updateTypography(role, 'lineHeight', nextValue)}
                  options={lineHeightOptions}
                  hint="Use this when the text feels too tight or too airy."
                />
                <SelectField
                  label="Letter spacing"
                  value={styles.typography[role].letterSpacing}
                  onChange={nextValue => updateTypography(role, 'letterSpacing', nextValue)}
                  options={letterSpacingOptions}
                  hint="Useful for labels and editorial-style headings."
                />
                <ColorField
                  label="Light mode color"
                  value={styles.typography[role].lightColor}
                  onChange={nextValue => updateTypography(role, 'lightColor', nextValue)}
                  hint="How this text appears when the public page is in light mode."
                />
                <ColorField
                  label="Dark mode color"
                  value={styles.typography[role].darkColor}
                  onChange={nextValue => updateTypography(role, 'darkColor', nextValue)}
                  hint="How this text appears when the public page is in dark mode."
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === 'colors' ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={groupCardStyle(tokens)}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Background</div>
                <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.7 }}>
                  This controls the overall section background and surface mood in both themes.
                </div>
              </div>
              <AdminActionButton onClick={resetColors} variant="secondary">
                Reset Colors
              </AdminActionButton>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <ColorField
                label="Section background (light)"
                value={styles.colors.backgroundLight}
                onChange={nextValue => updateColors('backgroundLight', nextValue)}
              />
              <ColorField
                label="Section background (dark)"
                value={styles.colors.backgroundDark}
                onChange={nextValue => updateColors('backgroundDark', nextValue)}
              />
              <ColorField
                label="Card background (light)"
                value={styles.colors.cardBackgroundLight}
                onChange={nextValue => updateColors('cardBackgroundLight', nextValue)}
                hint="This controls cards and boxed content in light mode."
              />
              <ColorField
                label="Card background (dark)"
                value={styles.colors.cardBackgroundDark}
                onChange={nextValue => updateColors('cardBackgroundDark', nextValue)}
                hint="This controls cards and boxed content in dark mode."
              />
            </div>
          </div>

          <div style={groupCardStyle(tokens)}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Accent & Borders</div>
            <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
              Use these when you want labels, dividers, or highlights to feel more branded.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <ColorField
                label="Accent color (light)"
                value={styles.colors.accentLight}
                onChange={nextValue => updateColors('accentLight', nextValue)}
              />
              <ColorField
                label="Accent color (dark)"
                value={styles.colors.accentDark}
                onChange={nextValue => updateColors('accentDark', nextValue)}
              />
              <ColorField
                label="Border color (light)"
                value={styles.colors.borderLight}
                onChange={nextValue => updateColors('borderLight', nextValue)}
              />
              <ColorField
                label="Border color (dark)"
                value={styles.colors.borderDark}
                onChange={nextValue => updateColors('borderDark', nextValue)}
              />
            </div>
          </div>

          <div style={groupCardStyle(tokens)}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Buttons</div>
            <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
              This controls button background and button text color separately for light and dark mode.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <ColorField
                label="Button background (light)"
                value={styles.colors.buttonBackgroundLight}
                onChange={nextValue => updateColors('buttonBackgroundLight', nextValue)}
                hint="This controls button background in light mode."
              />
              <ColorField
                label="Button background (dark)"
                value={styles.colors.buttonBackgroundDark}
                onChange={nextValue => updateColors('buttonBackgroundDark', nextValue)}
                hint="This controls button background in dark mode."
              />
              <ColorField
                label="Button text (light)"
                value={styles.colors.buttonTextLight}
                onChange={nextValue => updateColors('buttonTextLight', nextValue)}
                hint="This controls button text in light mode."
              />
              <ColorField
                label="Button text (dark)"
                value={styles.colors.buttonTextDark}
                onChange={nextValue => updateColors('buttonTextDark', nextValue)}
                hint="This controls button text in dark mode."
              />
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'layout' ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={groupCardStyle(tokens)}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Section Layout</div>
                <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.7 }}>
                  Control section width, spacing, and where the content sits inside the block.
                </div>
              </div>
              <AdminActionButton onClick={resetLayout} variant="secondary">
                Reset Layout
              </AdminActionButton>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <ChoiceField
                label="Width"
                value={styles.layout.width}
                onChange={nextValue => updateLayout('width', nextValue)}
                options={widthOptions}
                hint="Narrow feels focused, full feels more immersive."
              />
              <ChoiceField
                label="Spacing"
                value={styles.layout.padding}
                onChange={nextValue => updateLayout('padding', nextValue)}
                options={paddingOptions}
                hint="Compact pulls content tighter. Spacious gives it more air."
              />
              <ChoiceField
                label="Content alignment"
                value={styles.layout.contentAlign}
                onChange={nextValue => updateLayout('contentAlign', nextValue)}
                options={alignOptions}
                hint="This controls the general alignment of the content stack."
              />
              <ChoiceField
                label="Button alignment"
                value={styles.layout.buttonAlign}
                onChange={nextValue => updateLayout('buttonAlign', nextValue)}
                options={alignOptions}
                hint="Useful when buttons need to break away from the text alignment."
              />
            </div>
          </div>

          <div style={groupCardStyle(tokens)}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Grid & Media Balance</div>
            <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
              These presets help you control how cards or imagery are distributed across the section.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <ChoiceField
                label="Grid columns"
                value={styles.layout.gridColumns}
                onChange={nextValue => updateLayout('gridColumns', nextValue)}
                options={gridOptions}
                hint="Use this when cards or repeated items need a stronger structure."
              />
              <ChoiceField
                label="Image position"
                value={styles.layout.imagePosition}
                onChange={nextValue => updateLayout('imagePosition', nextValue)}
                options={imagePositionOptions}
                hint="This controls where supporting imagery should lean visually."
              />
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'components' ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={groupCardStyle(tokens)}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Buttons</div>
                <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.7 }}>
                  This controls button shape, visual weight, and whether the arrow/icon should appear.
                </div>
              </div>
              <AdminActionButton onClick={resetButtons} variant="secondary">
                Reset Buttons
              </AdminActionButton>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <ChoiceField
                label="Button style"
                value={styles.buttons.stylePreset}
                onChange={nextValue => updateButtons('stylePreset', nextValue)}
                options={buttonStyleOptions}
                hint="Solid is strongest. Soft and glass feel more subtle."
              />
              <ChoiceField
                label="Button size"
                value={styles.buttons.size}
                onChange={nextValue => updateButtons('size', nextValue)}
                options={buttonSizeOptions}
                hint="Use larger sizes for more prominent primary CTAs."
              />
              <AdminField
                label="Button radius"
                hint="Higher values make the button softer and more rounded."
              >
                <input
                  type="number"
                  min={6}
                  max={40}
                  value={styles.buttons.borderRadius}
                  onChange={event =>
                    updateButtons('borderRadius', Number(event.target.value))
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
              <label
                style={{
                  ...groupCardStyle(tokens),
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={styles.buttons.showIcon}
                  onChange={event => updateButtons('showIcon', event.target.checked)}
                />
                <span style={{ fontWeight: 700 }}>
                  Keep the arrow / icon when the section already uses one
                </span>
              </label>
            </div>
          </div>

          <div style={groupCardStyle(tokens)}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Cards</div>
                <div style={{ color: tokens.muted, fontSize: 13, lineHeight: 1.7 }}>
                  This controls the card surface, spacing, shadow strength, glow, and glass treatment.
                </div>
              </div>
              <AdminActionButton onClick={resetCard} variant="secondary">
                Reset Cards
              </AdminActionButton>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <ChoiceField
                label="Card style"
                value={styles.card.stylePreset}
                onChange={nextValue => updateCard('stylePreset', nextValue)}
                options={cardStyleOptions}
                hint="Use editorial or outline when you want a more structured feel."
              />
              <ChoiceField
                label="Shadow"
                value={styles.card.shadow}
                onChange={nextValue => updateCard('shadow', nextValue)}
                options={shadowOptions}
                hint="Stronger shadows make cards feel more elevated."
              />
              <ChoiceField
                label="Glow"
                value={styles.card.glow}
                onChange={nextValue => updateCard('glow', nextValue)}
                options={glowOptions}
                hint="Glow adds subtle light around cards in more premium layouts."
              />
              <ChoiceField
                label="Gradient"
                value={styles.card.gradient}
                onChange={nextValue => updateCard('gradient', nextValue)}
                options={gradientOptions}
                hint="Use gradients sparingly when you want more atmosphere."
              />
              <AdminField
                label="Card radius"
                hint="Higher values soften the card corners."
              >
                <input
                  type="number"
                  min={8}
                  max={40}
                  value={styles.card.borderRadius}
                  onChange={event =>
                    updateCard('borderRadius', Number(event.target.value))
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
              <AdminField
                label="Card gap"
                hint="This affects internal breathing room between card elements."
              >
                <input
                  type="number"
                  min={8}
                  max={48}
                  value={styles.card.gap}
                  onChange={event => updateCard('gap', Number(event.target.value))}
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
              <label
                style={{
                  ...groupCardStyle(tokens),
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={styles.card.glassEffect}
                  onChange={event => updateCard('glassEffect', event.target.checked)}
                />
                <span style={{ fontWeight: 700 }}>Use blur / glass effect where supported</span>
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
