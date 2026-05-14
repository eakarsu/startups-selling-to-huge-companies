import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CompaniesPage from './pages/CompaniesPage';
import ContactsPage from './pages/ContactsPage';
import DealsPage from './pages/DealsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import TeamPage from './pages/TeamPage';
import NotesPage from './pages/NotesPage';
import SearchPage from './pages/SearchPage';
import AuditLogPage from './pages/AuditLogPage';
import ExportPage from './pages/ExportPage';
import SampleDataPage from './pages/SampleDataPage';
import AICenter from './components/AICenter';
import MsaRedlinesPage from './pages/MsaRedlinesPage';
import SecurityQuestionnairePage from './pages/SecurityQuestionnairePage';
import ChampionMapPage from './pages/ChampionMapPage';
import ProcurementPlaybookPage from './pages/ProcurementPlaybookPage';
import PilotScorecardsPage from './pages/PilotScorecardsPage';
import CompliancePosturePage from './pages/CompliancePosturePage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="sample-data" element={<SampleDataPage />} />
          <Route path="ai-center" element={<AICenter />} />
          <Route path="msa-redlines" element={<MsaRedlinesPage />} />
          <Route path="security-questionnaires" element={<SecurityQuestionnairePage />} />
          <Route path="champion-map" element={<ChampionMapPage />} />
          <Route path="procurement-playbook" element={<ProcurementPlaybookPage />} />
          <Route path="pilot-scorecards" element={<PilotScorecardsPage />} />
          <Route path="compliance-posture" element={<CompliancePosturePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
