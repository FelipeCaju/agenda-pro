import { randomUUID } from "node:crypto";
import { query, withTransaction } from "../lib/database.js";
import {
  getClientByIdForOrganization,
  getServiceByIdForOrganization,
} from "../lib/data.js";

const VALID_QUOTE_STATUS = ["pendente", "aprovado", "recusado"];

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampMoney(value) {
  return Math.max(0, Number(normalizeNumber(value).toFixed(2)));
}

function mapQuoteItem(row) {
  return {
    id: row.id,
    organization_id: row.organization_id,
    quote_id: row.quote_id,
    servico_id: row.servico_id ?? null,
    servico_nome: row.servico_nome,
    descricao_livre: row.descricao_livre ?? null,
    quantidade: Number(row.quantidade),
    valor_unitario: Number(row.valor_unitario),
    valor_total: Number(row.valor_total),
    observacoes: row.observacoes ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapQuote(row, items = []) {
  return {
    id: row.id,
    organization_id: row.organization_id,
    cliente_id: row.cliente_id,
    cliente_nome: row.cliente_nome,
    status: row.status,
    subtotal: Number(row.subtotal),
    desconto: Number(row.desconto),
    valor_total: Number(row.valor_total),
    observacoes: row.observacoes ?? "",
    appointment_id: row.appointment_id ?? null,
    service_order_id: row.service_order_id ?? null,
    approved_at: row.approved_at,
    rejected_at: row.rejected_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    itens: items,
  };
}

function mapServiceOrder(row, items = []) {
  return {
    id: row.id,
    organization_id: row.organization_id,
    quote_id: row.quote_id ?? null,
    cliente_id: row.cliente_id,
    cliente_nome: row.cliente_nome,
    status: row.status,
    subtotal: Number(row.subtotal),
    desconto: Number(row.desconto),
    valor_total: Number(row.valor_total),
    observacoes: row.observacoes ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
    itens: items,
  };
}

async function loadQuoteItems(organizationId, quoteId, connection = null) {
  const executor = connection ?? { query };
  const [rows] = connection
    ? await connection.query(
        `SELECT * FROM quote_items
          WHERE organization_id = ? AND quote_id = ?
          ORDER BY created_at ASC, id ASC`,
        [organizationId, quoteId],
      )
    : [await query(
        `SELECT * FROM quote_items
          WHERE organization_id = ? AND quote_id = ?
          ORDER BY created_at ASC, id ASC`,
        [organizationId, quoteId],
      )];

  return rows.map(mapQuoteItem);
}

async function getQuoteRow(organizationId, quoteId, connection = null) {
  const rows = connection
    ? (await connection.query(
        `SELECT * FROM quotes WHERE organization_id = ? AND id = ? LIMIT 1`,
        [organizationId, quoteId],
      ))[0]
    : await query(`SELECT * FROM quotes WHERE organization_id = ? AND id = ? LIMIT 1`, [
        organizationId,
        quoteId,
      ]);

  return rows[0] ?? null;
}

async function getQuoteWithItems(organizationId, quoteId, connection = null) {
  const row = await getQuoteRow(organizationId, quoteId, connection);

  if (!row) {
    return null;
  }

  const items = await loadQuoteItems(organizationId, quoteId, connection);
  return mapQuote(row, items);
}

async function normalizeQuoteItems(organizationId, items) {
  if (!Array.isArray(items) || !items.length) {
    throw buildError("Adicione pelo menos um item ao orcamento.", 400);
  }

  const normalizedItems = [];

  for (const item of items) {
    const serviceId = normalizeString(item.servico_id ?? item.serviceId);
    const freeDescription = normalizeString(item.descricao_livre ?? item.description);
    const quantity = normalizeNumber(item.quantidade ?? item.quantity, 1);
    const unitValue = normalizeNumber(item.valor_unitario ?? item.unitPrice, Number.NaN);
    const notes = normalizeString(item.observacoes ?? item.notes);

    if (!serviceId && !freeDescription) {
      throw buildError("Cada item precisa de um servico ou descricao livre.", 400);
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw buildError("Quantidade invalida no orcamento.", 400);
    }

    let serviceName = freeDescription;

    if (serviceId) {
      const service = await getServiceByIdForOrganization(organizationId, serviceId);

      if (!service) {
        throw buildError("Servico do orcamento nao encontrado.", 404);
      }

      serviceName = service.nome;
    }

    const normalizedUnitValue = Number.isFinite(unitValue)
      ? clampMoney(unitValue)
      : serviceId
        ? clampMoney((await getServiceByIdForOrganization(organizationId, serviceId)).valor_padrao)
        : 0;
    const totalValue = clampMoney(quantity * normalizedUnitValue);

    normalizedItems.push({
      id: normalizeString(item.id) || randomUUID(),
      servico_id: serviceId || null,
      servico_nome: serviceName,
      descricao_livre: freeDescription || null,
      quantidade: Number(quantity.toFixed(2)),
      valor_unitario: normalizedUnitValue,
      valor_total: totalValue,
      observacoes: notes,
    });
  }

  return normalizedItems;
}

function buildTotals(items, discount) {
  const subtotal = clampMoney(
    items.reduce((sum, item) => sum + Number(item.valor_total ?? 0), 0),
  );
  const normalizedDiscount = clampMoney(discount);

  return {
    subtotal,
    desconto: normalizedDiscount,
    valorTotal: clampMoney(Math.max(0, subtotal - normalizedDiscount)),
  };
}

function buildQuoteDraftNotes(quote) {
  const lines = quote.itens.map(
    (item) =>
      `- ${item.servico_nome}${item.quantidade > 1 ? ` x${item.quantidade}` : ""} (${item.valor_total.toFixed(2)})`,
  );

  return [`Orcamento vinculado: ${quote.id}`, ...lines, quote.observacoes].filter(Boolean).join("\n");
}

export async function listQuotes({ organizationId }) {
  const rows = await query(
    `SELECT * FROM quotes
      WHERE organization_id = ?
      ORDER BY created_at DESC`,
    [organizationId],
  );

  const quotes = await Promise.all(
    rows.map(async (row) => mapQuote(row, await loadQuoteItems(organizationId, row.id))),
  );

  return quotes;
}

export async function getQuote({ organizationId, quoteId }) {
  const quote = await getQuoteWithItems(organizationId, quoteId);

  if (!quote) {
    throw buildError("Orcamento nao encontrado.", 404);
  }

  return quote;
}

export async function createQuote({ organizationId, input }) {
  const clientId = normalizeString(input.cliente_id ?? input.clientId);

  if (!clientId) {
    throw buildError("Cliente e obrigatorio para criar o orcamento.", 400);
  }

  const client = await getClientByIdForOrganization(organizationId, clientId);

  if (!client) {
    throw buildError("Cliente do orcamento nao encontrado.", 404);
  }

  const items = await normalizeQuoteItems(organizationId, input.itens ?? input.items);
  const totals = buildTotals(items, input.desconto ?? input.discount);
  const quoteId = randomUUID();

  await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO quotes (
        id, organization_id, cliente_id, cliente_nome, status, subtotal, desconto,
        valor_total, observacoes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pendente', ?, ?, ?, ?, NOW(), NOW())`,
      [
        quoteId,
        organizationId,
        client.id,
        client.nome,
        totals.subtotal,
        totals.desconto,
        totals.valorTotal,
        normalizeString(input.observacoes),
      ],
    );

    for (const item of items) {
      await connection.execute(
        `INSERT INTO quote_items (
          id, organization_id, quote_id, servico_id, servico_nome, descricao_livre,
          quantidade, valor_unitario, valor_total, observacoes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          item.id,
          organizationId,
          quoteId,
          item.servico_id,
          item.servico_nome,
          item.descricao_livre,
          item.quantidade,
          item.valor_unitario,
          item.valor_total,
          item.observacoes || null,
        ],
      );
    }
  });

  return getQuote({ organizationId, quoteId });
}

export async function updateQuote({ organizationId, quoteId, input }) {
  const current = await getQuote({ organizationId, quoteId });

  if (current.status !== "pendente") {
    throw buildError("Somente orcamentos pendentes podem ser editados.", 409);
  }

  const clientId = normalizeString(input.cliente_id ?? input.clientId ?? current.cliente_id);
  const client = await getClientByIdForOrganization(organizationId, clientId);

  if (!client) {
    throw buildError("Cliente do orcamento nao encontrado.", 404);
  }

  const items = await normalizeQuoteItems(organizationId, input.itens ?? input.items ?? current.itens);
  const totals = buildTotals(items, input.desconto ?? input.discount ?? current.desconto);
  const notes = normalizeString(input.observacoes ?? current.observacoes);

  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE quotes
        SET cliente_id = ?, cliente_nome = ?, subtotal = ?, desconto = ?, valor_total = ?, observacoes = ?, updated_at = NOW()
        WHERE organization_id = ? AND id = ?`,
      [
        client.id,
        client.nome,
        totals.subtotal,
        totals.desconto,
        totals.valorTotal,
        notes,
        organizationId,
        quoteId,
      ],
    );

    await connection.execute(`DELETE FROM quote_items WHERE organization_id = ? AND quote_id = ?`, [
      organizationId,
      quoteId,
    ]);

    for (const item of items) {
      await connection.execute(
        `INSERT INTO quote_items (
          id, organization_id, quote_id, servico_id, servico_nome, descricao_livre,
          quantidade, valor_unitario, valor_total, observacoes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          item.id,
          organizationId,
          quoteId,
          item.servico_id,
          item.servico_nome,
          item.descricao_livre,
          item.quantidade,
          item.valor_unitario,
          item.valor_total,
          item.observacoes || null,
        ],
      );
    }
  });

  return getQuote({ organizationId, quoteId });
}

export async function approveQuote({ organizationId, quoteId }) {
  const current = await getQuote({ organizationId, quoteId });

  if (current.status !== "pendente") {
    throw buildError("Somente orcamentos pendentes podem ser aprovados.", 409);
  }

  await query(
    `UPDATE quotes
      SET status = 'aprovado', approved_at = NOW(), rejected_at = NULL
      WHERE organization_id = ? AND id = ?`,
    [organizationId, quoteId],
  );

  return getQuote({ organizationId, quoteId });
}

export async function rejectQuote({ organizationId, quoteId }) {
  const current = await getQuote({ organizationId, quoteId });

  if (current.status !== "pendente") {
    throw buildError("Somente orcamentos pendentes podem ser recusados.", 409);
  }

  await query(
    `UPDATE quotes
      SET status = 'recusado', rejected_at = NOW()
      WHERE organization_id = ? AND id = ?`,
    [organizationId, quoteId],
  );

  return getQuote({ organizationId, quoteId });
}

export async function createQuoteAppointmentDraft({ organizationId, quoteId }) {
  const quote = await getQuote({ organizationId, quoteId });
  const appointmentItems = quote.itens.filter((item) => item.servico_id);

  if (!appointmentItems.length) {
    throw buildError(
      "Para agendar este orcamento, pelo menos um item precisa estar vinculado a um servico cadastrado.",
      409,
    );
  }

  return {
    quote_id: quote.id,
    cliente_id: quote.cliente_id,
    servico_id: appointmentItems[0].servico_id,
    items: appointmentItems.map((item) => ({
      id: item.id,
      servico_id: item.servico_id,
      valor_unitario: item.valor_unitario,
      valor_total: item.valor_total,
    })),
    observacoes: buildQuoteDraftNotes(quote),
  };
}

export async function convertQuoteToServiceOrder({ organizationId, quoteId }) {
  const quote = await getQuote({ organizationId, quoteId });

  if (quote.service_order_id) {
    const serviceOrderRows = await query(
      `SELECT * FROM service_orders WHERE organization_id = ? AND id = ? LIMIT 1`,
      [organizationId, quote.service_order_id],
    );
    const itemRows = await query(
      `SELECT * FROM service_order_items WHERE organization_id = ? AND service_order_id = ? ORDER BY created_at ASC`,
      [organizationId, quote.service_order_id],
    );
    return mapServiceOrder(serviceOrderRows[0], itemRows.map(mapQuoteItem));
  }

  if (!["pendente", "aprovado"].includes(quote.status)) {
    throw buildError("Somente orcamentos pendentes ou aprovados podem virar ordem de servico.", 409);
  }

  const serviceOrderId = randomUUID();

  await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO service_orders (
        id, organization_id, quote_id, cliente_id, cliente_nome, status,
        subtotal, desconto, valor_total, observacoes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'aberta', ?, ?, ?, ?, NOW(), NOW())`,
      [
        serviceOrderId,
        organizationId,
        quote.id,
        quote.cliente_id,
        quote.cliente_nome,
        quote.subtotal,
        quote.desconto,
        quote.valor_total,
        quote.observacoes || null,
      ],
    );

    for (const item of quote.itens) {
      await connection.execute(
        `INSERT INTO service_order_items (
          id, organization_id, service_order_id, servico_id, servico_nome, descricao_livre,
          quantidade, valor_unitario, valor_total, observacoes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          randomUUID(),
          organizationId,
          serviceOrderId,
          item.servico_id,
          item.servico_nome,
          item.descricao_livre,
          item.quantidade,
          item.valor_unitario,
          item.valor_total,
          item.observacoes || null,
        ],
      );
    }

    await connection.execute(
      `UPDATE quotes
        SET service_order_id = ?, updated_at = NOW()
        WHERE organization_id = ? AND id = ?`,
      [serviceOrderId, organizationId, quote.id],
    );
  });

  const serviceOrderRows = await query(
    `SELECT * FROM service_orders WHERE organization_id = ? AND id = ? LIMIT 1`,
    [organizationId, serviceOrderId],
  );
  const itemRows = await query(
    `SELECT * FROM service_order_items WHERE organization_id = ? AND service_order_id = ? ORDER BY created_at ASC`,
    [organizationId, serviceOrderId],
  );

  return mapServiceOrder(serviceOrderRows[0], itemRows.map(mapQuoteItem));
}

export async function linkQuoteToAppointment({ organizationId, quoteId, appointmentId }) {
  const quote = await getQuote({ organizationId, quoteId });

  if (!quote) {
    throw buildError("Orcamento vinculado nao encontrado.", 404);
  }

  await query(
    `UPDATE quotes
      SET appointment_id = ?, updated_at = NOW()
      WHERE organization_id = ? AND id = ?`,
    [appointmentId, organizationId, quoteId],
  );

  return getQuote({ organizationId, quoteId });
}
