const AUTH_KEY = "agendapro.auth";

export const storage = {
  getAuthToken: () => localStorage.getItem(AUTH_KEY),
  setAuthToken: (token: string) => localStorage.setItem(AUTH_KEY, token),
  clearAuthToken: () => localStorage.removeItem(AUTH_KEY),
  clearSession: () => localStorage.removeItem(AUTH_KEY),
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
};
