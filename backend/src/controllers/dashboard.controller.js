import { getRequestActiveAuthContext } from "../lib/request-auth.js";
import { getDashboardSummary } from "../services/dashboard.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar dashboard.",
  });
}

export async function getDashboardSummaryController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const data = await getDashboardSummary({
      organizationId: organization.id,
      period: request.query.period ?? "today",
      status: request.query.status ?? "all",
      startDate: request.query.startDate ?? null,
      endDate: request.query.endDate ?? null,
      clientId: request.query.clientId ?? null,
      serviceId: request.query.serviceId ?? null,
    });

    response.json({ data });
  } catch (error) {
    sendError(response, error);
  }
}
