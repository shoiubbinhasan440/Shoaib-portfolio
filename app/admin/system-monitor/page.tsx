'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import {
  AdminActionButton,
  AdminChip,
  AdminNotice,
  AdminPanel,
  useAdminThemeTokens,
} from '@/components/admin/admin-ui';

type IssueSeverity = 'critical' | 'warning' | 'info' | 'pass';

type HealthIssue = {
  area: string;
  detail: string;
  fixHint: string;
  id: string;
  severity: IssueSeverity;
  title: string;
};

type HealthReport = {
  buckets: Record<string, { detail: string; ok: boolean }>;
  counts: Record<IssueSeverity, number>;
  env: Record<string, unknown>;
  generatedAt: string;
  issues: HealthIssue[];
  routes: Record<string, string>;
  tables: Record<string, { detail: string; ok: boolean }>;
};

const SEVERITY_LABELS: Record<IssueSeverity | 'all', string> = {
  all: 'All',
  critical: 'Critical',
  info: 'Info',
  pass: 'Passed',
  warning: 'Warnings',
};

const SEVERITY_ORDER: IssueSeverity[] = ['critical', 'warning', 'info', 'pass'];

function formatReportForCodex(report: HealthReport) {
  const visibleIssues = report.issues
    .filter(issue => issue.severity !== 'pass')
    .map(issue => {
      return [
        `- [${issue.severity.toUpperCase()}] ${issue.area}: ${issue.title}`,
        `  Detail: ${issue.detail}`,
        `  Fix hint: ${issue.fixHint}`,
      ].join('\n');
    });

  return [
    'Production monitor report from Admin Panel',
    `Generated at: ${report.generatedAt}`,
    `Summary: ${report.counts.critical} critical, ${report.counts.warning} warnings, ${report.counts.info} info, ${report.counts.pass} passed`,
    '',
    'Issues to fix:',
    visibleIssues.length > 0 ? visibleIssues.join('\n') : 'No active critical/warning/info issues reported.',
    '',
    'Protected routes:',
    JSON.stringify(report.routes, null, 2),
    '',
    'Full safe report JSON:',
    JSON.stringify(report, null, 2),
  ].join('\n');
}

function getSeverityTone(severity: IssueSeverity): 'accent' | 'success' | 'danger' | 'neutral' {
  if (severity === 'critical') {
    return 'danger';
  }

  if (severity === 'pass') {
    return 'success';
  }

  if (severity === 'warning') {
    return 'accent';
  }

  return 'neutral';
}

