import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ganeshseva.app',
  appName: 'Ganesh Seva',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#fffbf2',
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#fffbf2',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      android: {
        backgroundColor: '#fffbf2',
        image: 'splash',
        imageDensity: 1,
        scaleFactor: 1.0,
        showSpinner: false,
      },
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ff8411',
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_ganesh',
      iconColor: '#ff8411',
      sound: 'notification.wav',
    },
  },
};

export default config;
