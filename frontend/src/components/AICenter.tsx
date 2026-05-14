import { useState } from 'react';
import { Sparkles, BarChart2, Zap, Mail, Building2, Target, Crosshair, FileText, AlertTriangle, Trophy } from 'lucide-react';
import { api } from '../api';
import AIResponse from './AIResponse';

type TabId = 'scoring' | 'nextaction' | 'email' | 'research' | 'closelikelihood' | 'icpfit' | 'discovery' | 'stalled' | 'winloss';

export default function AICenter() {
  const [activeTab, setActiveTab] = useState<TabId>('scoring');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [dealTitle, setDealTitle] = useState('');
  const [dealStage, setDealStage] = useState('negotiation');
  const [dealValue, setDealValue] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [activitySummary, setActivitySummary] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [emailPurpose, setEmailPurpose] = useState('');
  const [researchCompany, setResearchCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [icpDescription, setIcpDescription] = useState('Fortune 500 buyers, $5B+ revenue, complex procurement, multi-region rollouts.');
  const [icpCompanyName, setIcpCompanyName] = useState('');
  const [transcript, setTranscript] = useState('');
  const [stallDays, setStallDays] = useState('21');

  const call = async (fn: () => Promise<{ result: string }>) => {
    setLoading(true); setResult(null);
    try { const data = await fn(); setResult(data.result || JSON.stringify(data, null, 2)); }
    catch (err: any) {
      if (err?.status === 503) setResult('AI service unavailable: ' + (err?.body?.detail || 'no API key configured'));
      else setResult('Error: ' + (err?.message || 'Could not get AI response'));
    }
    finally { setLoading(false); }
  };

  const callRaw = async (fn: () => Promise<any>) => {
    setLoading(true); setResult(null);
    try {
      const data = await fn();
      const human = data.result || '';
      const meta = data.summary ? `\n\n**Summary:** ${JSON.stringify(data.summary)}` : '';
      const list = Array.isArray(data.deals) ? `\n\n**Stalled Deals (${data.count}):**\n` + data.deals.slice(0, 25).map((d: any) => `- ${d.title} (${d.company_name}) — $${Number(d.value_usd||0).toLocaleString()} — ${d.days_since_touch ?? '?'}d since touch — stage ${d.stage}`).join('\n') + `\n\n**Triage:** ${data.triage || ''}` : '';
      setResult([human, meta, list].filter(Boolean).join('') || JSON.stringify(data, null, 2));
    } catch (err: any) {
      if (err?.status === 503) setResult('AI service unavailable: ' + (err?.body?.detail || 'no API key configured'));
      else setResult('Error: ' + (err?.message || 'Could not get AI response'));
    } finally { setLoading(false); }
  };

  // ---- Sample prefills (Fortune-500 enterprise CRM data) ----
  type Sample = { label: string; apply: () => void };
  const samples: Record<TabId, Sample[]> = {
    scoring: [
      { label: 'JPMorgan Chase — Negotiation', apply: () => {
        setDealTitle('JPMorgan Chase — Core Banking AI Risk Platform');
        setDealStage('negotiation');
        setDealValue('38500000');
        setCompanyName('JPMorgan Chase & Co.');
        setActivitySummary('3 exec sponsor meetings with CIO Lori Beer; security review passed; legal redlines returning Tuesday; procurement requested 2-yr TCO model; champion is SVP Digital Transformation Maya Patel.');
      }},
      { label: 'Walmart — Proposal', apply: () => {
        setDealTitle('Walmart — Supply-Chain Forecasting Platform');
        setDealStage('proposal');
        setDealValue('22750000');
        setCompanyName('Walmart Inc.');
        setActivitySummary('Director Procurement Brian Cho confirmed budget; pilot ROI was 18% inventory reduction across 4 DCs; awaiting VP Engineering sign-off on integration plan with EDW.');
      }},
      { label: 'Boeing — Discovery', apply: () => {
        setDealTitle('Boeing — Predictive Maintenance for 787 Fleet');
        setDealStage('discovery');
        setDealValue('14200000');
        setCompanyName('Boeing Company');
        setActivitySummary('Initial discovery with Director Procurement and VP Engineering; pain: unplanned downtime on landing-gear telemetry; competitor GE Digital incumbent; next: technical deep-dive scheduled.');
      }},
    ],
    nextaction: [
      { label: 'ExxonMobil — Negotiation', apply: () => {
        setDealTitle('ExxonMobil — Refinery Ops Analytics');
        setDealStage('negotiation');
        setDealValue('27000000');
        setActivitySummary('Last touch 9 days ago; CFO requested ROI memo; champion VP Engineering pushing for Q3 close; legal stalled on data-residency clause for Houston ops.');
      }},
      { label: 'UnitedHealth — Proposal', apply: () => {
        setDealTitle('UnitedHealth — Claims Adjudication Copilot');
        setDealStage('proposal');
        setDealValue('19500000');
        setActivitySummary('SOW v3 sent to SVP Digital Transformation; HIPAA review in flight; 2 stakeholders silent for 11 days; need executive alignment call.');
      }},
      { label: 'P&G — Discovery', apply: () => {
        setDealTitle('Procter & Gamble — Marketing-Mix AI Modeling');
        setDealStage('discovery');
        setDealValue('8400000');
        setActivitySummary('Discovery with Director Procurement; CMO interested but unsponsored; data access blocked by IT; need to mobilize CIO sponsorship.');
      }},
    ],
    email: [
      { label: 'Lockheed — Exec Align', apply: () => {
        setContactName('Robert Chen');
        setContactTitle('CIO, Lockheed Martin Aeronautics');
        setDealTitle('Lockheed Martin — Secure ML Platform (IL5)');
        setDealStage('proposal');
        setEmailPurpose('Follow up after technical demo last Thursday; request a 30-min executive alignment meeting with the CFO to discuss FY26 budget timing and FedRAMP High readiness.');
      }},
      { label: 'Pfizer — Demo Follow-up', apply: () => {
        setContactName('Dr. Anita Rao');
        setContactTitle('SVP Digital Transformation, Pfizer');
        setDealTitle('Pfizer — Clinical Trial Document AI');
        setDealStage('discovery');
        setEmailPurpose('Recap of yesterdays discovery call; share the GxP validation white paper; propose a 4-week pilot scoped to Phase II oncology trials.');
      }},
      { label: 'JPMC — Procurement', apply: () => {
        setContactName('Brian Cho');
        setContactTitle('Director Procurement, JPMorgan Chase');
        setDealTitle('JPMorgan Chase — Core Banking AI Risk Platform');
        setDealStage('negotiation');
        setEmailPurpose('Respond to procurement RFP clarifications; provide 2-yr TCO comparison vs. incumbent; propose payment-milestone structure aligned to FY26 capex.');
      }},
    ],
    research: [
      { label: 'JPMorgan Chase', apply: () => { setResearchCompany('JPMorgan Chase & Co.'); setIndustry('Financial Services / Banking'); }},
      { label: 'Walmart', apply: () => { setResearchCompany('Walmart Inc.'); setIndustry('Retail / Supply Chain'); }},
      { label: 'Lockheed Martin', apply: () => { setResearchCompany('Lockheed Martin Corporation'); setIndustry('Aerospace & Defense'); }},
    ],
    closelikelihood: [
      { label: 'Boeing — Negotiation', apply: () => {
        setDealTitle('Boeing — Predictive Maintenance for 787 Fleet');
        setDealStage('negotiation');
        setDealValue('14200000');
        setCompanyName('Boeing Company');
        setActivitySummary('Champion VP Engineering Karen Liu confirmed exec sponsor; security review complete; one open redline on IP indemnity; competitor GE Digital still in CFO conversation.');
      }},
      { label: 'UnitedHealth — Proposal', apply: () => {
        setDealTitle('UnitedHealth — Claims Adjudication Copilot');
        setDealStage('proposal');
        setDealValue('19500000');
        setCompanyName('UnitedHealth Group');
        setActivitySummary('SVP Digital Transformation engaged; HIPAA review ongoing; pilot success metric agreed (20% adjudication-time reduction); two key stakeholders silent for 11 days.');
      }},
      { label: 'P&G — Discovery', apply: () => {
        setDealTitle('Procter & Gamble — Marketing-Mix AI Modeling');
        setDealStage('discovery');
        setDealValue('8400000');
        setCompanyName('Procter & Gamble');
        setActivitySummary('Director Procurement open; no executive sponsor identified; data access blocked by IT; competitor Databricks incumbent for analytics workloads.');
      }},
    ],
    icpfit: [
      { label: 'JPMorgan Chase', apply: () => { setIcpCompanyName('JPMorgan Chase & Co.'); setIcpDescription('Fortune 500 buyers, $5B+ revenue, complex procurement, multi-region rollouts, regulated industries (banking/healthcare/defense), CIO/CFO buying committee.'); }},
      { label: 'Walmart', apply: () => { setIcpCompanyName('Walmart Inc.'); setIcpDescription('Fortune 100 retailers, $400B+ revenue, distributed supply chain, EDW + cloud-hybrid environment, VP Engineering and Director Procurement as economic buyers.'); }},
      { label: 'Pfizer', apply: () => { setIcpCompanyName('Pfizer Inc.'); setIcpDescription('Top-10 global pharma, GxP/HIPAA regulated workloads, R&D + commercial dual buying centers, SVP Digital Transformation as champion.'); }},
    ],
    discovery: [
      { label: 'JPMC discovery call', apply: () => {
        setDealTitle('JPMorgan Chase — Core Banking AI Risk Platform');
        setTranscript(`AE: Thanks for the time, Maya. Can you walk me through the pain you're trying to solve?
Maya Patel (SVP Digital Transformation, JPMorgan Chase): Sure. Our credit-risk models run nightly on a 12-year-old mainframe pipeline. SLA misses cost us about $4M/quarter in delayed lending decisions. CIO Lori Beer wants AI-assisted scoring live by Q2 FY26.
AE: What does "live" mean for the buying committee?
Maya: I'm the champion. Lori signs above $20M. Brian Cho in Procurement runs the RFP. Legal needs SOC 2 Type II + model-risk-management framework alignment.
AE: Budget?
Maya: $30-40M ceiling. Already approved in FY26 capex if we close by March.
AE: Competition?
Maya: We're evaluating SAS, Databricks, and yourselves. Databricks is incumbent for the data lake.
AE: Timeline to decision?
Maya: Vendor down-select Feb 15. Contract by March 30.`);
      }},
      { label: 'Walmart discovery call', apply: () => {
        setDealTitle('Walmart — Supply-Chain Forecasting Platform');
        setTranscript(`AE: Brian, what's the headline problem?
Brian Cho (Director Procurement, Walmart): Out-of-stock at the shelf is up 6% YoY. VP Engineering Karen Liu thinks our forecasting model is the bottleneck — it's batch, not real-time, and ignores weather/social signals.
AE: Who owns the decision?
Brian: Karen for technical fit. CFO John Rainey signs above $20M. I run the RFP and TCO model.
AE: Current stack?
Brian: SAP IBP + custom Spark jobs. We'd need integration to the EDW and Snowflake.
AE: Budget and timing?
Brian: $20-25M, FY26 budget approved. Pilot in 4 DCs first, then 42-DC rollout if pilot hits 15% inventory reduction.
AE: Competition?
Brian: Blue Yonder is incumbent. o9 Solutions is the challenger.`);
      }},
      { label: 'Boeing discovery call', apply: () => {
        setDealTitle('Boeing — Predictive Maintenance for 787 Fleet');
        setTranscript(`AE: Karen, walk us through the unplanned-downtime issue.
Karen Liu (VP Engineering, Boeing Commercial Airplanes): Landing-gear telemetry on the 787 throws ~2,400 anomaly alerts per month. 90% are false positives, but we ground the aircraft until cleared. Each ground-hour costs ~$11K.
AE: What's the goal?
Karen: Cut false positives by 60% without missing a real failure. CIO Susan Doniz is the exec sponsor.
AE: Buying committee?
Karen: Susan, me, Director Procurement Brian Cho, and Aviation Safety. Safety has veto.
AE: Budget?
Karen: $12-16M. FY26 capex.
AE: Competition?
Karen: GE Digital Predix is incumbent. We're also looking at Palantir Foundry.
AE: Timeline?
Karen: Technical down-select end of Q1; contract Q2.`);
      }},
    ],
    stalled: [
      { label: '14 days', apply: () => setStallDays('14') },
      { label: '21 days', apply: () => setStallDays('21') },
      { label: '30 days', apply: () => setStallDays('30') },
    ],
    winloss: [],
  };

  const SampleBar = ({ tab }: { tab: TabId }) => {
    const list = samples[tab] || [];
    if (!list.length) return null;
    return (
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-xs text-gray-500 self-center mr-1">Samples:</span>
        {list.map((s, i) => (
          <button key={i} type="button" onClick={s.apply} className="text-xs px-2.5 py-1 rounded-md bg-violet-900/40 text-violet-200 hover:bg-violet-800/60 border border-violet-800/50 transition-colors">
            {s.label}
          </button>
        ))}
      </div>
    );
  };

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'scoring', label: 'Deal Scoring', icon: BarChart2 },
    { id: 'nextaction', label: 'Next Action', icon: Zap },
    { id: 'email', label: 'Email Draft', icon: Mail },
    { id: 'research', label: 'Company Research', icon: Building2 },
    { id: 'closelikelihood', label: 'Close Likelihood', icon: Target },
    { id: 'icpfit', label: 'ICP Fit', icon: Crosshair },
    { id: 'discovery', label: 'Discovery Summary', icon: FileText },
    { id: 'stalled', label: 'Stalled Deals', icon: AlertTriangle },
    { id: 'winloss', label: 'Win/Loss Insights', icon: Trophy },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Center</h1>
          <p className="text-gray-400 text-sm">AI-powered tools for enterprise deal intelligence</p>
        </div>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setActiveTab(id); setResult(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-3xl">
        {activeTab === 'scoring' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.dealScoring({ title: dealTitle, stage: dealStage, value_usd: Number(dealValue) }, { name: companyName }, [])); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Deal Scoring</h2><p className="text-gray-400 text-sm mb-4">Get an AI-powered deal health score and win probability analysis.</p></div>
            <SampleBar tab="scoring" />
            <div><label className="block text-sm text-gray-300 mb-1">Deal Title</label><input value={dealTitle} onChange={e => setDealTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Amazon AWS AI Platform Integration" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-300 mb-1">Stage</label><select value={dealStage} onChange={e => setDealStage(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">{['prospecting','qualification','discovery','proposal','negotiation','legal_review'].map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-sm text-gray-300 mb-1">Deal Value ($)</label><input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="28500000" /></div>
            </div>
            <div><label className="block text-sm text-gray-300 mb-1">Company Name</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Amazon" /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Recent Activity Summary</label><textarea value={activitySummary} onChange={e => setActivitySummary(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Describe recent meetings, calls, and activities..." /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Analyzing...' : 'Score Deal'}</button>
          </form>
        )}
        {activeTab === 'nextaction' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.nextAction({ title: dealTitle, stage: dealStage, value_usd: Number(dealValue) }, [])); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Next Best Action</h2><p className="text-gray-400 text-sm mb-4">Get AI recommendations for the next steps to advance your deal.</p></div>
            <SampleBar tab="nextaction" />
            <div><label className="block text-sm text-gray-300 mb-1">Deal Title</label><input value={dealTitle} onChange={e => setDealTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Walmart Digital Operations Platform" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-300 mb-1">Stage</label><select value={dealStage} onChange={e => setDealStage(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">{['prospecting','qualification','discovery','proposal','negotiation','legal_review'].map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-sm text-gray-300 mb-1">Deal Value ($)</label><input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="42000000" /></div>
            </div>
            <div><label className="block text-sm text-gray-300 mb-1">Recent Activities</label><textarea value={activitySummary} onChange={e => setActivitySummary(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Describe recent interactions with the prospect..." /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Generating...' : 'Get Next Actions'}</button>
          </form>
        )}
        {activeTab === 'email' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.emailDraft({ title: dealTitle, stage: dealStage }, { name: contactName, title: contactTitle }, emailPurpose)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Email Draft</h2><p className="text-gray-400 text-sm mb-4">Generate a personalized outreach email for an enterprise contact.</p></div>
            <SampleBar tab="email" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-300 mb-1">Contact Name</label><input value={contactName} onChange={e => setContactName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Michael Torres" required /></div>
              <div><label className="block text-sm text-gray-300 mb-1">Title</label><input value={contactTitle} onChange={e => setContactTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., SVP Cloud Infrastructure" /></div>
            </div>
            <div><label className="block text-sm text-gray-300 mb-1">Deal/Context</label><input value={dealTitle} onChange={e => setDealTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Amazon AWS AI Platform" /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Email Purpose</label><textarea value={emailPurpose} onChange={e => setEmailPurpose(e.target.value)} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="e.g., Follow up after product demo, request executive alignment meeting" required /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Drafting...' : 'Draft Email'}</button>
          </form>
        )}
        {activeTab === 'research' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.companyResearch(researchCompany, industry)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Company Research</h2><p className="text-gray-400 text-sm mb-4">Generate a deep intelligence report on a Fortune 500 target account.</p></div>
            <SampleBar tab="research" />
            <div><label className="block text-sm text-gray-300 mb-1">Company Name</label><input value={researchCompany} onChange={e => setResearchCompany(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., JPMorgan Chase" required /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Industry</label><input value={industry} onChange={e => setIndustry(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Financial Services" /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Researching...' : 'Research Company'}</button>
          </form>
        )}
        {activeTab === 'closelikelihood' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.closeLikelihood({ title: dealTitle, stage: dealStage, value_usd: Number(dealValue) }, { name: companyName }, [{ summary: activitySummary }])); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Close Likelihood</h2><p className="text-gray-400 text-sm mb-4">Probabilistic forecast with positive/negative signals and shift levers.</p></div>
            <SampleBar tab="closelikelihood" />
            <div><label className="block text-sm text-gray-300 mb-1">Deal Title</label><input value={dealTitle} onChange={e => setDealTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-gray-300 mb-1">Stage</label><select value={dealStage} onChange={e => setDealStage(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">{['prospecting','qualification','discovery','proposal','negotiation','legal_review'].map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-sm text-gray-300 mb-1">Deal Value ($)</label><input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            <div><label className="block text-sm text-gray-300 mb-1">Company Name</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Activity Summary</label><textarea value={activitySummary} onChange={e => setActivitySummary(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Forecasting...' : 'Forecast Close'}</button>
          </form>
        )}
        {activeTab === 'icpfit' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.icpFit({ name: icpCompanyName }, icpDescription)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">ICP Fit Scorer</h2><p className="text-gray-400 text-sm mb-4">Score how well an account matches your Ideal Customer Profile.</p></div>
            <SampleBar tab="icpfit" />
            <div><label className="block text-sm text-gray-300 mb-1">Target Company</label><input value={icpCompanyName} onChange={e => setIcpCompanyName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Walmart" required /></div>
            <div><label className="block text-sm text-gray-300 mb-1">ICP Description</label><textarea value={icpDescription} onChange={e => setIcpDescription(e.target.value)} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Scoring...' : 'Score ICP Fit'}</button>
          </form>
        )}
        {activeTab === 'discovery' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.discoverySummary(transcript, dealTitle)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Discovery-Call Summarizer</h2><p className="text-gray-400 text-sm mb-4">Paste a discovery call transcript and get a structured BANT/MEDDIC briefing.</p></div>
            <SampleBar tab="discovery" />
            <div><label className="block text-sm text-gray-300 mb-1">Deal Title (optional)</label><input value={dealTitle} onChange={e => setDealTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Transcript</label><textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={8} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Paste call transcript here..." required /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Summarizing...' : 'Summarize Call'}</button>
          </form>
        )}
        {activeTab === 'stalled' && (
          <form onSubmit={e => { e.preventDefault(); callRaw(() => api.ai.stalledDeals(Number(stallDays) || 21)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Stalled-Deal Detector</h2><p className="text-gray-400 text-sm mb-4">Surface deals with no activity for N days and get AI triage.</p></div>
            <SampleBar tab="stalled" />
            <div><label className="block text-sm text-gray-300 mb-1">Threshold (days)</label><input type="number" min="1" value={stallDays} onChange={e => setStallDays(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Scanning...' : 'Find Stalled Deals'}</button>
          </form>
        )}
        {activeTab === 'winloss' && (
          <form onSubmit={e => { e.preventDefault(); callRaw(() => api.ai.winLossInsights()); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Win/Loss Insight Generator</h2><p className="text-gray-400 text-sm mb-4">Analyze closed_won and closed_lost deals to surface patterns and playbook changes.</p></div>
            <p className="text-gray-400 text-sm">Pulls live data from your pipeline. No inputs required.</p>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Analyzing...' : 'Generate Insights'}</button>
          </form>
        )}
        <AIResponse result={result} loading={loading} />
      </div>
    </div>
  );
}
