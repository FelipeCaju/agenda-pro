import { useQuery } from "@tanstack/react-query";
import { orcamentoKeys } from "@/hooks/use-orcamentos-query";
import { orcamentoService } from "@/services/orcamentoService";

export function useOrcamentoQuery(quoteId?: string) {
  return useQuery({
    queryKey: orcamentoKeys.detail(quoteId ?? ""),
    queryFn: () => orcamentoService.getById(quoteId ?? ""),
    enabled: Boolean(quoteId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
