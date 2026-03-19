import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";

export function useAdminOrganizationQuery(organizationId?: string) {
  return useQuery({
    queryKey: ["admin", "organizations", organizationId],
    queryFn: () => adminService.getOrganization(organizationId!),
    enabled: Boolean(organizationId),
  });
}
