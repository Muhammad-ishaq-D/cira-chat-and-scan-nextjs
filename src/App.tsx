import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import OurStory from "./pages/OurStory.tsx";
import Login from "./pages/Login.tsx";
import Chat from "./pages/Chat.tsx";
import Upgrade from "./pages/Upgrade.tsx";
import VitalsScan from "./pages/VitalsScan.tsx";
import Reports from "./pages/Reports.tsx";
import PaymentHistory from "./pages/PaymentHistory.tsx";
import Doctor from "./pages/Doctor.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./admin/AdminLogin.tsx";
import AdminLayout from "./admin/AdminLayout.tsx";
import AdminOverview from "./admin/AdminOverview.tsx";
import AdminUsers from "./admin/AdminUsers.tsx";
import AdminBilling from "./admin/AdminBilling.tsx";
import AdminAnalytics from "./admin/AdminAnalytics.tsx";
import AdminSettings from "./admin/AdminSettings.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/our-story" element={<OurStory />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/vitals-scan" element={<VitalsScan />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/payment-history" element={<PaymentHistory />} />
          <Route path="/doctor" element={<Doctor />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminOverview />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/billing" element={<AdminBilling />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
