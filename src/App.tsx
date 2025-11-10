import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import VoiceNotes from "./pages/VoiceNotes";
import Patients from "./pages/Patients";
import SmartScheduler from "./pages/SmartScheduler";
import SupplyLens from "./pages/SupplyLens";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import SocialNetwork from "./pages/SocialNetwork";
import PredictiveAnalysis from "./pages/PredictiveAnalysis";
import PatientDashboard from "./pages/patient/PatientDashboard";
import DoctorExplorer from "./pages/patient/DoctorExplorer";
import PatientWellness from "./pages/patient/PatientWellness";
import PatientFeed from "./pages/patient/PatientFeed";
import PatientChat from "./pages/patient/PatientChat";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import LegalNotice from "./pages/LegalNotice";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/voicenotes" element={<VoiceNotes />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/scheduler" element={<SmartScheduler />} />
          <Route path="/supplylens" element={<SupplyLens />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/predictive" element={<PredictiveAnalysis />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/social" element={<SocialNetwork />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/explore" element={<DoctorExplorer />} />
          <Route path="/patient/wellness" element={<PatientWellness />} />
          <Route path="/patient/feed" element={<PatientFeed />} />
          <Route path="/patient/chat" element={<PatientChat />} />
          <Route path="/patient/appointments" element={<PatientAppointments />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/legal-notice" element={<LegalNotice />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
