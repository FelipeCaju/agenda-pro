import { useQuery } from "@tanstack/react-query";
import { serviceKeys } from "@/hooks/use-services-query";
import { serviceService } from "@/services/serviceService";

export function useServiceQuery(serviceId: string | undefined) {
  const enabled = Boolean(serviceId);

  return useQuery({
    queryKey: enabled ? serviceKeys.detail(serviceId!) : serviceKeys.detail("new"),
    queryFn: () => {
      if (!serviceId) {
        throw new Error("Servico invalido para consulta.");
      }

      return serviceService.getById(serviceId);
    },
    enabled,
    retry: false,
  });
}
