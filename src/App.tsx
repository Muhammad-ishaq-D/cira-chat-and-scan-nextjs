import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
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
import Onboarding from "./pages/Onboarding.tsx";
import FreeChat from "./pages/FreeChat.tsx";
import Profile from "./pages/Profile.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import Privacy from "./pages/Privacy.tsx";
import HowItWorks from "./pages/HowItWorks.tsx";
import Technology from "./pages/Technology.tsx";
import Terms from "./pages/Terms.tsx";
import AdminLogin from "./admin/AdminLogin.tsx";
import AdminLayout from "./admin/AdminLayout.tsx";
import AdminOverview from "./admin/AdminOverview.tsx";
import AdminUsers from "./admin/AdminUsers.tsx";
import AdminBilling from "./admin/AdminBilling.tsx";
import AdminAnalytics from "./admin/AdminAnalytics.tsx";
import AdminSettings from "./admin/AdminSettings.tsx";
import AdminBlogs from "./admin/AdminBlogs.tsx";
import AdminActivity from "./admin/AdminActivity.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import RouteTracker from "./components/RouteTracker.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
          <Route path="/our-story" element={<OurStory />} />
          <Route path="/free-chat" element={<FreeChat />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/technology" element={<Technology />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          {/* Protected user routes */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
          <Route path="/vitals-scan" element={<VitalsScan />} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/payment-history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
          {/* Doctor page removed — using Air Doctor referral link instead */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminOverview />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/billing" element={<AdminBilling />} />
            <Route path="/admin/blogs" element={<AdminBlogs />} />
            <Route path="/admin/activity" element={<AdminActivity />} />
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
