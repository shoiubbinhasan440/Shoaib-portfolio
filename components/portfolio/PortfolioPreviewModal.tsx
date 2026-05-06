'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getPortfolioItemMeta,
  type PortfolioItemMetaConfigMap,
  type PortfolioPreviewItem,
} from '@/lib/portfolio-content';

type PortfolioPreviewModalProps = {
  dark: boolean;
  footerAction?: {
    href: string;
    label: string;
  };
  item: PortfolioPreviewItem | null;
  itemMetaConfig?: PortfolioItemMetaConfigMap;
  items: PortfolioPreviewItem[];
  onClose: () => void;
  onSelect: (item: PortfolioPreviewItem) => void;
};

type ActivePortfolioPreviewModalProps = Omit<PortfolioPreviewModalProps, 'item'> & {
  item: PortfolioPreviewItem;
};

function getItemKey(item: Pick<PortfolioPreviewItem, 'sourceType' | 'id'>) {
  return `${item.sourceType}:${item.id}`;
}

function gcd(left: number, right: number): number {
  return right === 0 ? left : gcd(right, left % right);
}

function toRatioLabel(width: number, height: number) {
  if (!width || !height) {
    return '';
  }

  const divisor = gcd(width, height);
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

function toCssAspectRatio(value: string) {
  if (!value) {
    return undefined;
  }

  return value.includes(':') ? value.replace(':', ' / ') : value;
}

function normalizeEmbedUrl(url: string) {
  if (!url) {
    return '';
  }

  if (url.includes('youtube.com/watch?v=')) {
    const videoId = new URL(url).searchParams.get('v');
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
  }

  if (url.includes('youtu.be/')) {
    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (match?.[1]) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}`;
    }
  }

  return url;
}

function withAutoplay(url: string) {
  if (!url) {
    return '';
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}autoplay=1&rel=0`;
}

function isExternalUrl(url: string) {
  return /^https?:\/\//.test(url);
}

export default function PortfolioPreviewModal(props: PortfolioPreviewModalProps) {
  if (!props.item) {
    return null;
  }

  return (
    <ActivePortfolioPreviewModal
      key={getItemKey(props.item)}
      {...props}
      item={props.item}
    />
  );
}

function ActivePortfolioPreviewModal({
  dark,
  footerAction,
  item,
  itemMetaConfig = {},
  items,
  onClose,
  onSelect,
}: ActivePortfolioPreviewModalProps) {
  const previewSurfaceRef = useRef<HTMLDivElement>(null);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ height: 0, width: 0 });
  const [viewportWidth, setViewportWidth] = useState(1280);

  const activeItem = item;
  const activeMeta = useMemo(
    () => (activeItem ? getPortfolioItemMeta(activeItem, itemMetaConfig) : null),
    [activeItem, itemMetaConfig]
  );

  const currentIndex = activeItem
    ? items.findIndex(candidate => getItemKey(candidate) === getItemKey(activeItem))
    : -1;

  const previewTitle = activeMeta?.previewTitle || activeItem?.title || '';
  const previewSubtitle =
    activeMeta?.previewSubtitle ||
    [activeMeta?.typeLabel, activeItem?.categoryName].filter(Boolean).join(' • ');
  const previewDescription =
    activeMeta?.previewDescription || activeItem?.description || '';
  const tagList: string[] = activeMeta?.showTags ? activeMeta.tags : [];
  const storyRows = activeMeta?.story
    ? ([
        ['Challenge', activeMeta.story.challenge],
        ['Solution', activeMeta.story.solution],
        ['Tools', activeMeta.story.tools],
        ['Result', activeMeta.story.result],
      ] as const).filter(([, value]) => Boolean(value?.trim()))
    : [];

  const previewVideoUrl = activeItem
    ? withAutoplay(
        normalizeEmbedUrl(activeMeta?.externalPreviewUrl || activeItem.youtube_url || '')
      )
    : '';
  const ratioLabel =
    activeMeta?.aspectRatio || toRatioLabel(naturalSize.width, naturalSize.height);
  const graphicAspectRatio =
    activeItem.sourceType === 'graphic'
      ? naturalSize.width && naturalSize.height
        ? `${naturalSize.width} / ${naturalSize.height}`
        : toCssAspectRatio(activeMeta?.aspectRatio || '')
      : undefined;
  const sizeLabel =
    naturalSize.width && naturalSize.height
      ? `${naturalSize.width} x ${naturalSize.height}`
      : '';
  const ambientBackground = activeItem?.imageUrl
    ? `radial-gradient(circle at 20% 18%, rgba(56,189,248,0.18), transparent 28%), radial-gradient(circle at 78% 20%, rgba(37,99,235,0.22), transparent 26%), linear-gradient(135deg, rgba(2,6,23,0.88), rgba(15,23,42,0.96)), url(${activeItem.imageUrl}) center/cover no-repeat`
    : 'linear-gradient(135deg, rgba(2,6,23,0.94), rgba(15,23,42,0.96))';

  useEffect(() => {
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (!items.length) {
        return;
      }

      if (event.key === 'ArrowRight' && currentIndex >= 0) {
        event.preventDefault();
        onSelect(items[(currentIndex + 1) % items.length]);
      }

      if (event.key === 'ArrowLeft' && currentIndex >= 0) {
        event.preventDefault();
        onSelect(items[(currentIndex - 1 + items.length) % items.length]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, items, onClose, onSelect]);

  function stepTo(direction: 'prev' | 'next') {
    if (!items.length || currentIndex < 0) {
      return;
    }

    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % items.length
        : (currentIndex - 1 + items.length) % items.length;
    onSelect(items[nextIndex]);
  }

  function updateZoom(nextZoom: number) {
    const clamped = Math.max(1, Math.min(4, Number(nextZoom.toFixed(2))));
    setZoom(clamped);

    if (clamped === 1) {
      setOffset({ x: 0, y: 0 });
    }
  }

  async function openFullscreen() {
    try {
      await previewSurfaceRef.current?.requestFullscreen?.();
    } catch {
      // Ignore browser fullscreen failures.
    }
  }

  function startDrag(clientX: number, clientY: number) {
    if (zoom <= 1 || activeItem?.sourceType !== 'graphic') {
      return;
    }

    dragOriginRef.current = {
      x: clientX - offset.x,
      y: clientY - offset.y,
    };
    setDragging(true);
  }

  function moveDrag(clientX: number, clientY: number) {
    if (!dragging || zoom <= 1 || activeItem?.sourceType !== 'graphic') {
      return;
    }

    setOffset({
      x: clientX - dragOriginRef.current.x,
      y: clientY - dragOriginRef.current.y,
    });
  }

  function stopDrag() {
    setDragging(false);
  }

  if (!activeMeta) {
    return null;
  }

  const text = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? '#94a3b8' : '#64748b';
  const soft = dark ? 'rgba(148,163,184,0.14)' : 'rgba(148,163,184,0.18)';
  const surface = dark
    ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,1))'
    : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.98))';
  const stackedLayout = viewportWidth < 1040;
  const compactChrome = viewportWidth < 700;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'rgba(2,6,23,0.84)',
        backdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compactChrome ? '10px' : '16px',
      }}
    >
      <div
        onClick={event => event.stopPropagation()}
        style={{
          width: 'min(1280px, 100%)',
          maxHeight: compactChrome ? 'calc(100vh - 20px)' : 'calc(100vh - 32px)',
          overflow: 'hidden',
          borderRadius: compactChrome ? 24 : 30,
          border: `1px solid ${soft}`,
          background: surface,
          boxShadow: dark
            ? '0 36px 100px rgba(0,0,0,0.52)'
            : '0 36px 100px rgba(15,23,42,0.18)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            padding: compactChrome ? '16px' : '18px 20px',
            borderBottom: `1px solid ${soft}`,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'rgba(37,99,235,0.12)',
                  color: '#38bdf8',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {activeItem.sourceType === 'video' ? 'Video Preview' : 'Graphic Preview'}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: dark ? 'rgba(15,23,42,0.58)' : 'rgba(226,232,240,0.9)',
                  color: text,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {activeMeta.typeLabel}
              </span>
              {activeMeta.cardBadge ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: dark ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.1)',
                    color: '#38bdf8',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {activeMeta.cardBadge}
                </span>
              ) : null}
            </div>
            <div
              style={{
                fontSize: compactChrome ? 20 : 24,
                fontWeight: 900,
                color: text,
                letterSpacing: '-0.04em',
              }}
            >
              {previewTitle}
            </div>
            {previewSubtitle ? (
              <div style={{ marginTop: 6, color: muted, fontSize: 14 }}>
                {previewSubtitle}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {items.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => stepTo('prev')}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    border: `1px solid ${soft}`,
                    background: dark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.84)',
                    color: text,
                    cursor: 'pointer',
                    fontWeight: 800,
                  }}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => stepTo('next')}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    border: `1px solid ${soft}`,
                    background: dark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.84)',
                    color: text,
                    cursor: 'pointer',
                    fontWeight: 800,
                  }}
                >
                  →
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                border: `1px solid ${soft}`,
                background: dark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.84)',
                color: text,
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div
          style={{
            padding: compactChrome ? '14px' : '18px',
            overflow: 'auto',
            display: 'grid',
            gridTemplateColumns: stackedLayout
              ? 'minmax(0, 1fr)'
              : activeItem.sourceType === 'graphic'
                ? 'minmax(0, 1.45fr) minmax(300px, 0.9fr)'
                : 'minmax(0, 1.3fr) minmax(300px, 0.95fr)',
            gap: 18,
          }}
        >
          <div
            ref={previewSurfaceRef}
            style={{
              position: 'relative',
              minHeight:
                activeItem.sourceType === 'video'
                  ? compactChrome
                    ? 220
                    : 360
                  : compactChrome
                    ? 360
                    : 520,
              borderRadius: 24,
              overflow: 'hidden',
              border: `1px solid ${soft}`,
              background: ambientBackground,
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'stretch',
              minWidth: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backdropFilter: 'blur(22px)',
                opacity: 0.28,
              }}
            />

            {activeItem.sourceType === 'video' ? (
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  alignSelf: 'center',
                  padding: compactChrome ? '14px' : '18px',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                    borderRadius: 22,
                    overflow: 'hidden',
                    border: `1px solid ${soft}`,
                    boxShadow: dark
                      ? '0 30px 60px rgba(2,6,23,0.3)'
                      : '0 24px 50px rgba(15,23,42,0.12)',
                  }}
                >
                  <iframe
                    title={`${activeItem.title} portfolio video preview`}
                    src={previewVideoUrl}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div
                onPointerDown={event => startDrag(event.clientX, event.clientY)}
                onPointerMove={event => moveDrag(event.clientX, event.clientY)}
                onPointerUp={stopDrag}
                onPointerLeave={stopDrag}
                onPointerCancel={stopDrag}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  minHeight: compactChrome ? 360 : 520,
                  display: 'grid',
                  gridTemplateRows: 'auto 1fr',
                  touchAction: zoom > 1 ? 'none' : 'pan-y',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 16px 0',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ratioLabel ? (
                      <span
                        style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          background: dark ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.84)',
                          border: `1px solid ${soft}`,
                          color: text,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Ratio {ratioLabel}
                      </span>
                    ) : null}
                    {sizeLabel ? (
                      <span
                        style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          background: dark ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.84)',
                          border: `1px solid ${soft}`,
                          color: muted,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {sizeLabel}
                      </span>
                    ) : null}
                    {activeMeta.formatLabel ? (
                      <span
                        style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          background: 'rgba(14,165,233,0.1)',
                          border: `1px solid ${soft}`,
                          color: '#38bdf8',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {activeMeta.formatLabel}
                      </span>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => updateZoom(1)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: `1px solid ${soft}`,
                        background: dark ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.84)',
                        color: text,
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      Fit
                    </button>
                    <button
                      type="button"
                      onClick={() => updateZoom(zoom - 0.25)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: `1px solid ${soft}`,
                        background: dark ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.84)',
                        color: text,
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => updateZoom(zoom + 0.25)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: `1px solid ${soft}`,
                        background: dark ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.84)',
                        color: text,
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOffset({ x: 0, y: 0 });
                        updateZoom(1);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: `1px solid ${soft}`,
                        background: dark ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.84)',
                        color: text,
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => void openFullscreen()}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: `1px solid ${soft}`,
                        background: dark ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.84)',
                        color: text,
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      Fullscreen
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    padding: compactChrome ? '12px' : '16px',
                    minHeight: compactChrome ? 280 : 420,
                  }}
                >
                  <img
                    src={activeItem.imageUrl}
                    alt={previewTitle}
                    onLoad={event => {
                      setNaturalSize({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                      });
                    }}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '72vh',
                      width: 'auto',
                      height: 'auto',
                      aspectRatio: graphicAspectRatio,
                      objectFit: 'contain',
                      borderRadius: 18,
                      boxShadow: dark
                        ? '0 28px 60px rgba(2,6,23,0.32)'
                        : '0 20px 44px rgba(15,23,42,0.14)',
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                      transformOrigin: 'center center',
                      transition: dragging ? 'none' : 'transform 140ms ease',
                      cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
                      userSelect: 'none',
                    }}
                    draggable={false}
                  />
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gap: 16,
              alignSelf: 'start',
              minWidth: 0,
            }}
          >
            <div
              style={{
                borderRadius: 24,
                border: `1px solid ${soft}`,
                background: dark ? 'rgba(15,23,42,0.42)' : 'rgba(255,255,255,0.82)',
                padding: '18px',
                display: 'grid',
                gap: 16,
              }}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ color: muted, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Preview Details
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      background: dark ? 'rgba(2,6,23,0.7)' : 'rgba(226,232,240,0.8)',
                      color: text,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {activeItem.categoryName}
                  </span>
                  {activeMeta.formatLabel ? (
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        background: dark ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.1)',
                        color: '#38bdf8',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {activeMeta.formatLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              {previewDescription ? (
                <p
                  style={{
                    margin: 0,
                    color: muted,
                    fontSize: 14,
                    lineHeight: 1.8,
                  }}
                >
                  {previewDescription}
                </p>
              ) : null}

              {tagList.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tagList.map(tag => (
                    <span
                      key={tag}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 999,
                        border: `1px solid ${soft}`,
                        background: dark ? 'rgba(2,6,23,0.68)' : 'rgba(248,250,252,0.94)',
                        color: text,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {storyRows.length > 0 ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ color: muted, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Story View
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {storyRows.map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          borderRadius: 18,
                          border: `1px solid ${soft}`,
                          background: dark ? 'rgba(2,6,23,0.62)' : 'rgba(248,250,252,0.94)',
                          padding: '14px 14px 12px',
                        }}
                      >
                        <div
                          style={{
                            color: '#38bdf8',
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            marginBottom: 6,
                          }}
                        >
                          {label}
                        </div>
                        <div style={{ color: text, fontSize: 14, lineHeight: 1.7 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {(activeMeta.previewCtaLabel && activeMeta.previewCtaLink) || footerAction ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {activeMeta.previewCtaLabel && activeMeta.previewCtaLink ? (
                    <a
                      href={activeMeta.previewCtaLink}
                      target={isExternalUrl(activeMeta.previewCtaLink) ? '_blank' : undefined}
                      rel={isExternalUrl(activeMeta.previewCtaLink) ? 'noopener noreferrer' : undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '12px 18px',
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                        color: '#fff',
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      {activeMeta.previewCtaLabel}
                      <span>→</span>
                    </a>
                  ) : null}
                  {footerAction ? (
                    <a
                      href={footerAction.href}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '12px 18px',
                        borderRadius: 14,
                        border: `1px solid ${soft}`,
                        background: dark ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.86)',
                        color: text,
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {footerAction.label}
                      <span>↗</span>
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
