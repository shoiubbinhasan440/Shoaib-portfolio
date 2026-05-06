'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AdminActionButton,
  AdminField,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';
import {
  IMAGE_FILE_ACCEPT,
  getImageUploadHint,
  validateImageFile,
  type ImageUploadProfile,
} from '@/lib/image-upload-validation';

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
  uploadProfile?: ImageUploadProfile;
  previewAlt?: string;
  full?: boolean;
  urlPlaceholder?: string;
};

export default function AdminImageField({
  label,
  value,
  onChange,
  onFileSelected,
  uploading,
  hint,
  previewHeight = 180,
  onError,
  maxSizeMb,
  accept = IMAGE_FILE_ACCEPT,
  uploadProfile = 'default',
  previewAlt,
  full = false,
  urlPlaceholder = 'Paste image URL or upload a file',
}: AdminImageFieldProps) {
  const tokens = useAdminThemeTokens();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedPreview, setSelectedPreview] = useState('');
  const [selectedMeta, setSelectedMeta] = useState('');
  const [localMessage, setLocalMessage] = useState('');

  useEffect(() => {
    return () => {
      if (selectedPreview) {
        URL.revokeObjectURL(selectedPreview);
      }
    };
  }, [selectedPreview]);

  async function handlePickedFile(file: File) {
    setLocalMessage('');

    const validation = await validateImageFile(file, {
      profile: uploadProfile,
      maxBytes: maxSizeMb ? maxSizeMb * 1024 * 1024 : undefined,
      requireDimensions: true,
    });

    if (!validation.valid) {
      const nextMessage = `❌ ${validation.error}`;
      setLocalMessage(nextMessage);
      onError?.(nextMessage);
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    if (selectedPreview) {
      URL.revokeObjectURL(selectedPreview);
    }
    setSelectedPreview(nextPreview);
    setSelectedMeta(
      `${validation.sizeLabel}${
        validation.width && validation.height
          ? ` · ${validation.width}×${validation.height}px`
          : ''
      }`
    );

    if (validation.warning) {
      setLocalMessage(`⚠️ ${validation.warning}`);
    }

    try {
      await onFileSelected(file);
      setLocalMessage('✅ ইমেজ আপলোড হয়েছে।');
    } catch (error) {
      const nextMessage =
        error instanceof Error ? `❌ ${error.message}` : '❌ Image upload failed.';
      setLocalMessage(nextMessage);
      onError?.(nextMessage);
    }
  }

  const previewSource = selectedPreview || value;

  return (
    <AdminField
      label={label}
      hint={hint || getImageUploadHint(uploadProfile)}
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
        {previewSource ? (
          <img
            src={previewSource}
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

        {selectedMeta ? (
          <div style={{ color: tokens.subtle, fontSize: 12, marginBottom: 10 }}>
            Selected: {selectedMeta}
          </div>
        ) : null}

        {localMessage ? (
          <div
            style={{
              color: localMessage.startsWith('❌')
                ? '#fecaca'
                : localMessage.startsWith('⚠️')
                  ? '#fde68a'
                  : '#bbf7d0',
              fontSize: 12,
              lineHeight: 1.5,
              marginBottom: 10,
            }}
          >
            {localMessage}
          </div>
        ) : null}

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
