import { Deal } from '../App'

const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

const stageColors: Record<string, string> = {
  'Prospecting': 'bg-gray-600',
  'Qualification': 'bg-blue-600',
  'Proposal': 'bg-indigo-600',
  'Negotiation': 'bg-amber-600',
  'Closed Won': 'bg-green-600',
  'Closed Lost': 'bg-red-700',
}

const tierColors: Record<string, string> = {
  'F10': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'F50': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'F100': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
}

type Props = {
  deals: Deal[]
  onSelectDeal: (deal: Deal) => void
}

export default function Pipeline({ deals, onSelectDeal }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Deal Pipeline</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Deal
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage)
          const totalValue = stageDeals.reduce((s, d) => s + d.value, 0)

          return (
            <div key={stage} className="flex-shrink-0 w-52 flex flex-col">
              {/* Column header */}
              <div className={`px-3 py-2 rounded-t-lg ${stageColors[stage]} bg-opacity-80`}>
                <div className="text-xs font-semibold text-white">{stage}</div>
                <div className="text-xs text-white/70 mt-0.5">${totalValue.toFixed(1)}M • {stageDeals.length} deals</div>
              </div>

              {/* Cards */}
              <div className="flex-1 bg-gray-900/60 border border-gray-800 border-t-0 rounded-b-lg p-2 space-y-2 min-h-24">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => onSelectDeal(deal)}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-3 cursor-pointer hover:border-blue-600 transition-colors"
                  >
                    {/* Drag handle + initials */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-gray-600 text-xs select-none">⠿</div>
                      <div className={`w-7 h-7 rounded-full ${deal.companyColor} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                        {deal.companyInitials}
                      </div>
                      <span className="text-xs text-gray-300 font-medium truncate">{deal.company}</span>
                    </div>
                    <div className="text-xs text-gray-200 mb-2 leading-tight">{deal.title}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">${deal.value}M</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${tierColors[deal.tier]}`}>{deal.tier}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden mr-2">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${deal.probability}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">{deal.probability}%</span>
                    </div>
                  </div>
                ))}
                {stageDeals.length === 0 && (
                  <div className="text-center py-4 text-gray-700 text-xs">No deals</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
