'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type {
  GlobalSettingsConfig,
  PremiumLoaderRotationSpeed,
  PremiumLoaderStyle,
} from '@/lib/global-settings';

export type PremiumPortfolioLoaderImage = {
  alt: string;
  src: string;
  type?: 'brand' | 'graphic' | 'marketing' | 'video';
};

type PremiumPortfolioLoaderProps = {
  images?: PremiumPortfolioLoaderImage[];
  mode?: GlobalSettingsConfig['theme']['defaultTheme'];
  minimumDuration?: GlobalSettingsConfig['loader']['minimumDuration'];
  rotationSpeed?: PremiumLoaderRotationSpeed;
  showProgressDots?: boolean;
  showRotatingStroke?: boolean;
  style?: PremiumLoaderStyle;
  text?: string;
};

const fallbackImages: PremiumPortfolioLoaderImage[] = [
  {
    alt: 'Md Minhajul Hoque portfolio preview',
    src: '/og-image.jpg',
    type: 'brand',
  },
];

function normalizeImages(images: PremiumPortfolioLoaderImage[] | undefined) {
  const cleanImages = (images || []).filter(item => item.src);
  return cleanImages.length > 0 ? cleanImages.slice(0, 12) : fallbackImages;
}

export default function PremiumPortfolioLoader({
  images,
  mode = 'dark',
  rotationSpeed = 300,
  showProgressDots = true,
  showRotatingStroke = true,
  style = 'portfolio-circle',
  text = 'Loading portfolio...',
}: PremiumPortfolioLoaderProps) {
  const loaderImages = useMemo(() => normalizeImages(images), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const hasMultipleImages = loaderImages.length > 1;
  const singleImage = !hasMultipleImages;
  const isSimpleLine = style === 'simple-line';
  const isMinimalFade = style === 'minimal-fade';

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), 40);
    return () => window.clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!hasMultipleImages || isMinimalFade) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveIndex(current => (current + 1) % loaderImages.length);
    }, rotationSpeed);

    return () => window.clearInterval(interval);
  }, [hasMultipleImages, isMinimalFade, loaderImages.length, rotationSpeed]);

  const activeImage = loaderImages[activeIndex] || loaderImages[0];

  return (
    <div
      className={`premium-loader premium-loader--${style} ${
        visible ? 'premium-loader--visible' : ''
      }`}
      data-mode={mode}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="premium-loader__glow" aria-hidden="true" />
      <div className="premium-loader__stage">
        {showRotatingStroke && !isMinimalFade ? (
          <div className="premium-loader__ring" aria-hidden="true" />
        ) : null}
        <div className={`premium-loader__media ${singleImage ? 'premium-loader__media--single' : ''}`}>
          {loaderImages.map((item, index) => (
            <Image
              key={`${item.src}-${index}`}
              src={item.src}
              alt={item.alt || 'Portfolio preview'}
              fill
              sizes="(max-width: 640px) 120px, 160px"
              priority={index === 0}
              className={`premium-loader__image ${
                index === activeIndex ? 'premium-loader__image--active' : ''
              }`}
            />
          ))}
          {singleImage ? <div className="premium-loader__living-pattern" aria-hidden="true" /> : null}
          <div className="premium-loader__shine" aria-hidden="true" />
        </div>
      </div>

      {isSimpleLine ? <div className="premium-loader__line" aria-hidden="true" /> : null}

      <div className="premium-loader__text">{text}</div>

      {showProgressDots && hasMultipleImages && !isMinimalFade ? (
        <div className="premium-loader__dots" aria-hidden="true">
          {loaderImages.map((item, index) => (
            <span
              key={`${item.src}-dot-${index}`}
              className={index === activeIndex ? 'premium-loader__dot--active' : ''}
            />
          ))}
        </div>
      ) : null}

      <span className="sr-only">{activeImage.alt}</span>

      <style>{`
        .premium-loader {
          --loader-bg: #020617;
          --loader-text: rgba(248, 250, 252, 0.9);
          --loader-muted: rgba(203, 213, 225, 0.62);
          --loader-frame: rgba(248, 250, 252, 0.15);
          --loader-glow: rgba(14, 165, 233, 0.26);
          min-height: 100svh;
          width: 100%;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 16px;
          padding: 32px 18px;
          background:
            radial-gradient(circle at 50% 46%, rgba(14, 165, 233, 0.13), transparent 34%),
            linear-gradient(135deg, var(--loader-bg), #07111f 52%, var(--loader-bg));
          color: var(--loader-text);
          opacity: 0;
          transform: scale(0.985);
          transition: opacity 260ms ease, transform 260ms ease;
        }

        .premium-loader[data-mode='light'] {
          --loader-bg: #f8fafc;
          --loader-text: rgba(15, 23, 42, 0.9);
          --loader-muted: rgba(51, 65, 85, 0.62);
          --loader-frame: rgba(15, 23, 42, 0.12);
          --loader-glow: rgba(37, 99, 235, 0.2);
          background:
            radial-gradient(circle at 50% 46%, rgba(37, 99, 235, 0.12), transparent 34%),
            linear-gradient(135deg, #ffffff, var(--loader-bg) 58%, #eef6ff);
        }

        @media (prefers-color-scheme: light) {
          .premium-loader[data-mode='system'] {
            --loader-bg: #f8fafc;
            --loader-text: rgba(15, 23, 42, 0.9);
            --loader-muted: rgba(51, 65, 85, 0.62);
            --loader-frame: rgba(15, 23, 42, 0.12);
            --loader-glow: rgba(37, 99, 235, 0.2);
            background:
              radial-gradient(circle at 50% 46%, rgba(37, 99, 235, 0.12), transparent 34%),
              linear-gradient(135deg, #ffffff, var(--loader-bg) 58%, #eef6ff);
          }
        }

        .premium-loader--visible {
          opacity: 1;
          transform: scale(1);
        }

        .premium-loader__glow {
          position: absolute;
          width: 220px;
          aspect-ratio: 1;
          border-radius: 999px;
          background: var(--loader-glow);
          filter: blur(42px);
          opacity: 0.75;
          pointer-events: none;
        }

        .premium-loader__stage {
          position: relative;
          width: clamp(96px, 24vw, 154px);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
        }

        .premium-loader__ring {
          position: absolute;
          inset: -8px;
          border-radius: 999px;
          background:
            conic-gradient(from 90deg, #38bdf8, #2563eb 28%, transparent 46%, transparent 62%, #f59e0b 82%, #38bdf8),
            linear-gradient(var(--loader-frame), var(--loader-frame));
          mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
          animation: premium-loader-spin 1.55s linear infinite;
        }

        .premium-loader__media {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 999px;
          border: 1px solid var(--loader-frame);
          background: rgba(15, 23, 42, 0.48);
          box-shadow:
            0 22px 70px rgba(0, 0, 0, 0.34),
            inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .premium-loader__image {
          object-fit: cover;
          opacity: 0;
          transform: scale(1.08);
          transition: opacity 120ms ease, transform 180ms ease;
        }

        .premium-loader__image--active {
          opacity: 1;
          transform: scale(1);
        }

        .premium-loader__media--single .premium-loader__image--active {
          animation: premium-loader-single-image 2.4s ease-in-out infinite;
        }

        .premium-loader__living-pattern {
          position: absolute;
          inset: -35%;
          background:
            radial-gradient(circle at 25% 30%, rgba(56, 189, 248, 0.28), transparent 18%),
            radial-gradient(circle at 70% 64%, rgba(245, 158, 11, 0.24), transparent 20%),
            conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.14), transparent 28%);
          mix-blend-mode: screen;
          opacity: 0.42;
          animation: premium-loader-pattern 3.2s linear infinite;
          pointer-events: none;
        }

        .premium-loader__shine {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent 34%, rgba(255, 255, 255, 0.08));
          mix-blend-mode: screen;
          pointer-events: none;
        }

        .premium-loader__text {
          position: relative;
          z-index: 1;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0;
          color: var(--loader-muted);
        }

        .premium-loader__dots {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 6px;
          align-items: center;
          justify-content: center;
        }

        .premium-loader__dots span {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: var(--loader-muted);
          opacity: 0.45;
          transition: width 220ms ease, opacity 220ms ease, background 220ms ease;
        }

        .premium-loader__dots .premium-loader__dot--active {
          width: 18px;
          opacity: 1;
          background: #38bdf8;
        }

        .premium-loader__line {
          position: relative;
          z-index: 1;
          width: min(180px, 52vw);
          height: 3px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.22);
        }

        .premium-loader__line::after {
          content: '';
          position: absolute;
          inset: 0;
          width: 42%;
          border-radius: inherit;
          background: linear-gradient(90deg, #38bdf8, #2563eb, #f59e0b);
          animation: premium-loader-line 1.25s ease-in-out infinite;
        }

        .premium-loader--minimal-fade .premium-loader__stage {
          width: clamp(84px, 20vw, 124px);
        }

        .premium-loader--minimal-fade .premium-loader__media {
          animation: premium-loader-pulse 1.6s ease-in-out infinite;
        }

        @keyframes premium-loader-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes premium-loader-line {
          0% {
            transform: translateX(-110%);
          }
          50% {
            transform: translateX(78%);
          }
          100% {
            transform: translateX(240%);
          }
        }

        @keyframes premium-loader-pattern {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes premium-loader-single-image {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.055);
          }
        }

        @keyframes premium-loader-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.82;
          }
          50% {
            transform: scale(0.96);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .premium-loader {
            gap: 13px;
          }

          .premium-loader__stage {
            width: clamp(92px, 30vw, 118px);
          }

          .premium-loader__ring {
            inset: -7px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .premium-loader,
          .premium-loader__image,
          .premium-loader__dots span {
            transition: none;
          }

          .premium-loader__ring,
          .premium-loader__line::after,
          .premium-loader__living-pattern,
          .premium-loader__media--single .premium-loader__image--active,
          .premium-loader--minimal-fade .premium-loader__media {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
