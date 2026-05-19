import DealStageChart from '../components/DealStageChart';
import AccountHeatmap from '../components/AccountHeatmap';
import PitchDeckPdf from '../components/PitchDeckPdf';
import PlaybookRulesEditor from '../components/PlaybookRulesEditor';
import { LayoutGrid } from 'lucide-react';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page" className="p-6 space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <LayoutGrid className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Enterprise Views</h1>
          <p className="text-sm text-gray-400">
            Custom views for enterprise sales advisory · 2 visualizations + 2 operational tools.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DealStageChart />
        <AccountHeatmap />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PitchDeckPdf />
        <PlaybookRulesEditor />
      </div>
    </div>
  );
}
