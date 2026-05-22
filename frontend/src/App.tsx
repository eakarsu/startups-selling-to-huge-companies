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
import CustomViewsPage from './pages/CustomViewsPage';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

// Apply pass 7: wire previously-orphaned Gap (audit-gap advisory) pages
import GapMultiThreadingCoach from './pages/GapMultiThreadingCoach';
import GapProcurementDecoder from './pages/GapProcurementDecoder';
import GapChampionIdentifier from './pages/GapChampionIdentifier';
import GapBudgetCyclePredictor from './pages/GapBudgetCyclePredictor';
import GapLegalReviewAutomator from './pages/GapLegalReviewAutomator';
import GapCalendarIntegration from './pages/GapCalendarIntegration';
import GapEmailSync from './pages/GapEmailSync';
import GapEsignIntegration from './pages/GapEsignIntegration';
import GapRevenueForecast from './pages/GapRevenueForecast';
import GapOrgChart from './pages/GapOrgChart';
import GapCallRecording from './pages/GapCallRecording';
// Apply pass 7: wire previously-orphaned Cf (custom-feature advisory) pages
import CfChampionMap from './pages/CfChampionMap';
import CfF100Playbook from './pages/CfF100Playbook';
import CfMsaRedlines from './pages/CfMsaRedlines';
import CfSecurityQuestionnaires from './pages/CfSecurityQuestionnaires';
import CfPilotScorecards from './pages/CfPilotScorecards';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

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
          <Route path="custom-views" element={<CustomViewsPage />} />
          {/* Apply pass 7: Gap (audit-gap) AI advisory pages */}
          <Route path="gap/multi-threading-coach" element={<GapMultiThreadingCoach />} />
          <Route path="gap/procurement-decoder" element={<GapProcurementDecoder />} />
          <Route path="gap/champion-identifier" element={<GapChampionIdentifier />} />
          <Route path="gap/budget-cycle-predictor" element={<GapBudgetCyclePredictor />} />
          <Route path="gap/legal-review-automator" element={<GapLegalReviewAutomator />} />
          <Route path="gap/calendar-integration" element={<GapCalendarIntegration />} />
          <Route path="gap/email-sync" element={<GapEmailSync />} />
          <Route path="gap/esign-integration" element={<GapEsignIntegration />} />
          <Route path="gap/revenue-forecast" element={<GapRevenueForecast />} />
          <Route path="gap/org-chart" element={<GapOrgChart />} />
          <Route path="gap/call-recording" element={<GapCallRecording />} />
          {/* Apply pass 7: Cf (custom-feature) AI advisory pages */}
          <Route path="cf/champion-map" element={<CfChampionMap />} />
          <Route path="cf/f100-playbook" element={<CfF100Playbook />} />
          <Route path="cf/msa-redlines" element={<CfMsaRedlines />} />
          <Route path="cf/security-questionnaires" element={<CfSecurityQuestionnaires />} />
          <Route path="cf/pilot-scorecards" element={<CfPilotScorecards />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
