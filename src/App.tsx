import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { InstallPrompt } from "./components/InstallPrompt";
import { AnalyticsProvider } from "./components/AnalyticsProvider";
import { useLenis } from "./hooks/useLenis";
import { preloadTomorrowLiveGlobeRuntime } from "./components/opportunities/live/globeRuntime";

const Explorar = lazy(() => import("./pages/Explorar"));
const Nacional = lazy(() => import("./pages/Nacional"));
const Internacional = lazy(() => import("./pages/Internacional"));
const DestinationDetail = lazy(() => import("./pages/DestinationDetail"));
const PromocaoDetail = lazy(() => import("./pages/PromocaoDetail"));
const Ofertas = lazy(() => import("./pages/Ofertas"));
const Teo = lazy(() => import("./pages/Teo"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ClientLogin = lazy(() => import("./pages/ClientLogin"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const Install = lazy(() => import("./pages/Install"));
const Avaliacao = lazy(() => import("./pages/Avaliacao"));
const Blog = lazy(() => import("./pages/Blog"));
const Experiencia = lazy(() => import("./pages/Experiencia"));
const OpportunitiesCatalog = lazy(() => import("./pages/OpportunitiesCatalog"));
const OpportunitiesCalendar = lazy(() => import("./pages/OpportunitiesCalendar"));
const OpportunitiesLive = lazy(() => import("./pages/OpportunitiesLive"));
const OpportunityDetail = lazy(() => import("./pages/OpportunityDetail"));
const OpportunityCompare = lazy(() => import("./pages/OpportunityCompare"));
const TravelAdvisorChat = lazy(() =>
  import("./components/TravelAdvisorChat").then((module) => ({ default: module.TravelAdvisorChat })),
);

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
  <Suspense
    fallback={
      <div
        className={opportunities ? "min-h-screen bg-[#041012]" : "min-h-screen bg-background"}
        aria-label={`Carregando ${label}`}
      />
    }
  >
    {children}
  </Suspense>
);

const FloatingButtons = () => {
  const location = useLocation();
  const hideOnRoutes = ['/cliente', '/minha-area', '/admin', '/admin/dashboard', '/avaliacao', '/experiencia', '/oportunidades'];
  const shouldHide = hideOnRoutes.some(route => location.pathname.startsWith(route));
  if (shouldHide) return null;
  return (
    <Suspense fallback={null}>
      <TravelAdvisorChat />
    </Suspense>
  );
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
          <Route path="/admin/dashboard" element={<PageSuspense label="painel administrativo"><AdminDashboard /></PageSuspense>} />
          <Route path="/cliente" element={<PageSuspense label="acesso do cliente"><ClientLogin /></PageSuspense>} />
          <Route path="/minha-area" element={<PageSuspense label="área do cliente"><ClientDashboard /></PageSuspense>} />
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
