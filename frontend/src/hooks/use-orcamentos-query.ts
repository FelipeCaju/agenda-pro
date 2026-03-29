import { useQuery } from "@tanstack/react-query";
import { orcamentoService } from "@/services/orcamentoService";

export const orcamentoKeys = {
  all: ["orcamentos"] as const,
  lists: () => [...orcamentoKeys.all, "list"] as const,
  list: () => [...orcamentoKeys.lists()] as const,
  details: () => [...orcamentoKeys.all, "detail"] as const,
  detail: (quoteId: string) => [...orcamentoKeys.details(), quoteId] as const,
};

export function useOrcamentosQuery() {
  return useQuery({
    queryKey: orcamentoKeys.list(),
    queryFn: () => orcamentoService.list(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
