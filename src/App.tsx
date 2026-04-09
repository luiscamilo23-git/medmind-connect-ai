import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages
const Landing = React.lazy(() => import("./pages/Landing"));
const Auth = React.lazy(() => import("./pages/Auth"));
const Pricing = React.lazy(() => import("./pages/Pricing"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = React.lazy(() => import("./pages/CookiePolicy"));
const LegalNotice = React.lazy(() => import("./pages/LegalNotice"));
const Comparison = React.lazy(() => import("./pages/Comparison"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Doctor pages
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const VoiceNotes = React.lazy(() => import("./pages/VoiceNotes"));
const SmartNotes = React.lazy(() => import("./pages/SmartNotes"));
const MyAgentAI = React.lazy(() => import("./pages/MyAgentAI"));
const Patients = React.lazy(() => import("./pages/Patients"));
const SmartScheduler = React.lazy(() => import("./pages/SmartScheduler"));
const SupplyLens = React.lazy(() => import("./pages/SupplyLens"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const PredictiveAnalysis = React.lazy(() => import("./pages/PredictiveAnalysis"));
const Profile = React.lazy(() => import("./pages/Profile"));
const DoctorSettings = React.lazy(() => import("./pages/DoctorSettings"));
const SecretaryManagement = React.lazy(() => import("./pages/SecretaryManagement"));
const SocialNetwork = React.lazy(() => import("./pages/SocialNetwork"));
const Referrals = React.lazy(() => import("./pages/Referrals"));

// Patient pages
const PatientDashboard = React.lazy(() => import("./pages/patient/PatientDashboard"));
const DoctorExplorer = React.lazy(() => import("./pages/patient/DoctorExplorer"));
const PatientWellness = React.lazy(() => import("./pages/patient/PatientWellness"));
const PatientFeed = React.lazy(() => import("./pages/patient/PatientFeed"));
const PatientChat = React.lazy(() => import("./pages/patient/PatientChat"));
const PatientAppointments = React.lazy(() => import("./pages/patient/PatientAppointments"));
const PatientPQRS = React.lazy(() => import("./pages/patient/PatientPQRS"));
const PatientAuthorizations = React.lazy(() => import("./pages/patient/PatientAuthorizations"));

// Legal compliance pages (doctor)
const PQRS = React.lazy(() => import("./pages/PQRS"));
const DataSecurity = React.lazy(() => import("./pages/DataSecurity"));

// Public utility pages
const ConfirmAppointment = React.lazy(() => import("./pages/ConfirmAppointment"));

// Billing pages
const BillingServices = React.lazy(() => import("./pages/billing/BillingServices"));
const Subscription = React.lazy(() => import("./pages/billing/Subscription"));
const BillingInvoices = React.lazy(() => import("./pages/billing/BillingInvoices"));
const BillingRIPS = React.lazy(() => import("./pages/billing/BillingRIPS"));
const BillingPayments = React.lazy(() => import("./pages/billing/BillingPayments"));
const BillingSettings = React.lazy(() => import("./pages/billing/BillingSettings"));
const BillingDIAN = React.lazy(() => import("./pages/billing/BillingDIAN"));
const BillingDIANMonitoring = React.lazy(() => import("./pages/billing/BillingDIANMonitoring"));

// Secretary pages
const SecretaryDashboard = React.lazy(() => import("./pages/SecretaryDashboard"));

const ClinicalImpact = React.lazy(() => import("./pages/ClinicalImpact"));

// MedMind Edu — solo el portal (vision, sin simulador ni rotación)
const StudentPortal = React.lazy(() => import("./pages/student/StudentPortal"));

// Moderator pages
const ModeratorDashboard = React.lazy(() => import("./pages/moderator/ModeratorDashboard"));
const ModeratorAuditLogs = React.lazy(() => import("./pages/moderator/ModeratorAuditLogs"));
const ModeratorPatients = React.lazy(() => import("./pages/moderator/ModeratorPatients"));
const ModeratorRecords = React.lazy(() => import("./pages/moderator/ModeratorRecords"));
const ModeratorAppointments = React.lazy(() => import("./pages/moderator/ModeratorAppointments"));
const ModeratorInvoices = React.lazy(() => import("./pages/moderator/ModeratorInvoices"));
const ModeratorSocial = React.lazy(() => import("./pages/moderator/ModeratorSocial"));
const ModeratorUsers = React.lazy(() => import("./pages/moderator/ModeratorUsers"));
const ModeratorInventory = React.lazy(() => import("./pages/moderator/ModeratorInventory"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-10 h-10 text-primary animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/legal-notice" element={<LegalNotice />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/confirm/:token" element={<ConfirmAppointment />} />

            {/* MedMind Edu — portal de visión educativa */}
            <Route path="/student" element={<StudentPortal />} />

            {/* Doctor routes */}
            <Route path="/dashboard" element={<ProtectedRoute requiredRole="doctor"><Dashboard /></ProtectedRoute>} />
            <Route path="/voicenotes" element={<ProtectedRoute requiredRole="doctor"><VoiceNotes /></ProtectedRoute>} />
            <Route path="/smart-notes" element={<ProtectedRoute requiredRole="doctor"><SmartNotes /></ProtectedRoute>} />
            <Route path="/my-agent" element={<ProtectedRoute requiredRole="doctor"><MyAgentAI /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute requiredRole="doctor"><Patients /></ProtectedRoute>} />
            <Route path="/scheduler" element={<ProtectedRoute requiredRole="doctor"><SmartScheduler /></ProtectedRoute>} />
            <Route path="/supplylens" element={<ProtectedRoute requiredRole="doctor"><SupplyLens /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute requiredRole="doctor"><Analytics /></ProtectedRoute>} />
            <Route path="/predictive" element={<ProtectedRoute requiredRole="doctor"><PredictiveAnalysis /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute requiredRole="doctor"><Profile /></ProtectedRoute>} />
            <Route path="/doctor-settings" element={<ProtectedRoute requiredRole="doctor"><DoctorSettings /></ProtectedRoute>} />
            <Route path="/secretary-management" element={<ProtectedRoute requiredRole="doctor"><SecretaryManagement /></ProtectedRoute>} />
            <Route path="/social" element={<ProtectedRoute requiredRole="doctor"><SocialNetwork /></ProtectedRoute>} />
            <Route path="/referrals" element={<ProtectedRoute requiredRole="doctor"><Referrals /></ProtectedRoute>} />
            <Route path="/pqrs" element={<ProtectedRoute requiredRole="doctor"><PQRS /></ProtectedRoute>} />
            <Route path="/data-security" element={<ProtectedRoute requiredRole="doctor"><DataSecurity /></ProtectedRoute>} />
            <Route path="/clinical-impact" element={<ProtectedRoute requiredRole="doctor"><ClinicalImpact /></ProtectedRoute>} />

            {/* Patient routes */}
            <Route path="/patient/dashboard" element={<ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>} />
            <Route path="/patient/explore" element={<ProtectedRoute requiredRole="patient"><DoctorExplorer /></ProtectedRoute>} />
            <Route path="/patient/wellness" element={<ProtectedRoute requiredRole="patient"><PatientWellness /></ProtectedRoute>} />
            <Route path="/patient/feed" element={<ProtectedRoute requiredRole="patient"><PatientFeed /></ProtectedRoute>} />
            <Route path="/patient/chat" element={<ProtectedRoute requiredRole="patient"><PatientChat /></ProtectedRoute>} />
            <Route path="/patient/appointments" element={<ProtectedRoute requiredRole="patient"><PatientAppointments /></ProtectedRoute>} />
            <Route path="/patient/pqrs" element={<ProtectedRoute requiredRole="patient"><PatientPQRS /></ProtectedRoute>} />
            <Route path="/patient/authorizations" element={<ProtectedRoute requiredRole="patient"><PatientAuthorizations /></ProtectedRoute>} />

            {/* Billing routes */}
            <Route path="/billing/subscription" element={<ProtectedRoute requiredRole="doctor"><Subscription /></ProtectedRoute>} />
            <Route path="/billing/services" element={<ProtectedRoute requiredRole="doctor"><BillingServices /></ProtectedRoute>} />
            <Route path="/billing/invoices" element={<ProtectedRoute requiredRole="doctor"><BillingInvoices /></ProtectedRoute>} />
            <Route path="/billing/rips" element={<ProtectedRoute requiredRole="doctor"><BillingRIPS /></ProtectedRoute>} />
            <Route path="/billing/payments" element={<ProtectedRoute requiredRole="doctor"><BillingPayments /></ProtectedRoute>} />
            <Route path="/billing/settings" element={<ProtectedRoute requiredRole="doctor"><BillingSettings /></ProtectedRoute>} />
            <Route path="/billing/dian" element={<ProtectedRoute requiredRole="doctor"><BillingDIAN /></ProtectedRoute>} />
            <Route path="/billing/monitoring" element={<ProtectedRoute requiredRole="doctor"><BillingDIANMonitoring /></ProtectedRoute>} />

            {/* Secretary routes */}
            <Route path="/secretary/dashboard" element={<ProtectedRoute requiredRole="secretaria"><SecretaryDashboard /></ProtectedRoute>} />

            {/* Moderator routes */}
            <Route path="/moderator" element={<ProtectedRoute requiredRole="admin"><ModeratorDashboard /></ProtectedRoute>} />
            <Route path="/moderator/patients" element={<ProtectedRoute requiredRole="admin"><ModeratorPatients /></ProtectedRoute>} />
            <Route path="/moderator/records" element={<ProtectedRoute requiredRole="admin"><ModeratorRecords /></ProtectedRoute>} />
            <Route path="/moderator/appointments" element={<ProtectedRoute requiredRole="admin"><ModeratorAppointments /></ProtectedRoute>} />
            <Route path="/moderator/inventory" element={<ProtectedRoute requiredRole="admin"><ModeratorInventory /></ProtectedRoute>} />
            <Route path="/moderator/invoices" element={<ProtectedRoute requiredRole="admin"><ModeratorInvoices /></ProtectedRoute>} />
            <Route path="/moderator/social" element={<ProtectedRoute requiredRole="admin"><ModeratorSocial /></ProtectedRoute>} />
            <Route path="/moderator/users" element={<ProtectedRoute requiredRole="admin"><ModeratorUsers /></ProtectedRoute>} />
            <Route path="/moderator/audit-logs" element={<ProtectedRoute requiredRole="admin"><ModeratorAuditLogs /></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
