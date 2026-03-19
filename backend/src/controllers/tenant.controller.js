import { getTenants } from "../services/tenant.service.js";

export async function listTenants(_request, response) {
  try {
    response.json(await getTenants());
  } catch (error) {
    response.status(error.statusCode ?? 500).json({
      message: error.message ?? "Erro inesperado ao listar empresas.",
    });
  }
}
