import { useQuery } from "@tanstack/react-query";
import { professionalService } from "@/services/professionalService";

export const professionalKeys = {
  all: ["professionals"] as const,
  list: () => [...professionalKeys.all, "list"] as const,
};

export function useProfessionalsQuery() {
  return useQuery({
    queryKey: professionalKeys.list(),
    queryFn: () => professionalService.list(),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}
