import { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCcw } from 'lucide-react';
import { apiFetch } from '../api';

type Framework = { framework: string; total_questions: number; domains: number; total_responses: number; approved: number; avg_confidence: number | null; answer_bank_pct: number };
type Question = { id: number; framework: string; question_code: string; domain: string; question_text: string; expected_artifact: string };
type DomainCov = { framework: string; domain: string; questions: number; answered_approved: number; in_progress: number; coverage_pct: number };
type Response = { id: number; question_id: number; framework: string; question_code: string; domain: string; question_text: string; response: string; status: string; confidence: number | null; reviewer: string | null; company_name: string | null; evidence_link: string | null };

const statusColor: Record<string, string> = { approved: 'text-green-400', in_review: 'text-amber-400', draft: 'text-gray-400' };

export default function SecurityQuestionnairePage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [domainCoverage, setDomainCoverage] = useState<DomainCov[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [activeFramework, setActiveFramework] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [fw, dc, q, r] = await Promise.all([
        apiFetch('/deep-security-questionnaires/frameworks'),
        apiFetch('/deep-security-questionnaires/domain-coverage'),
        apiFetch('/deep-security-questionnaires/questions'),
        apiFetch('/deep-security-questionnaires/responses')
      ]);
      setFrameworks(fw); setDomainCoverage(dc); setQuestions(q); setResponses(r);
      if (!activeFramework && fw.length) setActiveFramework(fw[0].framework);
    } catch (e: any) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); }, []);

  const filteredQuestions = activeFramework ? questions.filter(q => q.framework === activeFramework) : questions;
  const filteredDomains = activeFramework ? domainCoverage.filter(d => d.framework === activeFramework) : domainCoverage;
  const filteredResponses = activeFramework ? responses.filter(r => r.framework === activeFramework) : responses;
  const responsesByQuestion = new Map(responses.map(r => [r.question_id, r] as const));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Security Questionnaire Bank</h1>
            <p className="text-gray-400 text-sm">SIG / CAIQ / VSAQ answer-reuse store. Cut questionnaire turnaround from weeks to hours.</p>
          </div>
        </div>
        <button onClick={loadAll} disabled={loading} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {/* Framework tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {frameworks.map(f => (
          <button key={f.framework} onClick={() => setActiveFramework(f.framework)} className={`bg-gray-900 border ${activeFramework === f.framework ? 'border-cyan-500' : 'border-gray-800'} rounded-xl p-4 text-left transition`}>
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-white">{f.framework}</div>
              <div className={`text-sm font-bold ${f.answer_bank_pct >= 80 ? 'text-green-400' : f.answer_bank_pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{f.answer_bank_pct}%</div>
            </div>
            <div className="text-xs text-gray-400 mt-1">{f.total_questions} questions · {f.domains} domains</div>
            <div className="text-xs text-gray-500 mt-1">{f.approved} approved / {f.total_responses} total · avg confidence {f.avg_confidence ?? '—'}</div>
            <div className="mt-2 h-1.5 bg-gray-800 rounded overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${f.answer_bank_pct}%` }} />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">{activeFramework || 'All'} domain coverage</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredDomains.map(d => (
              <div key={`${d.framework}-${d.domain}`} className="bg-gray-800/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-white truncate">{d.domain}</div>
                  <div className={`text-xs font-bold ${d.coverage_pct >= 80 ? 'text-green-400' : d.coverage_pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{d.coverage_pct}%</div>
                </div>
                <div className="text-xs text-gray-500">{d.answered_approved} / {d.questions} approved · {d.in_progress} in progress</div>
                <div className="mt-1 h-1 bg-gray-900 rounded overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${d.coverage_pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">{activeFramework || 'All'} questions ({filteredQuestions.length})</h2>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                  <th className="py-2 pr-2">Code</th>
                  <th className="py-2 pr-2">Question</th>
                  <th className="py-2 pr-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map(q => {
                  const r = responsesByQuestion.get(q.id);
                  return (
                    <tr key={q.id} className="border-b border-gray-800/60 align-top">
                      <td className="py-2 pr-2 text-cyan-300 text-xs font-mono">{q.question_code}</td>
                      <td className="py-2 pr-2">
                        <div className="text-gray-200">{q.question_text}</div>
                        <div className="text-xs text-gray-500">{q.domain} · {q.expected_artifact}</div>
                      </td>
                      <td className={`py-2 pr-2 text-xs font-bold ${r ? statusColor[r.status] || 'text-gray-400' : 'text-gray-600'}`}>
                        {r ? r.status : 'no answer'}
                        {r?.confidence && <span className="block text-xs text-gray-500">{r.confidence}% conf</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">{activeFramework || 'All'} approved answers ({filteredResponses.length})</h2>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {filteredResponses.map(r => (
            <div key={r.id} className="bg-gray-800/40 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-cyan-300 font-mono">{r.framework} · {r.question_code} · {r.domain}</div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${statusColor[r.status] || 'text-gray-400'}`}>{r.status}</span>
                  {r.confidence && <span className="text-xs text-gray-400">{r.confidence}%</span>}
                </div>
              </div>
              <div className="text-sm text-gray-200 mb-1">{r.question_text}</div>
              <div className="text-sm text-gray-100 bg-gray-900/60 rounded p-2 mb-1">{r.response}</div>
              <div className="text-xs text-gray-500">
                {r.reviewer && <span>Reviewer: {r.reviewer}</span>}
                {r.company_name && <span className="ml-3">For: {r.company_name}</span>}
                {r.evidence_link && <a href={r.evidence_link} className="ml-3 text-blue-400 hover:underline">Evidence</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
