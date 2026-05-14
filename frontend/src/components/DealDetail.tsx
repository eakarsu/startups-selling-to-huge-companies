import { useState } from 'react'
import { Deal } from '../App'

const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

type Activity = {
  id: string
  type: 'email' | 'call' | 'demo' | 'meeting' | 'note'
  date: string
  subject: string
  outcome: string
  owner: string
}

const dealActivities: Record<string, Activity[]> = {
  'd1': [
    { id: 'a1', type: 'demo', date: '2026-05-02', subject: 'Product demo with VP Engineering', outcome: 'Very positive; requested custom roadmap doc', owner: 'Sarah Kim' },
    { id: 'a2', type: 'call', date: '2026-04-28', subject: 'Procurement check-in call', outcome: 'Legal review underway; 2-week timeline', owner: 'Sarah Kim' },
    { id: 'a3', type: 'email', date: '2026-04-22', subject: 'Sent SOC 2 Type II report', outcome: 'Acknowledged, no issues', owner: 'Sarah Kim' },
    { id: 'a4', type: 'meeting', date: '2026-04-15', subject: 'Executive sponsor meeting', outcome: 'Budget approved at $4.2M, moving to legal', owner: 'Sarah Kim' },
    { id: 'a5', type: 'email', date: '2026-04-08', subject: 'Proposal sent', outcome: 'Read, awaiting feedback', owner: 'Sarah Kim' },
  ],
  'd2': [
    { id: 'b1', type: 'demo', date: '2026-05-01', subject: 'Risk analytics deep-dive demo', outcome: 'Compliance team interested; wants integration with existing SIEM', owner: 'Marcus Chen' },
    { id: 'b2', type: 'call', date: '2026-04-24', subject: 'RFP scoping call', outcome: 'RFP expected May 15; 3 competing vendors', owner: 'Marcus Chen' },
    { id: 'b3', type: 'email', date: '2026-04-18', subject: 'Sent technical whitepaper', outcome: 'Forwarded to CTO', owner: 'Marcus Chen' },
    { id: 'b4', type: 'meeting', date: '2026-04-10', subject: 'Initial discovery meeting', outcome: 'Key pain: regulatory reporting delays; strong fit', owner: 'Marcus Chen' },
    { id: 'b5', type: 'note', date: '2026-04-05', subject: 'Inbound lead via conference', outcome: 'Met CISO at FinTech Summit, strong interest', owner: 'Marcus Chen' },
  ],
}

const activityIcons: Record<string, string> = {
  email: '📧', call: '📞', demo: '🖥️', meeting: '👥', note: '📝',
}

const activityColors: Record<string, string> = {
  email: 'bg-blue-900/40 text-blue-400',
  call: 'bg-green-900/40 text-green-400',
  demo: 'bg-purple-900/40 text-purple-400',
  meeting: 'bg-amber-900/40 text-amber-400',
  note: 'bg-gray-800 text-gray-400',
}

type Props = {
  deal: Deal
}

export default function DealDetail({ deal }: Props) {
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [newActivity, setNewActivity] = useState({ type: 'call', subject: '', outcome: '' })

  const activities = dealActivities[deal.id] || dealActivities['d1']
  const stageIndex = stages.indexOf(deal.stage)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl ${deal.companyColor} flex items-center justify-center text-xl font-bold text-white`}>
            {deal.companyInitials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{deal.title}</h2>
            <p className="text-gray-400">{deal.company}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">${deal.value}M</div>
          <div className="text-xs text-gray-400 mt-1">Deal Value</div>
        </div>
      </div>

      {/* Deal metadata */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Stage</div>
          <div className="text-sm font-semibold text-white">{deal.stage}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Probability</div>
          <div className="text-sm font-semibold text-blue-400">{deal.probability}%</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Expected Close</div>
          <div className="text-sm font-semibold text-white">{deal.expectedClose}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Owner</div>
          <div className="text-sm font-semibold text-white">{deal.owner}</div>
        </div>
      </div>

      {/* Stage progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Stage Progress</div>
        <div className="flex items-center gap-0">
          {stages.map((stage, idx) => {
            const isActive = idx === stageIndex
            const isPast = idx < stageIndex
            const isLast = idx === stages.length - 1

            return (
              <div key={stage} className="flex items-center flex-1">
                <div className="flex-1 relative">
                  <div className={`h-2 ${
                    isPast ? 'bg-blue-500' : isActive ? 'bg-blue-600' : 'bg-gray-800'
                  } ${idx === 0 ? 'rounded-l-full' : ''} ${isLast ? 'rounded-r-full' : ''}`}></div>
                  <div className="mt-2 text-center">
                    <span className={`text-xs ${isActive ? 'text-blue-400 font-semibold' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>
                      {stage}
                    </span>
                  </div>
                </div>
                {!isLast && (
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 -mx-1.5 z-10 ${
                    isPast ? 'bg-blue-500 border-blue-400' :
                    isActive ? 'bg-blue-600 border-blue-400' :
                    'bg-gray-900 border-gray-700'
                  }`}></div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Activity timeline */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Activity Timeline</div>
          <button
            onClick={() => setShowAddActivity(!showAddActivity)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            + Add Activity
          </button>
        </div>

        {showAddActivity && (
          <div className="mb-4 bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <select
                value={newActivity.type}
                onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="demo">Demo</option>
                <option value="meeting">Meeting</option>
                <option value="note">Note</option>
              </select>
              <input
                placeholder="Subject"
                value={newActivity.subject}
                onChange={(e) => setNewActivity({...newActivity, subject: e.target.value})}
                className="col-span-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              placeholder="Outcome / notes"
              value={newActivity.outcome}
              onChange={(e) => setNewActivity({...newActivity, outcome: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowAddActivity(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Save Activity
            </button>
          </div>
        )}

        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${activityColors[activity.type]}`}>
                {activityIcons[activity.type]}
              </div>
              <div className="flex-1 bg-gray-800/60 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-200">{activity.subject}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{activity.outcome}</div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-xs text-gray-500">{activity.date}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{activity.owner}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
