import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { InstallPrompt } from "./components/InstallPrompt";
import { AnalyticsProvider } from "./components/AnalyticsProvider";
import { useLenis } from "./hooks/useLenis";
import { preloadTomorrowLiveGlobeRuntime } from "./components/opportunities/live/globeRuntime";
import { AdminDashboardErrorBoundary } from "./components/admin/AdminDashboardErrorBoundary";
import { ClientAuthGuard } from "./components/auth/ClientAuthGuard";

const Explorar = lazyWithRetry(() => import("./pages/Explorar"));
const Nacional = lazyWithRetry(() => import("./pages/Nacional"));
const Internacional = lazyWithRetry(() => import("./pages/Internacional"));
const DestinationDetail = lazyWithRetry(() => import("./pages/DestinationDetail"));
const PromocaoDetail = lazyWithRetry(() => import("./pages/PromocaoDetail"));
const Ofertas = lazyWithRetry(() => import("./pages/Ofertas"));
const Teo = lazyWithRetry(() => import("./pages/Teo"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const ClientLogin = lazyWithRetry(() => import("./pages/ClientLogin"));
const ClientSignUp = lazyWithRetry(() => import("./pages/ClientSignUp"));
const ClientForgotPassword = lazyWithRetry(() => import("./pages/ClientForgotPassword"));
const ClientResetPassword = lazyWithRetry(() => import("./pages/ClientResetPassword"));
const ClientDashboard = lazyWithRetry(() => import("./pages/ClientDashboard"));
const MyTomorrowDashboard = lazyWithRetry(() => import("./pages/MyTomorrowDashboard"));
const MyTomorrowTrips = lazyWithRetry(() => import("./pages/MyTomorrowTrips"));
const MyTomorrowTripDetail = lazyWithRetry(() => import("./pages/MyTomorrowTripDetail"));
const MyTomorrowProfile = lazyWithRetry(() => import("./pages/MyTomorrowProfile"));
const MyTomorrowPreferences = lazyWithRetry(() => import("./pages/MyTomorrowPreferences"));
const MyTomorrowRadars = lazyWithRetry(() => import("./pages/MyTomorrowRadars"));
const MyTomorrowRadarDetail = lazyWithRetry(() => import("./pages/MyTomorrowRadarDetail"));
const Install = lazyWithRetry(() => import("./pages/Install"));
const Avaliacao = lazyWithRetry(() => import("./pages/Avaliacao"));
const Blog = lazyWithRetry(() => import("./pages/Blog"));
const Experiencia = lazyWithRetry(() => import("./pages/Experiencia"));
const OpportunitiesCatalog = lazyWithRetry(() => import("./pages/OpportunitiesCatalog"));
const OpportunitiesCalendar = lazyWithRetry(() => import("./pages/OpportunitiesCalendar"));
const OpportunitiesLive = lazyWithRetry(() => import("./pages/OpportunitiesLive"));
const OpportunityDetail = lazyWithRetry(() => import("./pages/OpportunityDetail"));
const OpportunityCompare = lazyWithRetry(() => import("./pages/OpportunityCompare"));
const OpportunitySelection = lazyWithRetry(() => import("./pages/OpportunitySelection"));
const TravelAdvisorChat = lazyWithRetry(() => import("./components/TravelAdvisorChat").then((module) => ({ default: module.TravelAdvisorChat })));

if (typeof window !== "undefined") {
  window.localStorage.setItem("tomorrow-live-realtime-voice", "verse");
  if (window.location.pathname === "/oportunidades/live") void preloadTomorrowLiveGlobeRuntime();
}

const queryClient = new QueryClient();

const SmoothScroll = () => {
  useLenis();
  return null;
};

const PageSuspense = ({ children, label, opportunities = false }: { children: ReactNode; label: string; opportunities?: boolean }) => (
  <Suspense fallback={<div className={opportunities ? "min-h-screen bg-[#041012]" : "min-h-screen bg-background"} aria-label={`Carregando ${label}`} />}>
    {children}
  </Suspense>
);

const ClientProtected = ({ children, label }: { children: ReactNode; label: string }) => (
  <ClientAuthGuard><PageSuspense label={label}>{children}</PageSuspense></ClientAuthGuard>
);

const FloatingButtons = () => {
  const location = useLocation();
  const hideOnRoutes = ['/cliente', '/minha-area', '/admin', '/admin/dashboard', '/avaliacao', '/experiencia', '/oportunidades'];
  const shouldHide = hideOnRoutes.some(route => location.pathname.startsWith(route));
  if (shouldHide) return null;
  return <Suspense fallback={null}><TravelAdvisorChat /></Suspense>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SmoothScroll />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/explorar" element={<PageSuspense label="explorar"><Explorar /></PageSuspense>} />
          <Route path="/nacional" element={<PageSuspense label="destinos nacionais"><Nacional /></PageSuspense>} />
          <Route path="/internacional" element={<PageSuspense label="destinos internacionais"><Internacional /></PageSuspense>} />
          <Route path="/destino/:id" element={<PageSuspense label="destino"><DestinationDetail /></PageSuspense>} />
          <Route path="/promocao/:id" element={<PageSuspense label="promoção"><PromocaoDetail /></PageSuspense>} />
          <Route path="/ofertas" element={<PageSuspense label="ofertas"><Ofertas /></PageSuspense>} />
          <Route path="/teo" element={<PageSuspense label="Téo"><Teo /></PageSuspense>} />
          <Route path="/admin" element={<PageSuspense label="administração"><Admin /></PageSuspense>} />
          <Route path="/admin/dashboard" element={<AdminDashboardErrorBoundary><PageSuspense label="painel administrativo"><AdminDashboard /></PageSuspense></AdminDashboardErrorBoundary>} />
          <Route path="/cliente" element={<PageSuspense label="acesso do cliente"><ClientLogin /></PageSuspense>} />
          <Route path="/cliente/criar-conta" element={<PageSuspense label="criação de conta"><ClientSignUp /></PageSuspense>} />
          <Route path="/cliente/esqueci-senha" element={<PageSuspense label="recuperação de senha"><ClientForgotPassword /></PageSuspense>} />
          <Route path="/cliente/redefinir-senha" element={<PageSuspense label="redefinição de senha"><ClientResetPassword /></PageSuspense>} />
          <Route path="/minha-area" element={<ClientProtected label="My Tomorrow"><MyTomorrowDashboard /></ClientProtected>} />
          <Route path="/minha-area/viagens" element={<ClientProtected label="minhas viagens"><MyTomorrowTrips /></ClientProtected>} />
          <Route path="/minha-area/viagens/:tripId" element={<ClientProtected label="viagem"><MyTomorrowTripDetail /></ClientProtected>} />
          <Route path="/minha-area/perfil" element={<ClientProtected label="Travel Profile"><MyTomorrowProfile /></ClientProtected>} />
          <Route path="/minha-area/preferencias" element={<ClientProtected label="preferências de viagem"><MyTomorrowPreferences /></ClientProtected>} />
          <Route path="/minha-area/radares" element={<ClientProtected label="meus radares"><MyTomorrowRadars /></ClientProtected>} />
          <Route path="/minha-area/radares/:radarId" element={<ClientProtected label="radar"><MyTomorrowRadarDetail /></ClientProtected>} />
          <Route path="/minha-area/operacional" element={<ClientProtected label="detalhes operacionais"><ClientDashboard /></ClientProtected>} />
          <Route path="/avaliacao/:id" element={<PageSuspense label="avaliação"><Avaliacao /></PageSuspense>} />
          <Route path="/install" element={<PageSuspense label="instalação"><Install /></PageSuspense>} />
          <Route path="/blog" element={<PageSuspense label="blog"><Blog /></PageSuspense>} />
          <Route path="/experiencia" element={<PageSuspense label="experiência"><Experiencia /></PageSuspense>} />
          <Route path="/oportunidades" element={<Navigate to="/oportunidades/catalogo" replace />} />
          <Route path="/oportunidades/catalogo" element={<PageSuspense label="catálogo" opportunities><OpportunitiesCatalog /></PageSuspense>} />
          <Route path="/oportunidades/live" element={<PageSuspense label="Tomorrow Live" opportunities><OpportunitiesLive /></PageSuspense>} />
          <Route path="/oportunidades/calendario" element={<PageSuspense label="calendário" opportunities><OpportunitiesCalendar /></PageSuspense>} />
          <Route path="/oportunidades/oferta/:id" element={<PageSuspense label="oportunidade" opportunities><OpportunityDetail /></PageSuspense>} />
          <Route path="/oportunidades/comparar" element={<PageSuspense label="comparação" opportunities><OpportunityCompare /></PageSuspense>} />
          <Route path="/oportunidades/selecao/:token" element={<PageSuspense label="seleção de oportunidades" opportunities><OpportunitySelection /></PageSuspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AnalyticsProvider />
        <InstallPrompt />
        <FloatingButtons />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
