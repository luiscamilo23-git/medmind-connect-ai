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
import SmartNotes from "./pages/SmartNotes";
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
import Referrals from "./pages/Referrals";
import Comparison from "./pages/Comparison";
import BillingServices from "./pages/billing/BillingServices";
import BillingInvoices from "./pages/billing/BillingInvoices";
import BillingRIPS from "./pages/billing/BillingRIPS";
import BillingPayments from "./pages/billing/BillingPayments";
import BillingSettings from "./pages/billing/BillingSettings";
import BillingDIAN from "./pages/billing/BillingDIAN";
import BillingDIANMonitoring from "./pages/billing/BillingDIANMonitoring";
import ModeratorDashboard from "./pages/moderator/ModeratorDashboard";
import ModeratorAuditLogs from "./pages/moderator/ModeratorAuditLogs";
import ModeratorPatients from "./pages/moderator/ModeratorPatients";
import ModeratorRecords from "./pages/moderator/ModeratorRecords";
import ModeratorAppointments from "./pages/moderator/ModeratorAppointments";
import ModeratorInvoices from "./pages/moderator/ModeratorInvoices";
import ModeratorSocial from "./pages/moderator/ModeratorSocial";
import ModeratorUsers from "./pages/moderator/ModeratorUsers";
import ModeratorInventory from "./pages/moderator/ModeratorInventory";
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
          <Route path="/smart-notes" element={<SmartNotes />} />
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
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/billing/services" element={<BillingServices />} />
          <Route path="/billing/invoices" element={<BillingInvoices />} />
          <Route path="/billing/rips" element={<BillingRIPS />} />
          <Route path="/billing/payments" element={<BillingPayments />} />
          <Route path="/billing/settings" element={<BillingSettings />} />
          <Route path="/billing/dian" element={<BillingDIAN />} />
          <Route path="/billing/monitoring" element={<BillingDIANMonitoring />} />
          {/* Moderator Routes */}
          <Route path="/moderator" element={<ModeratorDashboard />} />
          <Route path="/moderator/patients" element={<ModeratorPatients />} />
          <Route path="/moderator/records" element={<ModeratorRecords />} />
          <Route path="/moderator/appointments" element={<ModeratorAppointments />} />
          <Route path="/moderator/voice-notes" element={<ModeratorRecords />} />
          <Route path="/moderator/notes" element={<ModeratorRecords />} />
          <Route path="/moderator/inventory" element={<ModeratorInventory />} />
          <Route path="/moderator/scheduler" element={<ModeratorAppointments />} />
          <Route path="/moderator/analytics" element={<ModeratorDashboard />} />
          <Route path="/moderator/predictive" element={<ModeratorDashboard />} />
          <Route path="/moderator/intelligence" element={<ModeratorDashboard />} />
          <Route path="/moderator/billing/services" element={<ModeratorInvoices />} />
          <Route path="/moderator/billing/invoices" element={<ModeratorInvoices />} />
          <Route path="/moderator/billing/rips" element={<ModeratorInvoices />} />
          <Route path="/moderator/billing/payments" element={<ModeratorInvoices />} />
          <Route path="/moderator/billing/dian" element={<ModeratorInvoices />} />
          <Route path="/moderator/social" element={<ModeratorSocial />} />
          <Route path="/moderator/chats" element={<ModeratorSocial />} />
          <Route path="/moderator/reviews" element={<ModeratorSocial />} />
          <Route path="/moderator/users" element={<ModeratorUsers />} />
          <Route path="/moderator/settings" element={<ModeratorUsers />} />
          <Route path="/moderator/audit-logs" element={<ModeratorAuditLogs />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
