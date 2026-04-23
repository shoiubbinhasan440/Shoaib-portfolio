import { redirect } from 'next/navigation';

export default function LegacyHomepageEditorRedirect() {
  redirect('/admin/homepage-portfolio');
}
