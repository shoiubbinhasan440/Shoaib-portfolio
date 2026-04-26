import NavbarClient from '@/components/NavbarClient';
import { getServerGlobalSettings } from '@/lib/server-site-settings';
import { getServerNavigationConfig } from '@/lib/server-navigation';

export default async function Navbar() {
  const [navigationConfig, globalSettings] = await Promise.all([
    getServerNavigationConfig(),
    getServerGlobalSettings(),
  ]);

  return (
    <NavbarClient
      globalSettings={globalSettings}
      navigationConfig={navigationConfig}
    />
  );
}

