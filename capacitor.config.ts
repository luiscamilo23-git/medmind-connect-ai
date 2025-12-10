import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a158c219bc0f468a9ff0baf8a381d069',
  appName: 'medmind-connect-ai',
  webDir: 'dist',
  server: {
    url: 'https://a158c219-bc0f-468a-9ff0-baf8a381d069.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: true,
      spinnerColor: '#22c55e'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a'
    }
  }
};

export default config;
