'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { SERVICE_TYPE_OPTIONS } from '@/lib/crm-shared';
import type { MessageTemplate, RateTemplate } from '@/lib/crm';

type TemplateState = {
  loading: boolean;
  messageTemplates: MessageTemplate[];
  rateTemplates: RateTemplate[];
  savingKey: string;
  statusMessage: string;
};

export default function AdminTemplatesPage() {
  const [state, setState] = useState<TemplateState>({
    loading: true,
    messageTemplates: [],
    rateTemplates: [],
    savingKey: '',
    statusMessage: '',
  });

  async function loadTemplates() {
    setState(current => ({ ...current, loading: true }));
    try {
      const response = await fetch('/api/admin/templates');
      const result = response.ok
        ? ((await response.json()) as {
            messageTemplates: MessageTemplate[];
            rateTemplates: RateTemplate[];
          })
        : { messageTemplates: [], rateTemplates: [] };

      setState(current => ({
        ...current,
        loading: false,
        messageTemplates: result.messageTemplates || [],
        rateTemplates: result.rateTemplates || [],
      }));
    } catch {
      setState(current => ({ ...current, loading: false }));
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  function flash(message: string) {
    setState(current => ({ ...current, statusMessage: message }));
    window.setTimeout(() => {
      setState(current => ({ ...current, statusMessage: '' }));
    }, 2600);
  }

  async function saveMessageTemplate(template: MessageTemplate) {
    setState(current => ({ ...current, savingKey: template.key }));
    try {
      const response = await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          templateType: 'message',
        }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || 'Failed to save message template.');
      }

      flash(`Saved "${template.title}".`);
    } finally {
      setState(current => ({ ...current, savingKey: '' }));
    }
  }

  async function saveRateTemplate(template: RateTemplate) {
    setState(current => ({ ...current, savingKey: template.id }));
    try {
      const response = await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          templateType: 'rate',
        }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || 'Failed to save rate template.');
      }

      flash(`Saved "${template.title}".`);
    } finally {
      setState(current => ({ ...current, savingKey: '' }));
    }
  }

  return (
    <AdminShell
      eyebrow="Template Library"
      title="Editable templates for replies, pricing, and delivery"
      description="These templates power the inbox quick actions, WhatsApp messages, pricing replies, brief requests, and client communication flow."
    >
      {state.statusMessage ? (
        <div
          style={{
            borderRadius: 18,
            padding: '14px 16px',
            border: '1px solid rgba(34,197,94,0.2)',
            background: 'rgba(34,197,94,0.12)',
            color: '#86efac',
            fontWeight: 700,
          }}
        >
          {state.statusMessage}
        </div>
      ) : null}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 18,
        }}
      >
        <article
          style={{
            borderRadius: 28,
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(8,15,29,0.82)',
            padding: 20,
            display: 'grid',
            gap: 16,
          }}
        >
          <div>
            <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
              Message Templates
            </div>
            <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.04em' }}>WhatsApp and reply presets</h2>
          </div>

          {state.loading ? (
            <div style={{ color: '#94a3b8' }}>Loading templates...</div>
          ) : (
            state.messageTemplates.map(template => (
              <div
                key={template.key}
                style={{
                  borderRadius: 22,
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: 'rgba(15,23,42,0.72)',
                  padding: 16,
                  display: 'grid',
                  gap: 10,
                }}
              >
                <input
                  value={template.title}
                  onChange={event =>
                    setState(current => ({
                      ...current,
                      messageTemplates: current.messageTemplates.map(item =>
                        item.key === template.key
                          ? { ...item, title: event.target.value }
                          : item
                      ),
                    }))
                  }
                  style={fieldInputStyle}
                />
                <input
                  value={template.description}
                  onChange={event =>
                    setState(current => ({
                      ...current,
                      messageTemplates: current.messageTemplates.map(item =>
                        item.key === template.key
                          ? { ...item, description: event.target.value }
                          : item
                      ),
                    }))
                  }
                  style={fieldInputStyle}
                />
                <textarea
                  value={template.body}
                  onChange={event =>
                    setState(current => ({
                      ...current,
                      messageTemplates: current.messageTemplates.map(item =>
                        item.key === template.key
                          ? { ...item, body: event.target.value }
                          : item
                      ),
                    }))
                  }
                  rows={6}
                  style={fieldTextareaStyle}
                />
                <div style={{ color: '#94a3b8', fontSize: 12 }}>
                  Variables: {'{{client_name}}'}, {'{{service_type}}'}, {'{{project_title}}'}, {'{{price}}'}, {'{{deadline}}'}, {'{{brief_link}}'}, {'{{progress_percentage}}'}, {'{{project_status}}'}
                </div>
                <button
                  type="button"
                  onClick={() => void saveMessageTemplate(template)}
                  disabled={state.savingKey === template.key}
                  style={primaryButtonStyle(state.savingKey === template.key)}
                >
                  {state.savingKey === template.key ? 'Saving...' : 'Save template'}
                </button>
              </div>
            ))
          )}
        </article>

        <article
          style={{
            borderRadius: 28,
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(8,15,29,0.82)',
            padding: 20,
            display: 'grid',
            gap: 16,
          }}
        >
          <div>
            <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
              Rate Templates
            </div>
            <h2 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.04em' }}>Package and estimate templates</h2>
          </div>

          {state.loading ? (
            <div style={{ color: '#94a3b8' }}>Loading packages...</div>
          ) : (
            state.rateTemplates.map(template => (
              <div
                key={template.id}
                style={{
                  borderRadius: 22,
                  border: '1px solid rgba(148,163,184,0.14)',
                  background: 'rgba(15,23,42,0.72)',
                  padding: 16,
                  display: 'grid',
                  gap: 10,
                }}
              >
                <input
                  value={template.title}
                  onChange={event =>
                    setState(current => ({
                      ...current,
                      rateTemplates: current.rateTemplates.map(item =>
                        item.id === template.id
                          ? { ...item, title: event.target.value }
                          : item
                      ),
                    }))
                  }
                  style={fieldInputStyle}
                />
                <select
                  value={template.serviceType}
                  onChange={event =>
                    setState(current => ({
                      ...current,
                      rateTemplates: current.rateTemplates.map(item =>
                        item.id === template.id
                          ? { ...item, serviceType: event.target.value as RateTemplate['serviceType'] }
                          : item
                      ),
                    }))
                  }
                  style={fieldInputStyle}
                >
                  {SERVICE_TYPE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  value={template.priceRange}
                  onChange={event =>
                    setState(current => ({
                      ...current,
                      rateTemplates: current.rateTemplates.map(item =>
                        item.id === template.id
                          ? { ...item, priceRange: event.target.value }
                          : item
                      ),
                    }))
                  }
                  style={fieldInputStyle}
                  placeholder="Price / range"
                />
                <input
                  value={template.deliveryTime}
                  onChange={event =>
                    setState(current => ({
                      ...current,
                      rateTemplates: current.rateTemplates.map(item =>
                        item.id === template.id
                          ? { ...item, deliveryTime: event.target.value }
                          : item
                      ),
                    }))
                  }
                  style={fieldInputStyle}
                  placeholder="Delivery time"
                />
                <input
                  value={template.revisionPolicy}
                  onChange={event =>
                    setState(current => ({
                      ...current,
                      rateTemplates: current.rateTemplates.map(item =>
                        item.id === template.id
                          ? { ...item, revisionPolicy: event.target.value }
                          : item
                      ),
                    }))
                  }
                  style={fieldInputStyle}
                  placeholder="Revision policy"
                />
                <textarea
                  value={template.includedServices.join('\n')}
                  onChange={event =>
                    setState(current => ({
                      ...current,
                      rateTemplates: current.rateTemplates.map(item =>
                        item.id === template.id
                          ? {
                              ...item,
                              includedServices: event.target.value
                                .split('\n')
                                .map(line => line.trim())
                                .filter(Boolean),
                            }
                          : item
                      ),
                    }))
                  }
                  rows={4}
                  style={fieldTextareaStyle}
                  placeholder="One included service per line"
                />
                <textarea
                  value={template.messageBody}
                  onChange={event =>
                    setState(current => ({
                      ...current,
                      rateTemplates: current.rateTemplates.map(item =>
                        item.id === template.id
                          ? { ...item, messageBody: event.target.value }
                          : item
                      ),
                    }))
                  }
                  rows={6}
                  style={fieldTextareaStyle}
                  placeholder="Body used in the inbox quick reply"
                />
                <button
                  type="button"
                  onClick={() => void saveRateTemplate(template)}
                  disabled={state.savingKey === template.id}
                  style={primaryButtonStyle(state.savingKey === template.id)}
                >
                  {state.savingKey === template.id ? 'Saving...' : 'Save package'}
                </button>
              </div>
            ))
          )}
        </article>
      </section>
    </AdminShell>
  );
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 14,
  padding: '11px 12px',
  border: '1px solid rgba(148,163,184,0.16)',
  background: 'rgba(2,6,23,0.92)',
  color: '#f8fafc',
  boxSizing: 'border-box',
};

const fieldTextareaStyle: React.CSSProperties = {
  ...fieldInputStyle,
  lineHeight: 1.7,
  resize: 'vertical',
};

function primaryButtonStyle(disabled: boolean) {
  return {
    borderRadius: 14,
    padding: '11px 14px',
    border: '1px solid rgba(56,189,248,0.24)',
    background: disabled
      ? 'rgba(15,23,42,0.5)'
      : 'linear-gradient(135deg, rgba(37,99,235,0.96), rgba(14,165,233,0.88))',
    color: disabled ? '#64748b' : '#f8fafc',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
  } as const;
}
