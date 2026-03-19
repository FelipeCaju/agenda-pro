import { useQuery } from "@tanstack/react-query";
import { serviceService } from "@/services/serviceService";

export const serviceKeys = {
  all: ["business-services"] as const,
  lists: () => [...serviceKeys.all, "list"] as const,
  list: (search: string) => [...serviceKeys.lists(), { search }] as const,
  details: () => [...serviceKeys.all, "detail"] as const,
  detail: (serviceId: string) => [...serviceKeys.details(), serviceId] as const,
};

export function useServicesQuery(search = "") {
  return useQuery({
    queryKey: serviceKeys.list(search),
    queryFn: () => serviceService.list({ search }),
  });
}
