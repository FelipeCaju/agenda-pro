import { getRequestActiveAuthContext } from "../lib/request-auth.js";
import {
  approveQuote,
  convertQuoteToServiceOrder,
  createQuote,
  createQuoteAppointmentDraft,
  getQuote,
  listQuotes,
  rejectQuote,
  updateQuote,
} from "../services/quote.service.js";

function sendError(response, error) {
  response.status(error.statusCode ?? 500).json({
    message: error.message ?? "Erro inesperado ao processar orcamentos.",
  });
}

export async function listQuotesController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const quotes = await listQuotes({ organizationId: organization.id });
    response.json({ data: quotes, meta: { total: quotes.length } });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getQuoteController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const quote = await getQuote({
      organizationId: organization.id,
      quoteId: request.params.quoteId,
    });
    response.json({ data: quote });
  } catch (error) {
    sendError(response, error);
  }
}

export async function createQuoteController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const quote = await createQuote({
      organizationId: organization.id,
      input: request.body,
    });
    response.status(201).json({ data: quote, message: "Orcamento criado com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateQuoteController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const quote = await updateQuote({
      organizationId: organization.id,
      quoteId: request.params.quoteId,
      input: request.body,
    });
    response.json({ data: quote, message: "Orcamento atualizado com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function approveQuoteController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const quote = await approveQuote({
      organizationId: organization.id,
      quoteId: request.params.quoteId,
    });
    response.json({ data: quote, message: "Orcamento aprovado com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function rejectQuoteController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const quote = await rejectQuote({
      organizationId: organization.id,
      quoteId: request.params.quoteId,
    });
    response.json({ data: quote, message: "Orcamento recusado com sucesso." });
  } catch (error) {
    sendError(response, error);
  }
}

export async function createQuoteAppointmentDraftController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const draft = await createQuoteAppointmentDraft({
      organizationId: organization.id,
      quoteId: request.params.quoteId,
    });
    response.json({ data: draft });
  } catch (error) {
    sendError(response, error);
  }
}

export async function convertQuoteToServiceOrderController(request, response) {
  try {
    const { organization } = await getRequestActiveAuthContext(request);
    const serviceOrder = await convertQuoteToServiceOrder({
      organizationId: organization.id,
      quoteId: request.params.quoteId,
    });
    response.json({ data: serviceOrder, message: "Orcamento convertido em ordem de servico." });
  } catch (error) {
    sendError(response, error);
  }
}
