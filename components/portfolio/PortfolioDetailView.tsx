import Link from 'next/link';
import {
  getPortfolioItemDetailPath,
  type PortfolioItemMetaConfig,
  type PortfolioPreviewItem,
} from '@/lib/portfolio-content';

type PortfolioDetailViewProps = {
  item: PortfolioPreviewItem;
  meta: PortfolioItemMetaConfig;
  nextItem: PortfolioPreviewItem | null;
  previousItem: PortfolioPreviewItem | null;
  relatedItems: PortfolioPreviewItem[];
};

function normalizeEmbedUrl(url: string) {
  if (!url) {
    return '';
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.pathname.startsWith('/embed/')
        ? parsed.pathname.split('/embed/')[1]?.split('/')[0]
        : parsed.searchParams.get('v');

      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
    }

    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace('/', '').split('/')[0];
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
    }
  } catch {
    return url;
  }

  return url.replace('https://www.youtube.com/embed/', 'https://www.youtube-nocookie.com/embed/');
}

function getItemHref(item: PortfolioPreviewItem) {
  return getPortfolioItemDetailPath(item);
}

function Card({ item }: { item: PortfolioPreviewItem }) {
  return (
    <Link
      href={getItemHref(item)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
        borderRadius: 22,
        border: '1px solid rgba(148,163,184,0.18)',
        background: 'linear-gradient(180deg, rgba(15,23,42,0.84), rgba(2,6,23,0.94))',
        boxShadow: '0 14px 30px -14px rgba(0,0,0,0.5)',
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      <span
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          background: item.sourceType === 'video' ? '#0f172a' : '#020617',
        }}
      >
        <img
          src={item.imageUrl}
          alt={item.title}
          loading="lazy"
          decoding="async"
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            maxWidth: '100%',
            objectFit: item.sourceType === 'video' ? 'cover' : 'contain',
          }}
        />
        {item.sourceType === 'video' ? (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'rgba(15,23,42,0.76)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
            }}
          >
            <span
              style={{
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '13px solid #fff',
                marginLeft: 3,
              }}
            />
          </span>
        ) : null}
      </span>
      <span style={{ display: 'grid', gap: 7, padding: '14px 15px 16px', minWidth: 0 }}>
        <span
          style={{
            color: '#f8fafc',
            fontSize: 15,
            fontWeight: 800,
            lineHeight: 1.25,
            overflowWrap: 'anywhere',
          }}
        >
          {item.title}
        </span>
        <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>
          {item.categoryName}
        </span>
      </span>
    </Link>
  );
}

