import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Md. Minhajul Hoque | Video Editor & Graphics Designer',
  description: 'Professional video editing and motion graphics portfolio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
        <ThemeProvider>
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}