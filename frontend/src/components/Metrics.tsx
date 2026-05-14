import { Deal } from '../App'

const stageOrder = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

type Props = {
  deals: Deal[]
}

export default function Metrics({ deals }: Props) {
  const closedWon = deals.filter(d => d.stage === 'Closed Won')
  const closedLost = deals.filter(d => d.stage === 'Closed Lost')
  const closedTotal = closedWon.length + closedLost.length
  const winRate = closedTotal > 0 ? Math.round((closedWon.length / closedTotal) * 100) : 0

  const allDeals = deals.filter(d => d.value > 0)
  const avgDealValue = allDeals.length > 0 ? (allDeals.reduce((s, d) => s + d.value, 0) / allDeals.length).toFixed(1) : '0'

  // Revenue by stage
  const revenueByStage = stageOrder.map(stage => ({
    stage,
    value: deals.filter(d => d.stage === stage).reduce((s, d) => s + d.value, 0),
  }))
  const maxStageValue = Math.max(...revenueByStage.map(s => s.value))

  // Deals by industry
  const industryMap: Record<string, number> = {
    Technology: 0, 'Financial Services': 0, Healthcare: 0, Energy: 0, Retail: 0,
  }
  const industryCompany: Record<string, string> = {
    Apple: 'Technology', JPMorgan: 'Financial Services', UnitedHealth: 'Healthcare',
    ExxonMobil: 'Energy', Walmart: 'Retail',
  }
  deals.forEach(d => {
    const ind = industryCompany[d.company] || industryCompany[d.company.split(' ')[0]]
    if (ind) industryMap[ind] = (industryMap[ind] || 0) + d.value
  })
  const industryData = Object.entries(industryMap).map(([industry, value]) => ({ industry, value }))
  const maxIndustryValue = Math.max(...industryData.map(i => i.value))

  const stageColors: Record<string, string> = {
    'Prospecting': 'bg-gray-600',
    'Qualification': 'bg-blue-600',
    'Proposal': 'bg-indigo-600',
    'Negotiation': 'bg-amber-600',
    'Closed Won': 'bg-green-600',
    'Closed Lost': 'bg-red-700',
  }

  const industryColors = ['bg-blue-500', 'bg-indigo-500', 'bg-green-500', 'bg-orange-500', 'bg-yellow-500']

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Pipeline Metrics</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Win Rate</div>
          <div className="text-3xl font-bold text-green-400">34%</div>
          <div className="text-xs text-gray-500 mt-2">Closed deals</div>
          <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: '34%' }}></div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Avg Deal Value</div>
          <div className="text-3xl font-bold text-blue-400">$2.4M</div>
          <div className="text-xs text-gray-500 mt-2">Across all stages</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Avg Sales Cycle</div>
          <div className="text-3xl font-bold text-amber-400">127 <span className="text-lg">days</span></div>
          <div className="text-xs text-gray-500 mt-2">Prospect to close</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Pipeline</div>
          <div className="text-3xl font-bold text-white">$18.6M</div>
          <div className="text-xs text-gray-500 mt-2">{deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length} active deals</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by stage bar chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider text-xs">Revenue by Stage</h3>
          <div className="space-y-3">
            {revenueByStage.filter(s => s.value > 0).map((s) => (
              <div key={s.stage}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{s.stage}</span>
                  <span className="text-white font-mono">${s.value.toFixed(1)}M</span>
                </div>
                <div className="h-6 bg-gray-800 rounded overflow-hidden">
                  <div
                    className={`h-full rounded ${stageColors[s.stage]} transition-all duration-500`}
                    style={{ width: `${maxStageValue > 0 ? (s.value / maxStageValue) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deals by industry */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider text-xs">Pipeline Value by Industry</h3>
          <div className="space-y-3">
            {industryData.filter(i => i.value > 0).sort((a, b) => b.value - a.value).map((item, idx) => (
              <div key={item.industry}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{item.industry}</span>
                  <span className="text-white font-mono">${item.value.toFixed(1)}M</span>
                </div>
                <div className="h-6 bg-gray-800 rounded overflow-hidden">
                  <div
                    className={`h-full rounded ${industryColors[idx % industryColors.length]} transition-all duration-500`}
                    style={{ width: `${maxIndustryValue > 0 ? (item.value / maxIndustryValue) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">Deal Distribution</h3>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <div className="text-xs text-gray-500 mb-2">By Tier</div>
            {['F10', 'F50', 'F100'].map((tier) => {
              const count = deals.filter(d => d.tier === tier).length
              return (
                <div key={tier} className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">{tier}</span>
                  <span className="text-sm text-white font-mono">{count} deals</span>
                </div>
              )
            })}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">By Owner</div>
            {['Sarah Kim', 'Marcus Chen', 'Lisa Park', 'Tom Rivera'].map((owner) => {
              const count = deals.filter(d => d.owner === owner).length
              return (
                <div key={owner} className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">{owner.split(' ')[0]}</span>
                  <span className="text-sm text-white font-mono">{count} deals</span>
                </div>
              )
            })}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">Closed Summary</div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-green-400">Won</span>
              <span className="text-sm text-white font-mono">{closedWon.length} deals</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-red-400">Lost</span>
              <span className="text-sm text-white font-mono">{closedLost.length} deals</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Win Rate</span>
              <span className="text-sm text-green-400 font-mono">{winRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Avg Value</span>
              <span className="text-sm text-white font-mono">${avgDealValue}M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
