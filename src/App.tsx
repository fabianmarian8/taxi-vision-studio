import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RegionPage from "./pages/RegionPage";
import CityPage from "./pages/CityPage";
import TaxiServicePage from "./pages/TaxiServicePage";
import NotFound from "./pages/NotFound";
import TaxiScraperTool from "./components/TaxiScraperTool";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEditCity from "./pages/AdminEditCity";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/scraper" element={<TaxiScraperTool />} />
          {/* Legal pages */}
          <Route path="/ochrana-sukromia" element={<PrivacyPolicy />} />
          <Route path="/podmienky-pouzivania" element={<TermsOfUse />} />
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/edit/:citySlug" element={<AdminEditCity />} />
          {/* Region routes - SEO optimized pages for each region */}
          <Route path="/kraj/:regionSlug" element={<RegionPage />} />
          {/* City routes - SEO optimized pages for each city */}
          <Route path="/taxi/:citySlug" element={<CityPage />} />
          {/* Individual taxi service pages - SEO optimized for each service */}
          <Route path="/taxi/:citySlug/:serviceSlug" element={<TaxiServicePage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
