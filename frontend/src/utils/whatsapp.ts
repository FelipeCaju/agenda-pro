import type { Orcamento } from "@/services/orcamentoService";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function normalizeWhatsappPhone(phone?: string | null) {
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function buildQuoteWhatsappMessage({
  clientName,
  organizationName,
  items,
  total,
}: {
  clientName: string;
  organizationName: string;
  items: Array<{ serviceName: string; quantity?: number; totalPrice: number }>;
  total: number;
}) {
  const normalizedOrganizationName = organizationName.trim() || "AgendaPro";
  const normalizedClientName = clientName.trim() || "Cliente";
  const itemLines = items.map((item) => {
    const quantitySuffix = Number(item.quantity ?? 1) > 1 ? ` x${Number(item.quantity)}` : "";
    return `- ${item.serviceName}${quantitySuffix}: ${formatCurrency(item.totalPrice)}`;
  });

  return [
    `Oie ${normalizedClientName}!`,
    "",
    `Segue seu orcamento da ${normalizedOrganizationName}.`,
    "",
    "Itens do orcamento:",
    ...itemLines,
    "",
    `Total: ${formatCurrency(total)}`,
    "",
    "Aguardando confirmacao.",
  ].join("\n");
}

export function openWhatsappConversation(phone: string, message: string) {
  const normalizedPhone = normalizeWhatsappPhone(phone);

  if (!normalizedPhone) {
    throw new Error("Cliente sem telefone valido para envio no WhatsApp.");
  }

  const targetUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  window.open(targetUrl, "_blank", "noopener,noreferrer");
}

export function buildQuoteWhatsappPreviewTemplate(organizationName: string) {
  return buildQuoteWhatsappMessage({
    clientName: "Cliente",
    organizationName,
    items: [
      { serviceName: "Servico principal", quantity: 1, totalPrice: 120 },
      { serviceName: "Item extra", quantity: 2, totalPrice: 80 },
    ],
    total: 200,
  });
}

export function buildRecurringWhatsappPreviewTemplate(
  organizationName: string,
  pixKey?: string | null,
) {
  const normalizedOrganizationName = organizationName.trim() || "AgendaPro";
  const normalizedPixKey = pixKey?.trim() || "pix@empresa.com";

  return [
    "Oie Cliente!",
    "",
    `Aqui e a equipe da ${normalizedOrganizationName}.`,
    "",
    "Passando para te lembrar da sua cobranca de Servico mensal.",
    "",
    "Valor: R$ 150,00",
    "Vencimento: 10/04/2026",
    `Chave Pix: ${normalizedPixKey}`,
    "",
    "Se o pagamento ja foi realizado, pode desconsiderar esta mensagem.",
    "Obrigada!",
  ].join("\n");
}

export function buildQuoteWhatsappMessageFromQuote(
  quote: Orcamento,
  organizationName: string,
  clientName?: string | null,
) {
  return buildQuoteWhatsappMessage({
    clientName: clientName ?? quote.clientName,
    organizationName,
    items: quote.items.map((item) => ({
      serviceName: item.serviceName,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    })),
    total: quote.total,
  });
}
