'use client';

import { useRef } from 'react';
import {
  AdminActionButton,
  AdminField,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';

type AdminImageFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFileSelected: (file: File) => void | Promise<void>;
  uploading: boolean;
  hint?: string;
  previewHeight?: number;
  onError?: (message: string) => void;
  maxSizeMb?: number;
  accept?: string;
  previewAlt?: string;
  full?: boolean;
  urlPlaceholder?: string;
};

function isSupportedImageType(type: string) {
  return [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
    'image/x-icon',
    'image/vnd.microsoft.icon',
  ].includes(type);
}

export default function AdminImageField({
  label,
  value,
  onChange,
  onFileSelected,
  uploading,
  hint,
  previewHeight = 180,
  onError,
  maxSizeMb = 5,
  accept = 'image/*',
  previewAlt,
  full = false,
  urlPlaceholder = 'Paste image URL or upload a file',
}: AdminImageFieldProps) {
  const tokens = useAdminThemeTokens();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handlePickedFile(file: File) {
    if (!isSupportedImageType(file.type)) {
      onError?.('❌ Please upload a JPG, PNG, WebP, GIF, SVG, AVIF, or ICO image.');
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      onError?.(`❌ Please keep images under ${maxSizeMb} MB.`);
      return;
    }

    await onFileSelected(file);
  }

  return (
    <AdminField
      label={label}
      hint={
        hint ||
        `Upload a file or keep a direct URL. Supported: JPG, PNG, WebP, GIF, SVG, AVIF, ICO up to ${maxSizeMb} MB.`
      }
      full={full}
    >
      <div
        style={{
          border: `1px solid ${tokens.line}`,
          borderRadius: 20,
          padding: 14,
          background: tokens.fieldSoft,
          boxShadow: tokens.softShadow,
        }}
      >
        {value ? (
          <img
            src={value}
            alt={previewAlt || label}
            style={{
              width: '100%',
              height: previewHeight,
              objectFit: 'cover',
              borderRadius: 16,
              border: `1px solid ${tokens.line}`,
              marginBottom: 12,
              background: tokens.field,
            }}
          />
        ) : (
          <div
            style={{
              height: previewHeight,
              borderRadius: 16,
              border: `1px dashed ${tokens.line}`,
              display: 'grid',
              placeItems: 'center',
              color: tokens.subtle,
              marginBottom: 12,
              background: tokens.field,
              textAlign: 'center',
              padding: 20,
            }}
          >
            No image selected yet
          </div>
        )}

        <input
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={urlPlaceholder}
          style={{
            width: '100%',
            background: tokens.field,
            border: `1px solid ${tokens.line}`,
            borderRadius: 14,
            color: tokens.text,
            padding: '12px 14px',
            fontSize: 14,
            boxSizing: 'border-box',
            marginBottom: 12,
          }}
        />

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) {
              void handlePickedFile(file);
              event.target.value = '';
            }
          }}
        />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <AdminActionButton
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            variant="primary"
          >
            {uploading ? 'Uploading...' : value ? 'Change Image' : 'Upload Image'}
          </AdminActionButton>
          {value ? (
            <AdminActionButton onClick={() => onChange('')} variant="secondary">
              Remove
            </AdminActionButton>
          ) : null}
        </div>
      </div>
    </AdminField>
  );
}