export default function AdminSystemMonitorPage() {
  const tokens = useAdminThemeTokens();
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState<IssueSeverity | 'all'>('all');

  const loadReport = useCallback(async () => {
    setLoading(true);
    setNotice('');

    try {
      const response = await fetch('/api/admin/health', {
        cache: 'no-store',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'System health check failed.');
      }

      setReport(payload as HealthReport);
    } catch (error) {
      setNotice(
        `ERROR: ${error instanceof Error ? error.message : 'Unable to load system monitor.'}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadReport();
    }, 60000);

    return () => window.clearInterval(timer);
  }, [loadReport]);

  const filteredIssues = useMemo(() => {
    if (!report) {
      return [];
    }

    const issues = filter === 'all'
      ? report.issues
      : report.issues.filter(issue => issue.severity === filter);

    return [...issues].sort((left, right) => {
      return SEVERITY_ORDER.indexOf(left.severity) - SEVERITY_ORDER.indexOf(right.severity);
    });
  }, [filter, report]);

  async function handleCopyReport() {
    if (!report) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formatReportForCodex(report));
      setNotice('OK: Report copied. Paste it to Codex when you want fixes.');
    } catch {
      setNotice('ERROR: Clipboard permission failed. Select the report text manually.');
    }
  }

  const counts = report?.counts || { critical: 0, info: 0, pass: 0, warning: 0 };

  return (
    <AdminShell
      eyebrow="System Monitor"
      title="Production issue center"
      description="Security, environment, database, storage, and SEO checks are collected here so you can copy one safe report and send it for fixes."
      actions={
        <>
          <AdminActionButton onClick={() => void loadReport()} variant="secondary" disabled={loading}>
            {loading ? 'Checking...' : 'Refresh checks'}
          </AdminActionButton>
          <AdminActionButton onClick={() => void handleCopyReport()} disabled={!report}>
            Copy report for Codex
          </AdminActionButton>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {notice ? (
          <AdminNotice
            message={
              notice.startsWith('OK:')
                ? `OK: ${notice.replace(/^OK:\s*/, '')}`
                : `ERROR: ${notice.replace(/^ERROR:\s*/, '')}`
            }
          />
        ) : null}

        <AdminPanel
          title="Live health summary"
          description="The checks auto-refresh every 60 seconds while this page is open. Secrets are never printed in the report."
          badge={report ? 'Live' : 'Loading'}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            {([
              ['critical', 'Critical'],
              ['warning', 'Warnings'],
              ['info', 'Info'],
              ['pass', 'Passed'],
            ] as Array<[IssueSeverity, string]>).map(([severity, label]) => (
              <button
                key={severity}
                type="button"
                onClick={() => setFilter(severity)}
                style={{
                  border: `1px solid ${filter === severity ? tokens.accentText : tokens.line}`,
                  borderRadius: 18,
                  background: tokens.fieldSoft,
                  color: tokens.text,
                  cursor: 'pointer',
                  padding: 16,
                  textAlign: 'left',
                  boxShadow: filter === severity ? tokens.softShadow : 'none',
                }}
              >
                <div style={{ color: tokens.muted, fontSize: 12, fontWeight: 800 }}>
                  {label}
                </div>
                <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
                  {counts[severity]}
                </div>
              </button>
            ))}
          </div>

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              justifyContent: 'space-between',
              marginTop: 16,
            }}
          >
            <div style={{ color: tokens.muted, fontSize: 13 }}>
              Last checked:{' '}
              {report?.generatedAt
                ? new Date(report.generatedAt).toLocaleString()
                : loading
                  ? 'Checking now...'
                  : 'Not available'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['all', ...SEVERITY_ORDER] as Array<IssueSeverity | 'all'>).map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  style={{
                    border: `1px solid ${filter === item ? tokens.accentText : tokens.line}`,
                    borderRadius: 999,
                    background: filter === item ? tokens.accentSoft : tokens.fieldSoft,
                    color: filter === item ? tokens.accentText : tokens.text,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '8px 11px',
                  }}
                >
                  {SEVERITY_LABELS[item]}
                </button>
              ))}
            </div>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Issues and checks"
          description="Critical and warning rows are the ones to paste back for repair. Passed rows help confirm what is already stable."
          badge={`${filteredIssues.length} shown`}
        >
          {loading && !report ? (
            <div
              style={{
                border: `1px solid ${tokens.line}`,
                borderRadius: 20,
                color: tokens.muted,
                padding: 18,
              }}
            >
              Running production checks...
            </div>
          ) : filteredIssues.length === 0 ? (
            <div
              style={{
                border: `1px solid ${tokens.line}`,
                borderRadius: 20,
                color: tokens.muted,
                padding: 18,
              }}
            >
              No issues in this filter.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {filteredIssues.map(issue => (
                <article
                  key={issue.id}
                  style={{
                    background: tokens.fieldSoft,
                    border: `1px solid ${tokens.line}`,
                    borderRadius: 20,
                    boxShadow: tokens.softShadow,
                    display: 'grid',
                    gap: 10,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: tokens.muted, fontSize: 12, fontWeight: 800 }}>
                        {issue.area}
                      </div>
                      <h3 style={{ fontSize: 18, margin: '4px 0 0' }}>{issue.title}</h3>
                    </div>
                    <AdminChip tone={getSeverityTone(issue.severity)}>
                      {issue.severity}
                    </AdminChip>
                  </div>
                  <p style={{ color: tokens.text, lineHeight: 1.65, margin: 0 }}>
                    {issue.detail}
                  </p>
                  <div
                    style={{
                      borderLeft: `3px solid ${tokens.accentText}`,
                      color: tokens.muted,
                      fontSize: 13,
                      lineHeight: 1.65,
                      paddingLeft: 12,
                    }}
                  >
                    {issue.fixHint}
                  </div>
                </article>
              ))}
            </div>
          )}
        </AdminPanel>

        {report ? (
          <AdminPanel
            title="Codex-ready report"
            description="This is the safe text version. It contains statuses and hints, not secret values."
            badge="Safe copy"
          >
            <pre
              style={{
                background: tokens.dark ? 'rgba(2,6,23,0.82)' : 'rgba(15,23,42,0.04)',
                border: `1px solid ${tokens.line}`,
                borderRadius: 18,
                color: tokens.text,
                fontSize: 12,
                lineHeight: 1.6,
                margin: 0,
                maxHeight: 360,
                overflow: 'auto',
                padding: 16,
                whiteSpace: 'pre-wrap',
              }}
            >
              {formatReportForCodex(report)}
            </pre>
          </AdminPanel>
        ) : null}
      </div>
    </AdminShell>
  );
}
