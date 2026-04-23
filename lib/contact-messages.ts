export {
  CRM_LEADS_SETTING_KEY as CONTACT_MESSAGES_SETTING_KEY,
  createContactLead as createContactMessage,
  deleteContactLead as deleteContactMessage,
  getContactLeads as getContactMessages,
  saveContactLeads as saveContactMessages,
  updateContactLead as updateContactMessage,
  type ContactLead as ContactMessage,
  type ContactLeadInput as ContactMessageInput,
} from '@/lib/crm';
