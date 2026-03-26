import {
  requireActiveAuthenticatedContext,
  requireAuthenticatedContext,
  requirePlatformAdminContext,
} from "../services/auth.service.js";

function readToken(request) {
  const authorization = request.headers.authorization ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
}

export async function getRequestAuthContext(request) {
  return requireAuthenticatedContext(readToken(request));
}

export async function getRequestActiveAuthContext(request) {
  return requireActiveAuthenticatedContext(readToken(request));
}

export async function getRequestPlatformAdminContext(request) {
  return requirePlatformAdminContext(readToken(request));
}
