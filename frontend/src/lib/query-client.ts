import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { logDiagnosticError } from "@/utils/logger";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      logDiagnosticError("query_error", error, {
        queryKey: query.queryKey,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      logDiagnosticError("mutation_error", error, {
        mutationKey: mutation.options.mutationKey ?? null,
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
      throwOnError: false,
    },
    mutations: {
      throwOnError: false,
    },
  },
});
