const AUTH_KEY = "agendapro.auth";

export const storage = {
  getAuthToken: () => localStorage.getItem(AUTH_KEY),
  setAuthToken: (token: string) => localStorage.setItem(AUTH_KEY, token),
  clearAuthToken: () => localStorage.removeItem(AUTH_KEY),
  clearSession: () => localStorage.removeItem(AUTH_KEY),
};
