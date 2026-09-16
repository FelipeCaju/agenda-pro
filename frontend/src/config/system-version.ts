import appVersion from "../../app-version.json";

// Altere somente frontend/app-version.json ao preparar uma nova publicação.
// O mesmo arquivo também é lido pela compilação Android.
export const SYSTEM_VERSION = appVersion.version;
export const SYSTEM_UPDATED_AT = appVersion.updatedAt;
