import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/clientService";

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (search: string) => [...clientKeys.lists(), { search }] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (clientId: string) => [...clientKeys.details(), clientId] as const,
};

export function useClientsQuery(search = "") {
  return useQuery({
    queryKey: clientKeys.list(search),
    queryFn: () => clientService.list({ search }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}
