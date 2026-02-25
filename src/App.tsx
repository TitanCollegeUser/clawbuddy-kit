import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AiSettingsProvider } from "@/contexts/AiSettingsContext";
import { AgentNamesProvider } from "@/contexts/AgentNamesContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { BoardPage } from "@/pages/BoardPage";

import { QuestionsPage } from "@/pages/QuestionsPage";
import { LogPage } from "@/pages/LogPage";
import { SkillsPage } from "@/pages/SkillsPage";
import { SkillFactoryPage } from "@/pages/SkillFactoryPage";
import { GoalsLabPage } from "@/pages/GoalsLabPage";
import { IdentityPage } from "@/pages/IdentityPage";
import { AgentIdentityPage } from "@/pages/AgentIdentityPage";
import { SubAgentsPage } from "@/pages/SubAgentsPage";
import { SubAgentDetailPage } from "@/pages/SubAgentDetailPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { OfficePage } from "@/pages/OfficePage";
import { OfficeWorkPage } from "@/pages/OfficeWorkPage";
import { ArenaPage } from "@/pages/ArenaPage";
import { BoilerRoomPage } from "@/pages/BoilerRoomPage";

import { SkillFactoryPage2 } from "@/pages/SkillFactoryPage2";
import { SkillDetailPage } from "@/pages/SkillDetailPage";
import { ClaudeCodeSkillEditor } from "@/components/skills/ClaudeCodeSkillEditor";
import { OpsCenterPage } from "@/pages/OpsCenterPage";
import { OpsAppPage } from "@/pages/OpsAppPage";
import { AutomationsPage } from "@/pages/AutomationsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AiSettingsProvider>
          <AgentNamesProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/board" element={<BoardPage />} />
                <Route path="/goals" element={<GoalsLabPage />} />
                <Route path="/identity" element={<IdentityPage />} />
                <Route path="/identity/:agentId" element={<AgentIdentityPage />} />
                
                <Route path="/log" element={<LogPage />} />
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/skills" element={<SkillsPage />} />
                <Route path="/skills/new" element={<SkillFactoryPage />} />
                <Route path="/skills/edit/:id" element={<SkillFactoryPage />} />
                <Route path="/skills/factory" element={<SkillFactoryPage2 />} />
                <Route path="/skills/factory/new" element={<ClaudeCodeSkillEditor />} />
                <Route path="/skills/factory/:id" element={<SkillDetailPage />} />
                <Route path="/sub-agents" element={<SubAgentsPage />} />
                <Route path="/sub-agents/:id" element={<SubAgentDetailPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/workspace" element={<WorkspacePage />} />
                <Route path="/workspace/office/:id" element={<OfficePage />} />
                <Route path="/workspace/office/:id/work" element={<OfficeWorkPage />} />
                <Route path="/workspace/arena/:id" element={<ArenaPage />} />
                <Route path="/workspace/boiler-room/:id" element={<BoilerRoomPage />} />
                {/* Meeting Intelligence route — available via module install */}
                <Route path="/ops-center" element={<OpsCenterPage />} />
                <Route path="/ops-center/:appName" element={<OpsAppPage />} />
                <Route path="/automations" element={<AutomationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AgentNamesProvider>
          </AiSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
