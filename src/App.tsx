import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Explorar from "./pages/Explorar";
import Nacional from "./pages/Nacional";
import Internacional from "./pages/Internacional";
import DestinationDetail from "./pages/DestinationDetail";
import PromocaoDetail from "./pages/PromocaoDetail";
import Ofertas from "./pages/Ofertas";
import Teo from "./pages/Teo";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import ClientLogin from "./pages/ClientLogin";
import ClientDashboard from "./pages/ClientDashboard";
import Install from "./pages/Install";
import Avaliacao from "./pages/Avaliacao";
import NotFound from "./pages/NotFound";
import Blog from "./pages/Blog";
import Experiencia from "./pages/Experiencia";
import { InstallPrompt } from "./components/InstallPrompt";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import { TravelAdvisorChat } from "./components/TravelAdvisorChat";
import { AnalyticsProvider } from "./components/AnalyticsProvider";

const queryClient = new QueryClient();

// Floating buttons that hide on client/admin areas
const FloatingButtons = () => {
  const location = useLocation();
  const hideOnRoutes = ['/cliente', '/minha-area', '/admin', '/admin/dashboard', '/avaliacao', '/experiencia'];
  const shouldHide = hideOnRoutes.some(route => location.pathname.startsWith(route));
  
  if (shouldHide) return null;
  
  return (
    <>
      <FloatingWhatsApp />
      <TravelAdvisorChat />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/nacional" element={<Nacional />} />
          <Route path="/internacional" element={<Internacional />} />
          <Route path="/destino/:id" element={<DestinationDetail />} />
          <Route path="/promocao/:id" element={<PromocaoDetail />} />
          <Route path="/ofertas" element={<Ofertas />} />
          <Route path="/teo" element={<Teo />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/cliente" element={<ClientLogin />} />
          <Route path="/minha-area" element={<ClientDashboard />} />
          <Route path="/avaliacao/:id" element={<Avaliacao />} />
          <Route path="/install" element={<Install />} />
          <Route path="/blog" element={<Blog />} />
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
