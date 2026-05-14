import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { TrendingUp, Building2, Users, Briefcase, Activity, UserCheck, FileText, Sparkles, LogOut, Search, FileSpreadsheet, ScrollText, Database, LayoutDashboard, Scale, ShieldCheck, Network, ClipboardList, Award, ShieldHalf } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/deals', icon: Briefcase, label: 'Deals' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/activities', icon: Activity, label: 'Activities' },
  { to: '/team', icon: UserCheck, label: 'Sales Team' },
  { to: '/notes', icon: FileText, label: 'Notes' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/export', icon: FileSpreadsheet, label: 'CSV Export' },
  { to: '/audit', icon: ScrollText, label: 'Audit Log' },
  { to: '/sample-data', icon: Database, label: 'Sample Data' },
];

const deepNavItems = [
  { to: '/champion-map', icon: Network, label: 'Champion Map' },
  { to: '/procurement-playbook', icon: ClipboardList, label: 'Procurement Playbook' },
  { to: '/msa-redlines', icon: Scale, label: 'MSA Redlines' },
  { to: '/security-questionnaires', icon: ShieldCheck, label: 'Security Questionnaires' },
  { to: '/pilot-scorecards', icon: Award, label: 'Pilot Scorecards' },
  { to: '/compliance-posture', icon: ShieldHalf, label: 'Compliance Posture' },
];

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-64 bg-gray-900 flex flex-col border-r border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white">EnterpriseOS</div>
              <div className="text-xs text-gray-400">Fortune 500 CRM</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
          <div className="pt-4 mt-4 border-t border-gray-800">
            <NavLink to="/ai-center" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : 'text-violet-400 hover:text-white hover:bg-gray-800'}`}>
              <Sparkles className="w-4 h-4" />
              AI Center
            </NavLink>
          </div>
          <div className="pt-4 mt-4 border-t border-gray-800">
            <div className="px-3 mb-2 text-xs uppercase font-bold text-gray-500 tracking-wider">F100 Deep Tools</div>
            {deepNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-emerald-700 text-white' : 'text-emerald-400 hover:text-white hover:bg-gray-800'}`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.name?.[0] || 'A'}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{user.name || 'Admin'}</div>
              <div className="text-xs text-gray-400">{user.role || 'admin'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" />Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  );
}
