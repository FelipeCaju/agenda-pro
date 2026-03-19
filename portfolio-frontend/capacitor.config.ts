import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.agendapro.app",
  appName: "AgendaPro",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
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
  },
};

export default config;
