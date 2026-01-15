import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Explorar from "./pages/Explorar";
import Nacional from "./pages/Nacional";
import Internacional from "./pages/Internacional";
import DestinationDetail from "./pages/DestinationDetail";
import PromocaoDetail from "./pages/PromocaoDetail";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import { InstallPrompt } from "./components/InstallPrompt";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import { TravelAdvisorChat } from "./components/TravelAdvisorChat";

const queryClient = new QueryClient();

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
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/install" element={<Install />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <InstallPrompt />
        <FloatingWhatsApp />
        <TravelAdvisorChat />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
