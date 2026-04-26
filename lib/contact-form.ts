import {
  CONTACT_PURPOSE_OPTIONS,
  PREFERRED_CONTACT_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  WORK_BUDGET_RANGE_OPTIONS,
  isReasonablyValidPhone,
  mapContactPurposeToIntent,
  type ContactPurpose,
} from '@/lib/crm-shared';

export type ContactFormState = {
  attachmentLink: string;
  budgetRange: string;
  companyName: string;
  collaborationType: string;
  contactPurpose: ContactPurpose;
  deadline: string;
  email: string;
  message: string;
  mobileNumber: string;
  name: string;
  preferredContactMethod: string;
  projectType: string;
  serviceType: string;
  sourcePage: string;
  subject: string;
  timeline: string;
  whatsappNumber: string;
};

export type ContactFieldKey = keyof ContactFormState | 'contactNumber' | 'form';
export type ContactFormErrors = Partial<Record<ContactFieldKey, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimValue(value: string) {
  return value.trim();
}

function isFutureOrTodayDate(value: string) {
  if (!value) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(`${value}T00:00:00`);
  return !Number.isNaN(selected.getTime()) && selected >= today;
}

function isHttpUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultContactFormState(): ContactFormState {
  return {
    attachmentLink: '',
    budgetRange: '',
    companyName: '',
    collaborationType: '',
    contactPurpose: CONTACT_PURPOSE_OPTIONS[0],
    deadline: '',
    email: '',
    message: '',
    mobileNumber: '',
    name: '',
    preferredContactMethod: 'WhatsApp',
    projectType: '',
    serviceType: 'Video Editing',
    sourcePage: '/contact',
    subject: '',
    timeline: '',
    whatsappNumber: '',
  };
}

export function isWorkInquiryPurpose(purpose: ContactPurpose | string) {
  return purpose === 'Work Inquiry / Project';
}

export function isGeneralMessagePurpose(purpose: ContactPurpose | string) {
  return purpose === 'General Message';
}

export function isCollaborationPurpose(purpose: ContactPurpose | string) {
  return purpose === 'Collaboration';
}

export function isOtherPurpose(purpose: ContactPurpose | string) {
  return purpose === 'Other';
}

export function getVisibleContactFieldKeys(purpose: ContactPurpose | string) {
  if (isWorkInquiryPurpose(purpose)) {
    return [
      'contactPurpose',
      'name',
      'email',
      'mobileNumber',
      'whatsappNumber',
      'serviceType',
      'projectType',
      'budgetRange',
      'deadline',
      'preferredContactMethod',
      'message',
      'attachmentLink',
      'companyName',
      'contactNumber',
    ] as ContactFieldKey[];
  }

  if (isCollaborationPurpose(purpose)) {
    return [
      'contactPurpose',
      'name',
      'email',
      'collaborationType',
      'companyName',
      'message',
      'preferredContactMethod',
      'mobileNumber',
      'whatsappNumber',
      'attachmentLink',
      'timeline',
    ] as ContactFieldKey[];
  }

  if (isOtherPurpose(purpose)) {
    return [
      'contactPurpose',
      'name',
      'email',
      'subject',
      'message',
      'mobileNumber',
      'whatsappNumber',
      'preferredContactMethod',
    ] as ContactFieldKey[];
  }

  return [
    'contactPurpose',
    'name',
    'email',
    'message',
    'mobileNumber',
    'whatsappNumber',
    'preferredContactMethod',
  ] as ContactFieldKey[];
}

export function normalizeContactFormForPurpose(
  input: ContactFormState
): ContactFormState & { intentCategory: string } {
  const purpose = CONTACT_PURPOSE_OPTIONS.includes(input.contactPurpose)
    ? input.contactPurpose
    : CONTACT_PURPOSE_OPTIONS[0];
  const next: ContactFormState = {
    attachmentLink: trimValue(input.attachmentLink),
    budgetRange: trimValue(input.budgetRange),
    companyName: trimValue(input.companyName),
    collaborationType: trimValue(input.collaborationType),
    contactPurpose: purpose,
    deadline: trimValue(input.deadline),
    email: trimValue(input.email).toLowerCase(),
    message: trimValue(input.message),
    mobileNumber: trimValue(input.mobileNumber),
    name: trimValue(input.name),
    preferredContactMethod: trimValue(input.preferredContactMethod),
    projectType: trimValue(input.projectType),
    serviceType: trimValue(input.serviceType),
    sourcePage: trimValue(input.sourcePage) || '/contact',
    subject: trimValue(input.subject),
    timeline: trimValue(input.timeline),
    whatsappNumber: trimValue(input.whatsappNumber),
  };

  if (isWorkInquiryPurpose(purpose)) {
    return {
      ...next,
      collaborationType: '',
      intentCategory: mapContactPurposeToIntent(purpose),
      subject: '',
      timeline: '',
    };
  }

  if (isCollaborationPurpose(purpose)) {
    return {
      ...next,
      budgetRange: '',
      deadline: '',
      intentCategory: mapContactPurposeToIntent(purpose),
      projectType: '',
      serviceType: '',
      subject: '',
    };
  }

  if (isOtherPurpose(purpose)) {
    return {
      ...next,
      attachmentLink: '',
      budgetRange: '',
      companyName: '',
      collaborationType: '',
      deadline: '',
      intentCategory: mapContactPurposeToIntent(purpose),
      projectType: '',
      serviceType: '',
      timeline: '',
    };
  }

  return {
    ...next,
    attachmentLink: '',
    budgetRange: '',
    companyName: '',
    collaborationType: '',
    deadline: '',
    intentCategory: mapContactPurposeToIntent(purpose),
    projectType: '',
    serviceType: '',
    subject: '',
    timeline: '',
  };
}

