import { useQuery } from "@tanstack/react-query";
import { clientKeys } from "@/hooks/use-clients-query";
import { clientService } from "@/services/clientService";

export function useClientQuery(clientId: string | undefined) {
  const enabled = Boolean(clientId);

  return useQuery({
    queryKey: enabled ? clientKeys.detail(clientId!) : clientKeys.detail("new"),
    queryFn: () => {
      if (!clientId) {
        throw new Error("Cliente invalido para consulta.");
      }

      return clientService.getById(clientId);
    },
    enabled,
    retry: false,
  });
}
