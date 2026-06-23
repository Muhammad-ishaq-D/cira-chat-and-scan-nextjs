import { useEffect } from "react";
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
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
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
import WhatCiraHelpsWith from "./pages/WhatCiraHelpsWith.tsx";
import SymptomChecker from "./pages/SymptomChecker.tsx";
import Pricing from "./pages/Pricing.tsx";
import RealDoctors from "./pages/RealDoctors.tsx";
import Terms from "./pages/Terms.tsx";
import PrescriptionRefill from "./pages/PrescriptionRefill.tsx";
import ReferralLetter from "./pages/ReferralLetter.tsx";
import Refund from "./pages/Refund.tsx";
import DashboardRefund from "./pages/DashboardRefund.tsx";
import AdminLogin from "./admin/AdminLogin.tsx";
import AdminLayout from "./admin/AdminLayout.tsx";
import AdminOverview from "./admin/AdminOverview.tsx";
import AdminUsers from "./admin/AdminUsers.tsx";
import AdminBilling from "./admin/AdminBilling.tsx";
import AdminAnalytics from "./admin/AdminAnalytics.tsx";
import AdminSettings from "./admin/AdminSettings.tsx";
import AdminBlogs from "./admin/AdminBlogs.tsx";
import AdminActivity from "./admin/AdminActivity.tsx";
import AdminPrescriptionRefills from "./admin/AdminPrescriptionRefills.tsx";
import AdminReferralLetters from "./admin/AdminReferralLetters.tsx";
import AdminDoctors from "./admin/AdminDoctors.tsx";
import DoctorLogin from "./doctor/DoctorLogin.tsx";
import DoctorLayout from "./doctor/DoctorLayout.tsx";
import DoctorProtectedRoute from "./doctor/DoctorProtectedRoute.tsx";
import DoctorOverview from "./doctor/DoctorOverview.tsx";
import DoctorPendingRefills from "./doctor/DoctorPendingRefills.tsx";
import DoctorReviewedRefills from "./doctor/DoctorReviewedRefills.tsx";
import DoctorProfile from "./doctor/DoctorProfile.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import RouteTracker from "./components/RouteTracker.tsx";
import SecurityDeterrents from "./components/SecurityDeterrents.tsx";
import InactivityTimeout from "./components/InactivityTimeout.tsx";


const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // NOTE: We intentionally do NOT prefetch /wasm/shenai_sdk.wasm here.
    // On production (askainurse.com) the path is only resolvable via the COI
    // service worker. An early page-level fetch races the SW activation and
    // hits raw nginx — producing a 404 in the console. The SDK loads the WASM
    // on first scan; users hovering the "Scan" CTA in pages/Index.tsx trigger
    // a warm fetch at a moment when the SW is reliably active.
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
      <Sonner />
      <SecurityDeterrents />
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="ai-sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <BrowserRouter>
        <RouteTracker />
        <InactivityTimeout />
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
          <Route path="/what-cira-helps-with" element={<WhatCiraHelpsWith />} />
          <Route path="/symptom-checker" element={<SymptomChecker />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/real-doctors" element={<RealDoctors />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/prescription-refill" element={<PrescriptionRefill />} />
          <Route path="/referral-letter" element={<ReferralLetter />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/dashboard/prescription-refill/refund" element={<ProtectedRoute><DashboardRefund /></ProtectedRoute>} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          {/* Protected user routes */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
          <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
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
            <Route path="/admin/prescription-refills" element={<AdminPrescriptionRefills />} />
            <Route path="/admin/referral-letters" element={<AdminReferralLetters />} />
            <Route path="/admin/doctors" element={<AdminDoctors />} />
          </Route>
          {/* Doctor Portal */}
          <Route path="/doctor" element={<DoctorLogin />} />
          <Route path="/doctor/login" element={<DoctorLogin />} />
          <Route element={<DoctorProtectedRoute><DoctorLayout /></DoctorProtectedRoute>}>
            <Route path="/doctor/dashboard" element={<DoctorOverview />} />
            <Route path="/doctor/pending" element={<DoctorPendingRefills />} />
            <Route path="/doctor/history" element={<DoctorReviewedRefills />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
