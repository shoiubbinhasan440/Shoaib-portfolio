'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: '#020617',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 560,
          border: '1px solid rgba(148,163,184,0.18)',
          borderRadius: 24,
          padding: 28,
          background: 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.98))',
          textAlign: 'center',
        }}
      >
        <div style={{ color: '#38bdf8', fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
          Something went wrong
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: 30 }}>The page could not continue safely.</h1>
        <p style={{ margin: '0 0 20px', color: '#94a3b8', lineHeight: 1.7 }}>
          Please retry. The error details are hidden to keep the site safe in production.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: 'none',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 800,
            padding: '12px 18px',
          }}
        >
          Try again
        </button>
      </section>
    </main>
  );
}
