import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAUpdatePrompt } from "@/components/shared/PWAUpdatePrompt";
// LandingPage do Atleta ID mantida para uso futuro se necessário
// import LandingPage from "./pages/LandingPage";

// Lazy load pages not needed on initial render
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const IndicacaoPage = lazy(() => import("./pages/IndicacaoPage"));
const ShortIndicacaoRedirect = lazy(() => import("./pages/ShortIndicacaoRedirect"));
const CarreiraLinkedinPage = lazy(() => import("./pages/carreira/CarreiraLinkedinPage"));
const CarreiraPerfilPage = lazy(() => import("./pages/carreira/CarreiraPerfilPage"));
const CarreiraExplorarPage = lazy(() => import("./pages/carreira/CarreiraExplorarPage"));
// Retrocompatibilidade com links antigos do Atleta ID
const AtletaIdLinkedinPage = lazy(() => import("./pages/atletaid/AtletaIdLinkedinPage"));
const AtletaIdPerfilPage = lazy(() => import("./pages/atletaid/AtletaIdPerfilPage"));
const EscolaPerfilPage = lazy(() => import("./pages/carreira/EscolaPerfilPage"));
const CarreiraCadastroPage = lazy(() => import("./pages/carreira/CarreiraCadastroPage"));
const PerfilPage = lazy(() => import("./pages/carreira/PerfilPage"));
const CarreiraLandingV2Page = lazy(() => import("./pages/carreira/CarreiraLandingV2Page"));
const CarreiraConexoesPage = lazy(() => import("./pages/carreira/CarreiraConexoesPage"));
const CarreiraGamerPage = lazy(() => import("./pages/carreira/CarreiraGamerPage"));
const CarreiraDescobrirPage = lazy(() => import("./pages/carreira/CarreiraDescobrirPage"));
const TermosPage = lazy(() => import("./pages/carreira/TermosPage"));
const PrivacidadePage = lazy(() => import("./pages/carreira/PrivacidadePage"));
const ContatoPage = lazy(() => import("./pages/carreira/ContatoPage"));
const CarreiraAdminDashboard = lazy(() => import("./pages/carreira/admin/CarreiraAdminDashboard"));
const CarreiraAdminPerfisPage = lazy(() => import("./pages/carreira/admin/CarreiraAdminPerfisPage"));
const CarreiraAdminPostsPage = lazy(() => import("./pages/carreira/admin/CarreiraAdminPostsPage"));
const CarreiraAdminAssinaturasPage = lazy(() => import("./pages/carreira/admin/CarreiraAdminAssinaturasPage"));
const CarreiraAdminAtividadesPage = lazy(() => import("./pages/carreira/admin/CarreiraAdminAtividadesPage"));
const CarreiraAdminGamificacaoPage = lazy(() => import("./pages/carreira/admin/CarreiraAdminGamificacaoPage"));
const CarreiraAdminPerformancePage = lazy(() => import("./pages/carreira/admin/CarreiraAdminPerformancePage"));
const CarreiraAdminModeracaoPage = lazy(() => import("./pages/carreira/admin/CarreiraAdminModeracaoPage"));
const ResetPasswordPage = lazy(() => import("./pages/carreira/ResetPasswordPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds - keeps data fresh, avoids refetch flash on navigation
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAUpdatePrompt />
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              {/* Carreira ID — rota principal */}
              <Route path="/" element={<CarreiraLandingV2Page />} />
              <Route path="/cadastro" element={<CarreiraCadastroPage />} />
              <Route path="/minha" element={<CarreiraLinkedinPage />} />
              <Route path="/feed" element={<CarreiraExplorarPage />} />
              <Route path="/explorar" element={<CarreiraExplorarPage />} /> {/* retrocompat */}
              <Route path="/conexoes" element={<CarreiraConexoesPage />} />
              <Route path="/gamer" element={<CarreiraGamerPage />} />
              <Route path="/descobrir" element={<CarreiraDescobrirPage />} />
              <Route path="/termos" element={<TermosPage />} />
              <Route path="/privacidade" element={<PrivacidadePage />} />
              <Route path="/contato" element={<ContatoPage />} />
              {/* Carreira ID — Admin */}
              <Route path="/carreira/admin" element={<CarreiraAdminDashboard />} />
              <Route path="/carreira/admin/perfis" element={<CarreiraAdminPerfisPage />} />
              <Route path="/carreira/admin/posts" element={<CarreiraAdminPostsPage />} />
              <Route path="/carreira/admin/assinaturas" element={<CarreiraAdminAssinaturasPage />} />
              <Route path="/carreira/admin/atividades" element={<CarreiraAdminAtividadesPage />} />
              <Route path="/carreira/admin/gamificacao" element={<CarreiraAdminGamificacaoPage />} />
              <Route path="/carreira/admin/performance" element={<CarreiraAdminPerformancePage />} />
              <Route path="/carreira/admin/moderacao" element={<CarreiraAdminModeracaoPage />} />
              <Route path="/perfil/:userId" element={<PerfilPage />} />
              <Route path="/escola/:slug" element={<EscolaPerfilPage />} />
              {/* Atleta ID / escolinhas — rotas secundárias */}
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/install" element={<InstallApp />} />
              <Route path="/indicacao" element={<IndicacaoPage />} />
              <Route path="/i" element={<ShortIndicacaoRedirect />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              {/* Perfil público por slug — deve ficar por último */}
              <Route path="/:slug" element={<CarreiraPerfilPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
