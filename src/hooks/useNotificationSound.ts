import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Hook para reproducir sonidos de notificación usando Web Audio API
export const useNotificationSound = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load sound preference from profile
  useEffect(() => {
    const loadPreference = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from('profiles')
        .select('notifications_sound_enabled')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setSoundEnabled(data.notifications_sound_enabled ?? true);
      }
    };

    loadPreference();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadPreference();
    });

    return () => subscription.unsubscribe();
  }, []);

  const playSound = useCallback((type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar según el tipo de sonido
      switch (type) {
        case 'success':
          // Sonido alegre ascendente (2 tonos)
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15); // E5
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3); // G5
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
          
        case 'warning':
          // Sonido de alerta (2 beeps)
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.25);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
          
        case 'error':
          // Sonido descendente (error)
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.4);
          break;
      }
    } catch (e) {
      console.log('Audio not supported:', e);
    }
  }, [soundEnabled]);

  return { playSound, soundEnabled };
};
