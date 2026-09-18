// Os valores vêm de config/version.php durante o build do Vite.
// app-version.json continua reservado para versionamento do app Android.
export const SYSTEM_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";
export const SYSTEM_BUILD = import.meta.env.VITE_APP_BUILD || "local";
export const SYSTEM_COMMIT = import.meta.env.VITE_BUILD_COMMIT || "";
export const SYSTEM_VERSION_LABEL = `Versão ${SYSTEM_VERSION} · Build ${SYSTEM_BUILD}${
  SYSTEM_COMMIT ? ` · ${SYSTEM_COMMIT}` : ""
}`;
