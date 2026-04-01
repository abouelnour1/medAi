
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.easydrug.ksa',
  appName: 'Easy Drug',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false,
    // لا تسمح بالـ navigation لروابط خارجية — تفتح في المتصفح الخارجي
    // هذا يمنع إعادة تحميل التطبيق عند الرجوع من Gemini
  },
  ios: {
    contentInset: 'automatic',   // يحسب safe area تلقائياً
    scrollEnabled: true,
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // false في production
  },
  plugins: {
    Keyboard: {
      resize: 'ionic',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#0f766e',
      overlaysWebView: false,
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
