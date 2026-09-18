// A versão web é gerada pelo Vite a partir do commit do deploy.
// app-version.json continua reservado para versionamento do app Android.
export const SYSTEM_VERSION = import.meta.env.VITE_BUILD_COMMIT || "local";
export const SYSTEM_UPDATED_AT = import.meta.env.VITE_BUILD_DATE || "em desenvolvimento";
