'use strict';
// Wave 3 helpers: search/filter, CSV export, AI with deterministic fallback.
function hasProvider(env = process.env) {
  return Boolean(String(env.OPENROUTER_API_KEY || env.OPENAI_API_KEY || '').trim());
}
function filterRecords(rows, { q = '', stage = '', status = '' } = {}) {
  const needle = String(q).trim().toLowerCase();
  return (rows || []).filter((r) => {
    if (stage && String(r.stage || '') !== stage) return false;
    if (status && String(r.status || '') !== status) return false;
    if (!needle) return true;
    return [r.title, r.company_name, r.name, r.next_action, r.stage].some((v) => String(v || '').toLowerCase().includes(needle));
  });
}
function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = Array.isArray(v) ? v.join('|') : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function toCsv(rows, columns) {
  return [columns.join(','), ...(rows || []).map((r) => columns.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n';
}
function formatValue(v) {
  if (v === false) return 'false';
  if (v === 0) return '0';
  if (v === '' || v === null || v === undefined) return '(empty)';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '(empty)';
  return String(v);
}
function renderSections(sections) {
  return (sections || []).map((s) => `${s.label}: ${formatValue(s.value)}`).join('\n');
}
function fallback(feature, records) {
  const rows = records || [];
  const pipeline = rows.reduce((sum, r) => sum + Number(r.value_usd || 0), 0);
  const byFeature = {
    'deal-health': [
      { label: 'Deals reviewed', value: rows.length },
      { label: 'Pipeline value (USD)', value: pipeline },
      { label: 'Deals without next action', value: rows.filter((r) => !r.next_action).length },
      { label: 'Has stalled deals', value: rows.some((r) => !r.next_action) },
    ],
    'pipeline-risk': [
      { label: 'Deals reviewed', value: rows.length },
      { label: 'High-value deals', value: rows.filter((r) => Number(r.value_usd || 0) >= 100000).length },
      { label: 'Earliest expected close', value: rows.map((r) => r.expected_close).filter(Boolean).sort()[0] || '' },
      { label: 'Pipeline value (USD)', value: pipeline },
    ],
    'next-step-coach': [
      { label: 'Deals reviewed', value: rows.length },
      { label: 'Next actions recorded', value: rows.filter((r) => r.next_action).length },
      { label: 'Missing next action count', value: rows.filter((r) => !r.next_action).length },
      { label: 'First missing deal', value: rows.find((r) => !r.next_action)?.title || '' },
    ],
  };
  return {
    aiGenerated: false,
    source: 'deterministic-fallback',
    notice: 'No AI provider key configured (OPENROUTER_API_KEY/OPENAI_API_KEY); showing a deterministic summary of your own deals.',
    feature,
    sections: byFeature[feature] || [{ label: 'Deals reviewed', value: rows.length }],
  };
}
async function providerSummary(feature, records, env = process.env, fetchImpl = fetch) {
  if (!hasProvider(env)) return fallback(feature, records);
  const key = env.OPENROUTER_API_KEY || env.OPENAI_API_KEY;
  const base = env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
  const model = env.OPENROUTER_MODEL || env.OPENAI_MODEL || 'openai/gpt-4o-mini';
  const res = await fetchImpl(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Summarize the supplied enterprise deals as JSON sections.' }, { role: 'user', content: `Feature: ${feature}\nDeals: ${JSON.stringify(records).slice(0, 8000)}` }] }),
  });
  if (!res.ok) return { ...fallback(feature, records), providerError: `Provider returned ${res.status}` };
  const data = await res.json();
  return { aiGenerated: true, source: 'provider', model: data?.model || model, feature, sections: [{ label: 'Summary', value: data?.choices?.[0]?.message?.content || '' }] };
}
module.exports = { hasProvider, filterRecords, toCsv, formatValue, renderSections, fallback, providerSummary };