export default function PortfolioDetailView({
  item,
  meta,
  nextItem,
  previousItem,
  relatedItems,
}: PortfolioDetailViewProps) {
  const title = meta.previewTitle || item.title;
  const description =
    meta.projectDescription ||
    item.projectDescription ||
    meta.previewDescription ||
    item.description ||
    '';
  const tags = meta.showTags === false ? [] : meta.tags || [];
  const mediaImage = meta.coverImage || item.imageUrl;
  const storyRows = [
    ['Challenge', meta.story?.challenge],
    ['Solution', meta.story?.solution],
    ['Tools', meta.story?.tools],
    ['Result', meta.story?.result],
  ].filter(([, value]) => Boolean(value?.trim()));

  return (
    <main
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflowX: 'hidden',
        padding: '34px 14px calc(110px + env(safe-area-inset-bottom))',
        background:
          'radial-gradient(circle at 18% 6%, rgba(14,165,233,0.18), transparent 26%), linear-gradient(180deg, #020617 0%, #08111f 48%, #020617 100%)',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <article
        style={{
          width: '100%',
          maxWidth: 1180,
          minWidth: 0,
          margin: '0 auto',
          display: 'grid',
          gap: 24,
        }}
      >
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            color: '#7dd3fc',
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
            <Link href="/portfolio" style={{ color: 'inherit', textDecoration: 'none' }}>
              Portfolio
            </Link>
            <span>/</span>
            <span>{item.sourceType === 'video' ? 'Videos' : 'Graphics'}</span>
          </div>
          <Link
            href="/portfolio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 999,
              background: 'rgba(14,165,233,0.14)',
              border: '1px solid rgba(125,211,252,0.28)',
              color: '#e0f2fe',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            All Portfolio <span aria-hidden="true">→</span>
          </Link>
        </nav>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: 24,
            alignItems: 'start',
            width: '100%',
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              overflow: 'hidden',
              borderRadius: 28,
              border: '1px solid rgba(148,163,184,0.18)',
              background: item.sourceType === 'video' ? '#0f172a' : '#e2e8f0',
              boxShadow: '0 30px 90px rgba(0,0,0,0.32)',
            }}
          >
            {item.sourceType === 'video' ? (
              <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
                <iframe
                  title={`${item.title} video`}
                  src={normalizeEmbedUrl(meta.externalPreviewUrl || item.youtube_url || '')}
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
            ) : (
              <img
                src={mediaImage}
                alt={meta.altText || item.title}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '76vh',
                  objectFit: 'contain',
                }}
              />
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gap: 18,
              minWidth: 0,
              borderRadius: 28,
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'linear-gradient(180deg, rgba(15,23,42,0.72), rgba(2,6,23,0.88))',
              padding: 'clamp(18px, 4vw, 30px)',
            }}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '7px 12px', borderRadius: 999, background: 'rgba(14,165,233,0.12)', color: '#38bdf8', fontSize: 12, fontWeight: 900 }}>
                {item.categoryName}
              </span>
              <span style={{ padding: '7px 12px', borderRadius: 999, background: 'rgba(148,163,184,0.12)', color: '#e2e8f0', fontSize: 12, fontWeight: 800 }}>
                {meta.typeLabel || (item.sourceType === 'video' ? 'Video Edit' : 'Graphic Design')}
              </span>
            </div>

            <h1
              style={{
                margin: 0,
                color: '#f8fafc',
                fontSize: 'clamp(2rem, 6vw, 4.25rem)',
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: 0,
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }}
            >
              {title}
            </h1>

            {description ? (
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: 16, lineHeight: 1.85 }}>
                {description}
              </p>
            ) : null}

            {tags.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tags.map(tag => (
                  <span key={tag} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 999, padding: '7px 11px', color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            <Link
              href="/portfolio"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: 'fit-content',
                maxWidth: '100%',
                padding: '12px 18px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 900,
                boxShadow: '0 18px 40px rgba(37,99,235,0.22)',
              }}
            >
              View all portfolio <span aria-hidden="true">→</span>
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {previousItem ? (
                <Link href={getItemHref(previousItem)} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 16, padding: 14, color: '#e2e8f0', textDecoration: 'none', minWidth: 0 }}>
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 900, marginBottom: 6 }}>Previous</span>
                  <span style={{ display: 'block', overflowWrap: 'anywhere', fontWeight: 800 }}>{previousItem.title}</span>
                </Link>
              ) : null}
              {nextItem ? (
                <Link href={getItemHref(nextItem)} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 16, padding: 14, color: '#e2e8f0', textDecoration: 'none', minWidth: 0 }}>
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 900, marginBottom: 6 }}>Next</span>
                  <span style={{ display: 'block', overflowWrap: 'anywhere', fontWeight: 800 }}>{nextItem.title}</span>
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {storyRows.length > 0 ? (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
            {storyRows.map(([label, value]) => (
              <div key={label} style={{ border: '1px solid rgba(148,163,184,0.16)', borderRadius: 20, background: 'rgba(15,23,42,0.58)', padding: 18 }}>
                <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
                  {label}
                </div>
                <div style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7 }}>{value}</div>
              </div>
            ))}
          </section>
        ) : null}

        {relatedItems.length > 0 ? (
          <section style={{ display: 'grid', gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#f8fafc' }}>
              Related works
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 14 }}>
              {relatedItems.map(relatedItem => (
                <Card key={`${relatedItem.sourceType}:${relatedItem.id}`} item={relatedItem} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
