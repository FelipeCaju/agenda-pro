import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";

export function useAdminPlatformSettingsQuery() {
  return useQuery({
    queryKey: ["admin", "platform-settings"],
    queryFn: () => adminService.getPlatformSettings(),
  });
}
