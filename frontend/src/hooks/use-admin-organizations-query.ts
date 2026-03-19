import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";

export function useAdminOrganizationsQuery() {
  return useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: () => adminService.listOrganizations(),
  });
}
