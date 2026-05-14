const BASE = '/api';

function headers() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: headers() });
  if (!res.ok) {
    let body: any = null;
    try { body = await res.json(); } catch { /* not json */ }
    const msg = body?.error || `API error: ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}

export async function apiDownload(path: string, filename: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error(`Download error: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  companies: {
    list: () => apiFetch('/companies'),
    get: (id: number) => apiFetch(`/companies/${id}`),
    create: (data: object) => apiFetch('/companies', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => apiFetch(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/companies/${id}`, { method: 'DELETE' })
  },
  contacts: {
    list: () => apiFetch('/contacts'),
    get: (id: number) => apiFetch(`/contacts/${id}`),
    create: (data: object) => apiFetch('/contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => apiFetch(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/contacts/${id}`, { method: 'DELETE' })
  },
  deals: {
    list: () => apiFetch('/deals'),
    get: (id: number) => apiFetch(`/deals/${id}`),
    create: (data: object) => apiFetch('/deals', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => apiFetch(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/deals/${id}`, { method: 'DELETE' })
  },
  activities: {
    list: () => apiFetch('/activities'),
    get: (id: number) => apiFetch(`/activities/${id}`),
    create: (data: object) => apiFetch('/activities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => apiFetch(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/activities/${id}`, { method: 'DELETE' })
  },
  team: {
    list: () => apiFetch('/team'),
    get: (id: number) => apiFetch(`/team/${id}`),
    create: (data: object) => apiFetch('/team', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => apiFetch(`/team/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/team/${id}`, { method: 'DELETE' })
  },
  notes: {
    list: () => apiFetch('/notes'),
    get: (id: number) => apiFetch(`/notes/${id}`),
    create: (data: object) => apiFetch('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: object) => apiFetch(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/notes/${id}`, { method: 'DELETE' })
  },
  ai: {
    dealScoring: (deal: object, company: object, activities: object[]) =>
      apiFetch('/ai/deal-scoring', { method: 'POST', body: JSON.stringify({ deal, company, activities }) }),
    nextAction: (deal: object, recent_activities: object[]) =>
      apiFetch('/ai/next-action', { method: 'POST', body: JSON.stringify({ deal, recent_activities }) }),
    emailDraft: (deal: object, contact: object, purpose: string) =>
      apiFetch('/ai/email-draft', { method: 'POST', body: JSON.stringify({ deal, contact, purpose }) }),
    companyResearch: (company_name: string, industry: string) =>
      apiFetch('/ai/company-research', { method: 'POST', body: JSON.stringify({ company_name, industry }) }),
    closeLikelihood: (deal: object, company: object, recent_activities: object[]) =>
      apiFetch('/ai/close-likelihood', { method: 'POST', body: JSON.stringify({ deal, company, recent_activities }) }),
    icpFit: (company: object, icp_description: string) =>
      apiFetch('/ai/icp-fit', { method: 'POST', body: JSON.stringify({ company, icp_description }) }),
    discoverySummary: (transcript: string, deal_title: string) =>
      apiFetch('/ai/discovery-summary', { method: 'POST', body: JSON.stringify({ transcript, deal_title }) }),
    stalledDeals: (threshold_days: number) =>
      apiFetch('/ai/stalled-deals', { method: 'POST', body: JSON.stringify({ threshold_days }) }),
    winLossInsights: () =>
      apiFetch('/ai/winloss-insights', { method: 'POST', body: JSON.stringify({}) })
  },
  utils: {
    exportCsv: (entity: 'deals' | 'companies' | 'contacts' | 'activities') =>
      apiDownload(`/utils/export/${entity}`, `${entity}.csv`),
    search: (params: Record<string, string | number | boolean | undefined>) => {
      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '' && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      return apiFetch(`/utils/search${qs ? '?' + qs : ''}`);
    },
    auditList: (filters?: { action?: string; entity?: string; user_email?: string; limit?: number }) => {
      const qs = filters ? Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== '' && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&') : '';
      return apiFetch(`/utils/audit${qs ? '?' + qs : ''}`);
    },
    auditWrite: (action: string, entity?: string, entity_id?: number, details?: string) =>
      apiFetch('/utils/audit', { method: 'POST', body: JSON.stringify({ action, entity, entity_id, details }) })
  },
  admin: {
    sampleData: (entity: 'companies' | 'contacts' | 'deals' | 'activities' | 'team' | 'notes') =>
      apiFetch(`/admin/sample-data/${entity}`, { method: 'POST' })
  },
  dashboard: {
    stats: () => apiFetch('/dashboard/stats')
  }
};
