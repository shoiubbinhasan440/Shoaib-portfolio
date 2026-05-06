import PremiumPortfolioLoader from '@/components/PremiumPortfolioLoader';
import { getPremiumLoaderConfig } from '@/lib/premium-loader';

export default async function AdminLoading() {
  const { images, settings } = await getPremiumLoaderConfig();

  if (!settings.loader.enabled || !settings.loader.applyToAdmin) {
    return null;
  }

  return (
    <PremiumPortfolioLoader
      images={images}
      minimumDuration={settings.loader.minimumDuration}
      mode={settings.theme.defaultTheme}
      rotationSpeed={settings.loader.rotationSpeed}
      showProgressDots={settings.loader.showProgressDots}
      showRotatingStroke={settings.loader.showRotatingStroke}
      style={settings.loader.style}
      text={settings.loader.text}
    />
  );
}
