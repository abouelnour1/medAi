
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pharmasource.ksa',
  appName: 'PharmaSource KSA',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: ['*']
  },
  plugins: {
    Keyboard: {
      resize: 'none',
      style: 'dark',
      resizeOnFullScreen: false,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#0f766e'
    }
  }
};

export default config;
