import { useQuery } from "@tanstack/react-query";
import {
  dashboardService,
  type DashboardPeriod,
  type DashboardStatusFilter,
} from "@/services/dashboardService";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summaries: () => [...dashboardKeys.all, "summary"] as const,
  summary: (period: DashboardPeriod, status: DashboardStatusFilter) =>
    [...dashboardKeys.summaries(), { period, status }] as const,
};

export function useDashboardSummary({
  period = "today" as DashboardPeriod,
  status = "all" as DashboardStatusFilter,
} = {}) {
  return useQuery({
    queryKey: dashboardKeys.summary(period, status),
    queryFn: () => dashboardService.getSummary({ period, status }),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
