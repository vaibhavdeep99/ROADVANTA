import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import MainDashboardPage from './pages/MainDashboardPage';
import AiDetectionStudioPage from './pages/AiDetectionStudioPage';
import MapPage from './pages/MapPage';
import IncidentReportsPage from './pages/IncidentReportsPage';
import AuthorityDashboardPage from './pages/AuthorityDashboardPage';
import ResolutionTrackingPage from './pages/ResolutionTrackingPage';
import LoginPage from './pages/LoginPage';
import AreaIntelligencePage from './pages/AreaIntelligencePage';
import RouteHazardIntelligencePage from './pages/RouteHazardIntelligencePage';
import ReportHazardPage from './pages/ReportHazardPage';
import RoadSafetyDashboardPage from './pages/RoadSafetyDashboardPage';
import RoadVisionLabPage from './pages/RoadVisionLabPage';
import VideoDetectionLabPage from './pages/VideoDetectionLabPage';
import SettingsModelPage from './pages/SettingsModelPage';
import DatasetSourcesPage from './pages/DatasetSourcesPage';
import GeminiRoadAssistant from './components/GeminiRoadAssistant';
import './index.css';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#111827',
            color: '#F8FAFC',
            border: '1px solid #263449',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: {
            iconTheme: {
              primary: '#22D3EE',
              secondary: '#111827',
            },
          },
          error: {
            iconTheme: {
              primary: '#FB7185',
              secondary: '#111827',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<MainDashboardPage />} />
        <Route path="/statistics" element={<RoadSafetyDashboardPage />} />
        <Route path="/safety-dashboard" element={<RoadSafetyDashboardPage />} />
        <Route path="/route-intelligence" element={<RouteHazardIntelligencePage />} />
        <Route path="/route" element={<RouteHazardIntelligencePage />} />
        <Route path="/detection" element={<AiDetectionStudioPage />} />
        <Route path="/vision-lab" element={<RoadVisionLabPage />} />
        <Route path="/video-lab" element={<VideoDetectionLabPage />} />
        <Route path="/datasets" element={<DatasetSourcesPage />} />
        <Route path="/settings" element={<SettingsModelPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/reports" element={<IncidentReportsPage />} />
        <Route path="/authority" element={<AuthorityDashboardPage />} />
        <Route path="/tracking" element={<ResolutionTrackingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage initialRegister={true} />} />
        <Route path="/intelligence" element={<AreaIntelligencePage />} />
        <Route path="/report" element={<ReportHazardPage />} />
      </Routes>
      {/* Floating Gemini AI Website Assistant across all pages */}
      <GeminiRoadAssistant />
    </Router>
  );
}

export default App;
