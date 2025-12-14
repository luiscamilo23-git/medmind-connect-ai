-- Create moderator audit logs table
CREATE TABLE public.moderator_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  module text NOT NULL,
  record_id uuid,
  record_table text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.moderator_audit_logs ENABLE ROW LEVEL SECURITY;

-- Moderators can view audit logs
CREATE POLICY "Moderators can view all audit logs"
ON public.moderator_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.moderator_audit_logs
FOR INSERT
WITH CHECK (true);

-- Patients: Moderators can view all patients (read-only)
CREATE POLICY "Moderators can view all patients"
ON public.patients
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Medical Records: Moderators can view all (read-only)
CREATE POLICY "Moderators can view all medical records"
ON public.medical_records
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Appointments: Moderators can view all
CREATE POLICY "Moderators can view all appointments"
ON public.appointments
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Invoices: Moderators can view all
CREATE POLICY "Moderators can view all invoices"
ON public.invoices
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Invoice Items: Moderators can view all
CREATE POLICY "Moderators can view all invoice items"
ON public.invoice_items
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Services: Moderators can view all
CREATE POLICY "Moderators can view all services"
ON public.services
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Payments: Moderators can view all
CREATE POLICY "Moderators can view all payments"
ON public.payments
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- RIPS Batches: Moderators can view all
CREATE POLICY "Moderators can view all RIPS batches"
ON public.rips_batches
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- RIPS Records: Moderators can view all
CREATE POLICY "Moderators can view all RIPS records"
ON public.rips_records
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- RIPS Validation Logs: Moderators can view all
CREATE POLICY "Moderators can view all RIPS validation logs"
ON public.rips_validation_logs
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- DIAN Emission Logs: Moderators can view all
CREATE POLICY "Moderators can view all DIAN emission logs"
ON public.dian_emission_logs
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- DIAN Webhook Events: Moderators can view all
CREATE POLICY "Moderators can view all DIAN webhook events"
ON public.dian_webhook_events
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Inventory: Moderators can view all
CREATE POLICY "Moderators can view all inventory"
ON public.inventory
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Inventory Usage: Moderators can view all
CREATE POLICY "Moderators can view all inventory usage"
ON public.inventory_usage
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Voice Recordings: Moderators can view all
CREATE POLICY "Moderators can view all voice recordings"
ON public.voice_recordings
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Notes Analysis: Moderators can view all
CREATE POLICY "Moderators can view all notes analysis"
ON public.notes_analysis
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Posts: Moderators can view all (including unpublished)
CREATE POLICY "Moderators can view all posts"
ON public.posts
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Moderators can update posts (for moderation)
CREATE POLICY "Moderators can update posts"
ON public.posts
FOR UPDATE
USING (has_role(auth.uid(), 'moderator'));

-- Moderators can delete posts (for moderation)
CREATE POLICY "Moderators can delete posts"
ON public.posts
FOR DELETE
USING (has_role(auth.uid(), 'moderator'));

-- Post Comments: Moderators can view all
CREATE POLICY "Moderators can view all comments"
ON public.post_comments
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Moderators can delete comments
CREATE POLICY "Moderators can delete comments"
ON public.post_comments
FOR DELETE
USING (has_role(auth.uid(), 'moderator'));

-- Post Likes: Moderators can view all
CREATE POLICY "Moderators can view all likes"
ON public.post_likes
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Profiles: Moderators can view all
CREATE POLICY "Moderators can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- User Roles: Moderators can view all roles
CREATE POLICY "Moderators can view all user roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Doctor Reviews: Moderators can view all
CREATE POLICY "Moderators can view all doctor reviews"
ON public.doctor_reviews
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Moderators can delete reviews (moderation)
CREATE POLICY "Moderators can delete reviews"
ON public.doctor_reviews
FOR DELETE
USING (has_role(auth.uid(), 'moderator'));

-- Chat Rooms: Moderators can view all
CREATE POLICY "Moderators can view all chat rooms"
ON public.chat_rooms
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Chat Messages: Moderators can view all
CREATE POLICY "Moderators can view all chat messages"
ON public.chat_messages
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- AI Wellness Tips: Moderators can view all
CREATE POLICY "Moderators can view all wellness tips"
ON public.ai_wellness_tips
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Medical Documents: Moderators can view all
CREATE POLICY "Moderators can view all medical documents"
ON public.medical_documents
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Document Templates: Moderators can view all
CREATE POLICY "Moderators can view all document templates"
ON public.document_templates
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- API Configurations: Moderators can view
CREATE POLICY "Moderators can view all API configs"
ON public.api_configurations
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Payment Gateway Configs: Moderators can view
CREATE POLICY "Moderators can view all payment gateway configs"
ON public.payment_gateway_configs
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Payment Webhooks: Moderators can view all
CREATE POLICY "Moderators can view all payment webhooks"
ON public.payment_webhooks
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Patient Audit Logs: Moderators can view all
CREATE POLICY "Moderators can view all patient audit logs"
ON public.patient_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Doctor Questions: Moderators can view all
CREATE POLICY "Moderators can view all doctor questions"
ON public.doctor_questions
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Suggestion History: Moderators can view all
CREATE POLICY "Moderators can view all suggestion history"
ON public.suggestion_history
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Device Verifications: Moderators can view all
CREATE POLICY "Moderators can view all device verifications"
ON public.device_verifications
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

-- Create indexes for audit logs performance
CREATE INDEX idx_moderator_audit_logs_moderator ON public.moderator_audit_logs(moderator_id);
CREATE INDEX idx_moderator_audit_logs_module ON public.moderator_audit_logs(module);
CREATE INDEX idx_moderator_audit_logs_created ON public.moderator_audit_logs(created_at DESC);