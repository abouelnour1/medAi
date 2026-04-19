
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.easydrug.ksa',
  appName: 'Easy Drug',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.easydrug.ksa',   // hostname ثابت يمنع فتح روابط خارجية داخل الـ WebView
    cleartext: false,
    // الروابط الخارجية (Google OAuth وغيرها) تُفتح في المتصفح الخارجي تلقائياً
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#f7f9f6',
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#f7f9f6',
  },
  plugins: {
    Keyboard: {
      resize: 'ionic',
      style: 'light',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#f7f9f6',
      overlaysWebView: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f766e',
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'Default',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SocialLogin: {
      providers: {
        google: {
          webClientId: '568872568132-cg6f7ea60arn5tgkoq9dms0he053p7l6.apps.googleusercontent.com',
          androidClientId: '568872568132-m434n8ol4u5tk1k7ern3kevn6snge628.apps.googleusercontent.com',
        },
        facebook: false,
        apple: false,
        twitter: false
      }
    }
  }
};

export default config;
