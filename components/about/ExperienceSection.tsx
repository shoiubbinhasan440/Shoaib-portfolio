import Image from 'next/image';
import Link from 'next/link';
import {
  getExperienceDateRange,
  getExperienceDurationText,
  type AboutExperienceConfig,
  type ExperienceItem,
} from '@/lib/about-content';

type ExperienceSectionProps = {
  config: AboutExperienceConfig;
  dark: boolean;
  isMobile: boolean;
  items: ExperienceItem[];
  mode: 'homepage' | 'about';
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

export default function ExperienceSection({
  config,
  dark,
  isMobile,
  items,
  mode,
}: ExperienceSectionProps) {
  if (items.length === 0) {
    return null;
  }

  const text = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? 'rgba(226,232,240,0.68)' : '#475569';
  const border = dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.09)';
  const surface = dark
    ? 'linear-gradient(150deg, rgba(15,23,42,0.68), rgba(2,6,23,0.88))'
    : 'linear-gradient(150deg, rgba(255,255,255,0.96), rgba(239,246,255,0.84))';
  const compact = mode === 'homepage' || config.layoutStyle === 'compact-list';

  return (
    <section
      style={{
        padding:
          mode === 'homepage'
            ? isMobile
              ? '0 16px 58px'
              : '0 40px 78px'
            : isMobile
              ? '0 16px 70px'
              : '0 40px 96px',
        background:
          mode === 'homepage'
            ? dark
              ? '#080808'
              : '#f8fbff'
            : undefined,
      }}
    >
      <div style={{ maxWidth: mode === 'homepage' ? 1180 : 1120, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            gap: 18,
            flexDirection: isMobile ? 'column' : 'row',
            marginBottom: isMobile ? 18 : 26,
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <div
              style={{
                color: '#38bdf8',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Experience
            </div>
            <h2
              style={{
                color: text,
                fontSize: isMobile ? 28 : mode === 'homepage' ? 38 : 46,
                lineHeight: 1.04,
                letterSpacing: '-0.05em',
                margin: '0 0 10px',
                fontWeight: 900,
              }}
            >
              {config.title}
            </h2>
            {config.subtitle ? (
              <p style={{ color: muted, lineHeight: 1.7, margin: 0, fontSize: 14 }}>
                {config.subtitle}
              </p>
            ) : null}
          </div>
          {mode === 'homepage' ? (
            <Link
              href="/about"
              style={{
                color: '#38bdf8',
                textDecoration: 'none',
                fontWeight: 850,
                fontSize: 13,
                border: `1px solid ${dark ? 'rgba(56,189,248,0.24)' : 'rgba(37,99,235,0.18)'}`,
                borderRadius: 999,
                padding: '10px 14px',
                background: dark ? 'rgba(14,165,233,0.08)' : 'rgba(219,234,254,0.72)',
              }}
            >
              {config.viewAllLabel} →
            </Link>
          ) : null}
        </div>

        <div
          style={{
            display:
              config.layoutStyle === 'card-grid' && mode !== 'homepage'
                ? 'grid'
                : 'flex',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
            flexDirection: 'column',
            gap: compact ? 12 : 16,
          }}
        >
          {items.map((item, index) => {
            const duration = getExperienceDurationText(item);
            const dateRange = getExperienceDateRange(item);

            return (
              <article
                key={item.id}
                style={{
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '64px minmax(0, 1fr)',
                  gap: isMobile ? 14 : 18,
                  padding: isMobile ? 16 : compact ? 18 : 22,
                  borderRadius: 24,
                  border: `1px solid ${border}`,
                  background: surface,
                  boxShadow: dark
                    ? '0 22px 62px rgba(0,0,0,0.24)'
                    : '0 20px 52px rgba(15,23,42,0.07)',
                }}
              >
                {!isMobile && config.layoutStyle === 'timeline' ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: 31,
                      top: index === 0 ? 22 : 0,
                      bottom: index === items.length - 1 ? 'auto' : -16,
                      height: index === items.length - 1 ? 0 : 'calc(100% + 16px)',
                      width: 1,
                      background: dark ? 'rgba(56,189,248,0.18)' : 'rgba(37,99,235,0.16)',
                    }}
                  />
                ) : null}
                <div
                  style={{
                    position: 'relative',
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    overflow: 'hidden',
                    display: 'grid',
                    placeItems: 'center',
                    background: dark ? '#020617' : '#e2e8f0',
                    border: `1px solid ${border}`,
                    color: '#38bdf8',
                    fontWeight: 900,
                    zIndex: 1,
                  }}
                >
                  {item.logoUrl ? (
                    <Image
                      src={item.logoUrl}
                      alt={`${item.organizationName} logo`}
                      fill
                      sizes="58px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    getInitials(item.organizationName || item.roleTitle)
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexDirection: isMobile ? 'column' : 'row',
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          color: text,
                          fontSize: isMobile ? 17 : 19,
                          lineHeight: 1.25,
                          margin: '0 0 5px',
                          fontWeight: 900,
                        }}
                      >
                        {item.roleTitle}
                      </h3>
                      <div style={{ color: text, fontSize: 14, fontWeight: 750 }}>
                        {item.websiteUrl ? (
                          <a
                            href={item.websiteUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {item.organizationName}
                          </a>
                        ) : (
                          item.organizationName
                        )}
                        {item.employmentType ? (
                          <span style={{ color: muted, fontWeight: 600 }}>
                            {' '}
                            · {item.employmentType}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div
                      style={{
                        color: muted,
                        fontSize: 12,
                        lineHeight: 1.55,
                        textAlign: isMobile ? 'left' : 'right',
                        whiteSpace: isMobile ? 'normal' : 'nowrap',
                      }}
                    >
                      <div>{dateRange}</div>
                      {duration ? <div>{duration}</div> : null}
                    </div>
                  </div>

                  {(item.location || item.locationType) ? (
                    <div style={{ color: muted, fontSize: 12, marginBottom: 10 }}>
                      {[item.location, item.locationType].filter(Boolean).join(' · ')}
                    </div>
                  ) : null}

                  {item.description ? (
                    <p style={{ color: muted, fontSize: 13, lineHeight: 1.75, margin: '0 0 12px' }}>
                      {item.description}
                    </p>
                  ) : null}

                  {item.achievements.length > 0 && !compact ? (
                    <ul style={{ margin: '0 0 14px', paddingLeft: 18, color: muted, fontSize: 13, lineHeight: 1.7 }}>
                      {item.achievements.map(point => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : null}

                  {item.skills.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {item.skills.slice(0, compact ? 4 : 8).map(skill => (
                        <span
                          key={skill}
                          style={{
                            padding: '6px 9px',
                            borderRadius: 999,
                            background: dark ? 'rgba(14,165,233,0.1)' : 'rgba(219,234,254,0.78)',
                            color: dark ? '#7dd3fc' : '#2563eb',
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
