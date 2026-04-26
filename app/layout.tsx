import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildPageMetadata, buildStructuredData } from '@/lib/site-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerGlobalSettings();
  return buildPageMetadata(settings, 'home');
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getServerGlobalSettings();
  const structuredData = buildStructuredData(settings);

  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <Navbar />
          {children}
        </ThemeProvider>
        {structuredData.map((entry, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          />
        ))}
      </body>
    </html>
  );
}
