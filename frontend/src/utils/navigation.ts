import type { Location } from "react-router-dom";

type NavigationState = {
  from?: string;
};

export function buildNavigationState(from: string) {
  return { from } satisfies NavigationState;
}

export function resolveBackPath(location: Location, fallbackPath: string) {
  const state = location.state as NavigationState | null;
  return typeof state?.from === "string" && state.from.trim() ? state.from : fallbackPath;
}
