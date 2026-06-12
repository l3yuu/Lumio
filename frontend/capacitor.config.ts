import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lumio.app',
  appName: 'Lumio',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
