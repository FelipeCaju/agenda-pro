import { useQuery } from "@tanstack/react-query";
import { whatsappService } from "@/services/whatsappService";

export const whatsappKeys = {
  all: ["whatsapp"] as const,
  status: () => [...whatsappKeys.all, "status"] as const,
};

export function useWhatsappStatusQuery() {
  return useQuery({
    queryKey: whatsappKeys.status(),
    queryFn: () => whatsappService.getStatus(),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}
