'use client';

import { AdminField, getAdminInputStyle, useAdminThemeTokens } from '@/components/admin/admin-ui';

export type AdminTextStyleValue = {
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  textTransform?: string;
  lightColor?: string;
  darkColor?: string;
  accentColor?: string;
  backgroundStyle?: string;
  maxWidth?: string;
  spacing?: string;
};

type AdminTextStyleControlsProps<T extends AdminTextStyleValue> = {
  helper?: string;
  onChange: (value: T) => void;
  onReset?: () => void;
  title?: string;
  value: T;
};

const fontSizeOptions = [
  ['default', 'Default'],
  ['xs', 'XS'],
  ['sm', 'Small'],
  ['md', 'Medium'],
  ['lg', 'Large'],
  ['xl', 'XL'],
];

const fontFamilyOptions = [
  ['inherit', 'Inherit'],
  ['sans', 'Sans'],
  ['serif', 'Serif'],
  ['mono', 'Mono'],
];

const fontWeightOptions = [
  ['regular', 'Regular'],
  ['medium', 'Medium'],
  ['semibold', 'Semibold'],
  ['bold', 'Bold'],
  ['black', 'Black'],
];

export default function AdminTextStyleControls<T extends AdminTextStyleValue>({
  helper = 'These controls affect the text block in this same section.',
  onChange,
  onReset,
  title = 'Text Style',
  value,
}: AdminTextStyleControlsProps<T>) {
  const tokens = useAdminThemeTokens();
  const inputStyle = getAdminInputStyle(tokens);

  function update(key: keyof AdminTextStyleValue, nextValue: string) {
    onChange({ ...value, [key]: nextValue } as T);
  }

  return (
    <details
      style={{
        border: `1px solid ${tokens.line}`,
        borderRadius: 18,
        background: tokens.fieldSoft,
        padding: 14,
        gridColumn: '1 / -1',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          color: tokens.text,
          fontWeight: 900,
          fontSize: 14,
        }}
      >
        {title}
      </summary>
      <p style={{ color: tokens.muted, fontSize: 12, lineHeight: 1.65, margin: '10px 0 14px' }}>
        {helper}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
        }}
      >
        <AdminField label="Font size preset">
          <select value={value.fontSize || 'default'} onChange={event => update('fontSize', event.target.value)} style={inputStyle}>
            {fontSizeOptions.map(([optionValue, label]) => (
              <option key={optionValue} value={optionValue}>{label}</option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Font family">
          <select value={value.fontFamily || 'inherit'} onChange={event => update('fontFamily', event.target.value)} style={inputStyle}>
            {fontFamilyOptions.map(([optionValue, label]) => (
              <option key={optionValue} value={optionValue}>{label}</option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Font weight">
          <select value={value.fontWeight || 'medium'} onChange={event => update('fontWeight', event.target.value)} style={inputStyle}>
            {fontWeightOptions.map(([optionValue, label]) => (
              <option key={optionValue} value={optionValue}>{label}</option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Line height">
          <input value={value.lineHeight || ''} onChange={event => update('lineHeight', event.target.value)} placeholder="1.6" style={inputStyle} />
        </AdminField>
        <AdminField label="Letter spacing">
          <input value={value.letterSpacing || ''} onChange={event => update('letterSpacing', event.target.value)} placeholder="0px" style={inputStyle} />
        </AdminField>
        <AdminField label="Text alignment">
          <select value={value.textAlign || 'left'} onChange={event => update('textAlign', event.target.value)} style={inputStyle}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </AdminField>
        <AdminField label="Text transform">
          <select value={value.textTransform || 'none'} onChange={event => update('textTransform', event.target.value)} style={inputStyle}>
            <option value="none">None</option>
            <option value="uppercase">Uppercase</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </AdminField>
        <AdminField label="Light mode color">
          <input type="color" value={value.lightColor || '#0f172a'} onChange={event => update('lightColor', event.target.value)} style={{ ...inputStyle, padding: 6, height: 45 }} />
        </AdminField>
        <AdminField label="Dark mode color">
          <input type="color" value={value.darkColor || '#f8fafc'} onChange={event => update('darkColor', event.target.value)} style={{ ...inputStyle, padding: 6, height: 45 }} />
        </AdminField>
        <AdminField label="Accent/highlight color">
          <input type="color" value={value.accentColor || '#38bdf8'} onChange={event => update('accentColor', event.target.value)} style={{ ...inputStyle, padding: 6, height: 45 }} />
        </AdminField>
        <AdminField label="Background style">
          <select value={value.backgroundStyle || 'none'} onChange={event => update('backgroundStyle', event.target.value)} style={inputStyle}>
            <option value="none">None</option>
            <option value="soft-pill">Soft pill</option>
            <option value="subtle-card">Subtle card</option>
            <option value="glow-accent">Glow accent</option>
          </select>
        </AdminField>
        <AdminField label="Max width">
          <input value={value.maxWidth || ''} onChange={event => update('maxWidth', event.target.value)} placeholder="720px" style={inputStyle} />
        </AdminField>
        <AdminField label="Spacing / margin">
          <input value={value.spacing || ''} onChange={event => update('spacing', event.target.value)} placeholder="0 0 12px" style={inputStyle} />
        </AdminField>
        {onReset ? (
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              type="button"
              onClick={onReset}
              style={{
                width: '100%',
                borderRadius: 14,
                border: `1px solid ${tokens.line}`,
                background: tokens.field,
                color: tokens.text,
                padding: '12px 14px',
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              Reset to default
            </button>
          </div>
        ) : null}
      </div>
    </details>
  );
}
