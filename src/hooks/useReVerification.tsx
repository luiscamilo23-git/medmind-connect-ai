import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const REVERIFICATION_DAYS = 30;

export const useReVerification = () => {
  const [needsVerification, setNeedsVerification] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const generateDeviceFingerprint = (): string => {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset().toString(),
      screen.colorDepth.toString(),
      screen.width + "x" + screen.height,
    ].join("|");

    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChecking(false);
        return;
      }

      const deviceFingerprint = generateDeviceFingerprint();

      const { data, error } = await supabase
        .from("device_verifications")
        .select("last_verified_at")
        .eq("user_id", user.id)
        .eq("device_fingerprint", deviceFingerprint)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking verification:", error);
        setChecking(false);
        return;
      }

      if (!data) {
        // First time on this device, needs verification
        setNeedsVerification(true);
      } else {
        // Check if verification is older than REVERIFICATION_DAYS
        const lastVerified = new Date(data.last_verified_at);
        const daysSinceVerification = Math.floor(
          (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceVerification >= REVERIFICATION_DAYS) {
          setNeedsVerification(true);
        }
      }
    } catch (error) {
      console.error("Error in verification check:", error);
    } finally {
      setChecking(false);
    }
  };

  const markAsVerified = () => {
    setNeedsVerification(false);
  };

  return { needsVerification, checking, markAsVerified, recheckVerification: checkVerificationStatus };
};