export function buildContactSubmissionPayload(input: ContactFormState) {
  const form = normalizeContactFormForPurpose(input);
  const basePayload = {
    contactPurpose: form.contactPurpose,
    email: form.email,
    intentCategory: form.intentCategory,
    message: form.message,
    name: form.name,
    sourcePage: form.sourcePage,
    ...(form.mobileNumber ? { mobileNumber: form.mobileNumber } : {}),
    ...(form.whatsappNumber ? { whatsappNumber: form.whatsappNumber } : {}),
    ...(form.preferredContactMethod
      ? { preferredContactMethod: form.preferredContactMethod }
      : {}),
  };

  if (isWorkInquiryPurpose(form.contactPurpose)) {
    return {
      ...basePayload,
      budgetRange: form.budgetRange,
      deadline: form.deadline,
      message: form.message,
      projectType: form.projectType,
      serviceType: form.serviceType,
      ...(form.attachmentLink ? { attachmentLink: form.attachmentLink } : {}),
      ...(form.companyName ? { companyName: form.companyName } : {}),
    };
  }

  if (isCollaborationPurpose(form.contactPurpose)) {
    return {
      ...basePayload,
      collaborationType: form.collaborationType,
      companyName: form.companyName,
      ...(form.attachmentLink ? { attachmentLink: form.attachmentLink } : {}),
      ...(form.timeline ? { timeline: form.timeline } : {}),
    };
  }

  if (isOtherPurpose(form.contactPurpose)) {
    return {
      ...basePayload,
      subject: form.subject,
    };
  }

  return basePayload;
}

export function validateContactForm(input: ContactFormState): ContactFormErrors {
  const form = normalizeContactFormForPurpose(input);
  const errors: ContactFormErrors = {};

  if (!form.name) {
    errors.name = 'Please enter your name.';
  }

  if (!form.email) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!form.message) {
    errors.message = 'Please write your message.';
  } else if (form.message.length < 10) {
    errors.message = 'Please write at least 10 characters.';
  }

  if (form.mobileNumber && !isReasonablyValidPhone(form.mobileNumber)) {
    errors.mobileNumber = 'Enter a valid phone number.';
  }

  if (form.whatsappNumber && !isReasonablyValidPhone(form.whatsappNumber)) {
    errors.whatsappNumber = 'Enter a valid WhatsApp number.';
  }

  if (form.attachmentLink && !isHttpUrl(form.attachmentLink)) {
    errors.attachmentLink = 'Please use a valid http or https link.';
  }

  if (form.preferredContactMethod) {
    if (!PREFERRED_CONTACT_OPTIONS.includes(form.preferredContactMethod as never)) {
      errors.preferredContactMethod = 'Choose a valid contact method.';
    }

    if (form.preferredContactMethod === 'Mobile' && !form.mobileNumber) {
      errors.mobileNumber = 'Add a mobile number for mobile contact.';
    }

    if (form.preferredContactMethod === 'WhatsApp' && !form.whatsappNumber) {
      errors.whatsappNumber = 'Add a WhatsApp number for WhatsApp contact.';
    }
  }

  if (isWorkInquiryPurpose(form.contactPurpose)) {
    if (!form.mobileNumber && !form.whatsappNumber) {
      errors.contactNumber = 'Add at least a phone number or WhatsApp number.';
    }

    if (!form.serviceType) {
      errors.serviceType = 'Select the service you need.';
    } else if (!SERVICE_TYPE_OPTIONS.includes(form.serviceType as never)) {
      errors.serviceType = 'Choose a valid service type.';
    }

    if (!form.projectType) {
      errors.projectType = 'Please describe the project type.';
    }

    if (!form.budgetRange) {
      errors.budgetRange = 'Choose a budget range.';
    } else if (!WORK_BUDGET_RANGE_OPTIONS.includes(form.budgetRange as never)) {
      errors.budgetRange = 'Choose one of the available budget ranges.';
    }

    if (!form.deadline) {
      errors.deadline = 'Please choose a deadline.';
    } else if (!isFutureOrTodayDate(form.deadline)) {
      errors.deadline = 'Deadline cannot be in the past.';
    }

    if (!form.preferredContactMethod) {
      errors.preferredContactMethod = 'Choose your preferred contact method.';
    }
  }

  if (isCollaborationPurpose(form.contactPurpose)) {
    if (!form.collaborationType) {
      errors.collaborationType = 'Select the collaboration type.';
    }

    if (!form.companyName) {
      errors.companyName = 'Please share the organization, platform, or brand.';
    }

    if (!form.preferredContactMethod) {
      errors.preferredContactMethod = 'Choose your preferred contact method.';
    }

    if (form.timeline && !isFutureOrTodayDate(form.timeline)) {
      errors.timeline = 'Expected timeline cannot be in the past.';
    }
  }

  if (isOtherPurpose(form.contactPurpose) && !form.subject) {
    errors.subject = 'Please add a subject.';
  }

  return errors;
}
