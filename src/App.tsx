import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAccessControl } from "@/hooks/useAccessControl";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import NewCase from "./pages/NewCase";
import CaseDetail from "./pages/CaseDetail";
import Documents from "./pages/Documents";
import Timeline from "./pages/Timeline";
import Reports from "./pages/Reports";
import SearchPage from "./pages/SearchPage";
import Profile from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import WritingStyle from "./pages/WritingStyle";
import Partners from "./pages/Partners";
import Intake from "./pages/Intake";
import RootAdmin from "./pages/RootAdmin";
import ExternalStorage from "./pages/ExternalStorage";
import AccessBlockedPage from "./pages/AccessBlocked";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SaasLicense from "./pages/SaasLicense";
import AIDisclaimer from "./pages/AIDisclaimer";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import UserManual from "./pages/UserManual";
import AIStatus from "./pages/admin/AIStatus";
import AIPrompts from "./pages/admin/AIPrompts";
import AILogs from "./pages/admin/AILogs";
import AISettings from "./pages/admin/AISettings";
import AIRadar from "./pages/admin/AIRadar";
import AIMonitoring from "./pages/admin/AIMonitoring";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { accessStatus, isSuperAdmin, licenseValid, loading: accessLoading } = useAccessControl();

  if (loading || accessLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  // Superadmin always has access
  if (isSuperAdmin) return <>{children}</>;

  // Check access status
  if (accessStatus && accessStatus !== "active") {
    return <AccessBlockedPage status={accessStatus as "pending" | "paused" | "suspended" | "cancelled"} />;
  }

  // Check license validity
  if (!licenseValid) {
    return <AccessBlockedPage status="license_expired" />;
  }

  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isSuperAdmin, loading: accessLoading } = useAccessControl();

  if (loading || accessLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function isOAuthCallback(): boolean {
  return window.location.pathname.includes("/~oauth") ||
    window.location.hash.includes("id_token") ||
    window.location.search.includes("code=");
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  // Don't redirect during OAuth callback - let Login.tsx process the tokens first
  if (user && !isOAuthCallback()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/cases" element={<ProtectedRoute><Cases /></ProtectedRoute>} />
            <Route path="/cases/new" element={<ProtectedRoute><NewCase /></ProtectedRoute>} />
            <Route path="/cases/:id" element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/writing-style" element={<ProtectedRoute><WritingStyle /></ProtectedRoute>} />
            <Route path="/partners" element={<ProtectedRoute><Partners /></ProtectedRoute>} />
            <Route path="/intake" element={<ProtectedRoute><Intake /></ProtectedRoute>} />
            <Route path="/settings/storage" element={<ProtectedRoute><ExternalStorage /></ProtectedRoute>} />
            <Route path="/manual" element={<ProtectedRoute><UserManual /></ProtectedRoute>} />
            <Route path="/root-admin" element={<SuperAdminRoute><RootAdmin /></SuperAdminRoute>} />
            <Route path="/admin" element={<SuperAdminRoute><AIMonitoring /></SuperAdminRoute>} />
            <Route path="/admin/ai/status" element={<SuperAdminRoute><AIStatus /></SuperAdminRoute>} />
            <Route path="/admin/prompts" element={<SuperAdminRoute><AIPrompts /></SuperAdminRoute>} />
            <Route path="/admin/ai/logs" element={<SuperAdminRoute><AILogs /></SuperAdminRoute>} />
            <Route path="/admin/ai/settings" element={<SuperAdminRoute><AISettings /></SuperAdminRoute>} />
            <Route path="/admin/radar" element={<SuperAdminRoute><AIRadar /></SuperAdminRoute>} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/saas-license" element={<SaasLicense />} />
            <Route path="/ai-disclaimer" element={<AIDisclaimer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
