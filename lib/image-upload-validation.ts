export const LOGO_MAX_SIZE = 100 * 1024;
export const THUMBNAIL_RECOMMENDED_MIN_SIZE = 100 * 1024;
export const THUMBNAIL_RECOMMENDED_MAX_SIZE = 400 * 1024;
export const THUMBNAIL_MAX_SIZE = 800 * 1024;
export const HERO_MAX_SIZE = 800 * 1024;
export const SHOWCASE_MAX_SIZE = 1024 * 1024;
export const DEFAULT_IMAGE_MAX_SIZE = 800 * 1024;

export const IMAGE_TOO_LARGE_MESSAGE =
  'ছবির সাইজ বেশি হয়েছে। অনুগ্রহ করে 800KB-এর নিচে কমপ্রেস করে আবার আপলোড করুন।';
export const IMAGE_TYPE_ERROR_MESSAGE = 'শুধু JPG, PNG বা WebP ইমেজ আপলোড করা যাবে।';

export type ImageUploadProfile = 'default' | 'hero' | 'thumbnail' | 'showcase' | 'logo';

export type ImageValidationOptions = {
  profile?: ImageUploadProfile;
  maxBytes?: number;
  minWidth?: number;
  minHeight?: number;
  requireDimensions?: boolean;
};

export type ImageValidationResult = {
  valid: boolean;
  error?: string;
  warning?: string;
  sizeLabel: string;
  width?: number;
  height?: number;
};

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
export const IMAGE_FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

export function getImageUploadMaxBytes(profile: ImageUploadProfile = 'default') {
  switch (profile) {
    case 'logo':
      return LOGO_MAX_SIZE;
    case 'showcase':
      return SHOWCASE_MAX_SIZE;
    case 'hero':
      return HERO_MAX_SIZE;
    case 'thumbnail':
      return THUMBNAIL_MAX_SIZE;
    default:
      return DEFAULT_IMAGE_MAX_SIZE;
  }
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function getCompressionSuggestion(maxBytes: number) {
  return `ছবিটি ${formatBytes(maxBytes)}-এর নিচে কমপ্রেস করে আবার চেষ্টা করুন।`;
}

export function isAllowedImageMimeType(type: string) {
  return ALLOWED_IMAGE_MIME_TYPES.includes(type.toLowerCase());
}

export function isAllowedImageExtension(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return ALLOWED_IMAGE_EXTENSIONS.includes(extension);
}

export function getImageUploadHint(profile: ImageUploadProfile = 'default') {
  if (profile === 'logo') {
    return 'JPG, PNG বা WebP আপলোড করুন। Logo/icon সর্বোচ্চ 100KB।';
  }

  if (profile === 'thumbnail') {
    return 'JPG, PNG বা WebP আপলোড করুন। Portfolio thumbnail recommended 100KB-400KB, hard max 800KB।';
  }

  if (profile === 'showcase') {
    return 'JPG, PNG বা WebP আপলোড করুন। Showcase/gallery image সর্বোচ্চ 1MB।';
  }

  return 'JPG, PNG বা WebP আপলোড করুন। সর্বোচ্চ 800KB।';
}

async function readImageDimensions(file: File) {
  if (typeof window === 'undefined') {
    return {};
  }

  const url = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Image dimensions could not be read.'));
      image.src = url;
    });

    return dimensions;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function validateImageFile(
  file: File,
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const profile = options.profile || 'default';
  const maxBytes = options.maxBytes || getImageUploadMaxBytes(profile);
  const sizeLabel = formatBytes(file.size);

  if (!isAllowedImageMimeType(file.type) || !isAllowedImageExtension(file.name)) {
    return { valid: false, error: IMAGE_TYPE_ERROR_MESSAGE, sizeLabel };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error:
        maxBytes === DEFAULT_IMAGE_MAX_SIZE || maxBytes === HERO_MAX_SIZE || maxBytes === THUMBNAIL_MAX_SIZE
          ? IMAGE_TOO_LARGE_MESSAGE
          : `ছবির সাইজ বেশি হয়েছে। ${getCompressionSuggestion(maxBytes)}`,
      sizeLabel,
    };
  }

  let dimensions: { width?: number; height?: number } = {};
  try {
    dimensions = await readImageDimensions(file);
  } catch {
    if (options.requireDimensions) {
      return { valid: false, error: 'ইমেজটি পড়া যায়নি। অন্য JPG, PNG বা WebP ফাইল দিন।', sizeLabel };
    }
  }

  if (options.minWidth && dimensions.width && dimensions.width < options.minWidth) {
    return {
      valid: false,
      error: `ইমেজের width কম। অন্তত ${options.minWidth}px width দিন।`,
      sizeLabel,
      ...dimensions,
    };
  }

  if (options.minHeight && dimensions.height && dimensions.height < options.minHeight) {
    return {
      valid: false,
      error: `ইমেজের height কম। অন্তত ${options.minHeight}px height দিন।`,
      sizeLabel,
      ...dimensions,
    };
  }

  const warning =
    profile === 'thumbnail' && file.size > THUMBNAIL_RECOMMENDED_MAX_SIZE
      ? 'Portfolio thumbnail 100KB-400KB রাখলে homepage দ্রুত load হবে।'
      : undefined;

  return {
    valid: true,
    warning,
    sizeLabel,
    ...dimensions,
  };
}

export async function hasValidImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  return isJpeg || isPng || isWebp;
}
