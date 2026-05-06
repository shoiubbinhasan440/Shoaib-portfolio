import type { Metadata } from 'next';
import { GoogleAnalytics } from "@next/third-parties/google";
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import GlobalRouteLoader from '@/components/GlobalRouteLoader';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { buildPageMetadata, buildStructuredData } from '@/lib/site-metadata';
import { getPremiumLoaderConfig } from '@/lib/premium-loader';

function toJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

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
  const loaderConfig = await getPremiumLoaderConfig();
  const structuredData = buildStructuredData(settings);

  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <Navbar />
          {children}
          {loaderConfig.settings.loader.enabled ? (
            <GlobalRouteLoader
              images={loaderConfig.images}
              loader={loaderConfig.settings.loader}
              mode={loaderConfig.settings.theme.defaultTheme}
            />
          ) : null}
        </ThemeProvider>
        {structuredData.map((entry, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: toJsonLd(entry) }}
          />
        ))}
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        ) : null}
      </body>
    </html>
  );
}
