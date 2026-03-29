import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.agendapro.app",
  appName: "AgendaPro",
  webDir: "dist",
  server: {
    androidScheme: "http",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#edf2fa",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff",
    },
    LocalNotifications: {
      iconColor: "#1d8cf8",
    },
  },
};

export default config;
