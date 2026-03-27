import { useQuery } from "@tanstack/react-query";
import {
  dashboardService,
  type DashboardPeriod,
  type DashboardStatusFilter,
} from "@/services/dashboardService";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summaries: () => [...dashboardKeys.all, "summary"] as const,
  summary: (filters: {
    period: DashboardPeriod;
    status: DashboardStatusFilter;
    startDate?: string;
    endDate?: string;
    clientId?: string;
    serviceId?: string;
  }) => [...dashboardKeys.summaries(), filters] as const,
};

type UseDashboardSummaryFilters = {
  period?: DashboardPeriod;
  status?: DashboardStatusFilter;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  serviceId?: string;
};

export function useDashboardSummary({
  period = "today" as DashboardPeriod,
  status = "all" as DashboardStatusFilter,
  startDate,
  endDate,
  clientId,
  serviceId,
}: UseDashboardSummaryFilters = {}) {
  return useQuery({
    queryKey: dashboardKeys.summary({ period, status, startDate, endDate, clientId, serviceId }),
    queryFn: () =>
      dashboardService.getSummary({
        period,
        status,
        startDate,
        endDate,
        clientId,
        serviceId,
      }),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
