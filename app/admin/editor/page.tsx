import { redirect } from 'next/navigation';

export default function RemovedVisualEditorRedirect() {
  redirect('/admin/dashboard');
}
