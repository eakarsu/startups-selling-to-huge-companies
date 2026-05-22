import { useState } from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';

export default function PitchDeckPdf() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function authHeader(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchPdf(): Promise<Blob | null> {
    setStatus(null);
    setBusy(true);
    try {
      const r = await fetch('/api/custom-views/pitch-deck-pdf', { headers: authHeader() });
      if (!r.ok) throw new Error(`status ${r.status}`);
      const blob = await r.blob();
      return blob;
    } catch (e: any) {
      setStatus(`Error: ${e?.message || 'failed'}`);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    const blob = await fetchPdf();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enterprise-pitch-deck.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Downloaded enterprise-pitch-deck.pdf');
  }

  async function preview() {
    const blob = await fetchPdf();
    if (!blob) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setStatus('Loaded inline preview.');
  }

  return (
    <section data-testid="pitch-deck-pdf" className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Enterprise Pitch Deck (PDF)</h2>
            <p className="text-xs text-gray-400">Auto-generated F100 pitch summary from live pipeline data</p>
          </div>
        </div>
      </header>

      <div className="text-sm text-gray-300 space-y-2 mb-4">
        <p>Generates a 1-page PDF summarising why-now, pipeline snapshot, top enterprise accounts, land-and-expand motion, and the ask. Pulls live data from the CRM.</p>
        <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
          <li>Includes top 6 enterprise accounts by revenue</li>
          <li>Aggregated open pipeline and stage mix</li>
          <li>Hand-out style ready to share with internal sponsors</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={downloadPdf}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> {busy ? 'Generating…' : 'Download PDF'}
        </button>
        <button
          onClick={preview}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 text-gray-200 rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          <ExternalLink className="w-4 h-4" /> Preview inline
        </button>
        {status && <span className="text-xs text-emerald-400">{status}</span>}
      </div>

      {previewUrl && (
        <div className="mt-4 border border-gray-800 rounded-lg overflow-hidden">
          <iframe
            title="enterprise-pitch-deck-preview"
            src={previewUrl}
            className="w-full bg-white"
            style={{ height: 520 }}
          />
        </div>
      )}
    </section>
  );
}
