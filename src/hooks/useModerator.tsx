import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useModerator = () => {
  const [isModerator, setIsModerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkModeratorRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsModerator(false);
          setIsLoading(false);
          return;
        }

        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'moderator')
          .maybeSingle();

        setIsModerator(!!role);
      } catch (error) {
        console.error("Error checking moderator role:", error);
        setIsModerator(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkModeratorRole();
  }, []);

  const logAction = async (action: string, module: string, recordId?: string, recordTable?: string, details?: Record<string, unknown>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('moderator_audit_logs').insert([{
        moderator_id: session.user.id,
        action,
        module,
        record_id: recordId || null,
        record_table: recordTable || null,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
      }]);
    } catch (error) {
      console.error("Error logging moderator action:", error);
    }
  };

  return { isModerator, isLoading, logAction };
};
