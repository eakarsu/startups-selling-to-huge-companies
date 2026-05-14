import { useState } from 'react'
import { Deal } from '../App'

type Company = {
  name: string
  initials: string
  color: string
  revenue: number
  employees: string
  industry: string
  tier: 'F10' | 'F50' | 'F100'
}

const companies: Company[] = [
  { name: 'Apple', initials: 'AP', color: 'bg-gray-500', revenue: 383, employees: '164K', industry: 'Technology', tier: 'F10' },
  { name: 'JPMorgan Chase', initials: 'JP', color: 'bg-blue-600', revenue: 158, employees: '293K', industry: 'Financial Services', tier: 'F10' },
  { name: 'UnitedHealth Group', initials: 'UH', color: 'bg-green-600', revenue: 371, employees: '440K', industry: 'Healthcare', tier: 'F10' },
  { name: 'ExxonMobil', initials: 'EM', color: 'bg-red-700', revenue: 413, employees: '62K', industry: 'Energy', tier: 'F10' },
  { name: 'Walmart', initials: 'WM', color: 'bg-yellow-600', revenue: 648, employees: '2.1M', industry: 'Retail', tier: 'F10' },
]

const tierColors: Record<string, string> = {
  'F10': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'F50': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'F100': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
}

type Props = {
  deals: Deal[]
  onSelectDeal: (deal: Deal) => void
}

export default function Companies({ deals, onSelectDeal }: Props) {
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Companies</h2>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Company</th>
              <th className="text-right px-5 py-3">Revenue ($B)</th>
              <th className="text-right px-5 py-3">Employees</th>
              <th className="text-left px-5 py-3">Industry</th>
              <th className="text-center px-5 py-3">Tier</th>
              <th className="text-right px-5 py-3">Open Deals</th>
              <th className="text-right px-5 py-3">Pipeline Value</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((co) => {
              const coDeals = deals.filter((d) => d.company === co.name || d.company === co.name.split(' ')[0])
              const openDeals = coDeals.filter((d) => !['Closed Won', 'Closed Lost'].includes(d.stage))
              const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0)
              const isExpanded = expandedCompany === co.name

              return (
                <>
                  <tr
                    key={co.name}
                    onClick={() => setExpandedCompany(isExpanded ? null : co.name)}
                    className="border-b border-gray-800/60 hover:bg-gray-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${co.color} flex items-center justify-center text-sm font-bold text-white`}>
                          {co.initials}
                        </div>
                        <div>
                          <div className="font-medium text-white">{co.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-gray-300">${co.revenue}B</td>
                    <td className="px-5 py-4 text-right text-gray-300">{co.employees}</td>
                    <td className="px-5 py-4 text-gray-400">{co.industry}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded border text-xs ${tierColors[co.tier]}`}>{co.tier}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-semibold ${openDeals.length > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
                        {openDeals.length}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-white">
                      {pipelineValue > 0 ? `$${pipelineValue.toFixed(1)}M` : '—'}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${co.name}-expanded`} className="border-b border-gray-800/60 bg-gray-800/20">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="pl-12">
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Deals with {co.name}</div>
                          {coDeals.length === 0 ? (
                            <p className="text-sm text-gray-600">No deals found</p>
                          ) : (
                            <div className="space-y-2">
                              {coDeals.map((deal) => (
                                <div
                                  key={deal.id}
                                  onClick={(e) => { e.stopPropagation(); onSelectDeal(deal); }}
                                  className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 cursor-pointer hover:border-blue-600 transition-colors"
                                >
                                  <span className="text-sm text-gray-200">{deal.title}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">{deal.stage}</span>
                                    <span className="text-sm font-semibold text-white">${deal.value}M</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      deal.stage === 'Closed Won' ? 'bg-green-900/60 text-green-400' :
                                      deal.stage === 'Closed Lost' ? 'bg-red-900/60 text-red-400' :
                                      'bg-blue-900/60 text-blue-400'
                                    }`}>{deal.probability}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
