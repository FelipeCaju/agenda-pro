import { randomUUID } from "node:crypto";
import { execute, query, withTransaction } from "./database.js";
import { hashPassword } from "./password.js";

const seedOrganizations = [
  {
    id: "org-1",
    nome_empresa: "Clinica Centro",
    email_responsavel: "contato@agendapro.app",
    telefone: "(11) 99999-9999",
    monthly_amount: 189.9,
    subscription_status: "active",
    subscription_plan: "pro",
    due_date: "2026-04-10",
    trial_end: null,
  },
  {
    id: "org-2",
    nome_empresa: "Studio Beta",
    email_responsavel: "bloqueado@agendapro.app",
    telefone: "(11) 98888-7777",
    monthly_amount: 129.9,
    subscription_status: "overdue",
    subscription_plan: "starter",
    due_date: "2026-03-10",
    trial_end: null,
  },
];

const seedUsers = [
  {
    id: "user-1",
    organization_id: "org-1",
    nome: "Equipe AgendaPro",
    email: "contato@agendapro.app",
    google_id: null,
    apple_id: null,
    auth_provider: "email",
    password: "Agenda123!",
    role: "owner",
    ativo: true,
  },
  {
    id: "user-2",
    organization_id: "org-2",
    nome: "Conta Bloqueada",
    email: "bloqueado@agendapro.app",
    google_id: null,
    apple_id: null,
    auth_provider: "email",
    password: "Agenda123!",
    role: "admin",
    ativo: true,
  },
];

const seedClients = [
  {
    id: "client-1",
    organization_id: "org-1",
    nome: "Maria Silva",
    telefone: "(11) 99999-9999",
    email: "maria@email.com",
    observacoes: "Prefere atendimento pela manha",
    ativo: true,
    created_at: "2026-03-01 09:00:00",
    updated_at: "2026-03-01 09:00:00",
  },
  {
    id: "client-2",
    organization_id: "org-1",
    nome: "Joao Souza",
    telefone: "(11) 98888-8888",
    email: "joao@email.com",
    observacoes: "",
    ativo: true,
    created_at: "2026-03-02 10:00:00",
    updated_at: "2026-03-02 10:00:00",
  },
  {
    id: "client-3",
    organization_id: "org-1",
    nome: "Carla Mendes",
    telefone: "",
    email: "carla@email.com",
    observacoes: "Cliente recorrente",
    ativo: false,
    created_at: "2026-03-03 11:00:00",
    updated_at: "2026-03-03 11:00:00",
  },
  {
    id: "client-4",
    organization_id: "org-2",
    nome: "Luciana Costa",
    telefone: "(11) 97777-4444",
    email: "luciana@studio.com",
    observacoes: "Tenant 2",
    ativo: true,
    created_at: "2026-03-04 12:00:00",
    updated_at: "2026-03-04 12:00:00",
  },
];

const seedServices = [
  {
    id: "service-1",
    organization_id: "org-1",
    nome: "Consulta inicial",
    descricao: "Primeiro atendimento completo",
    duracao_minutos: 60,
    valor_padrao: 180,
    cor: "#1d8cf8",
    ativo: true,
    created_at: "2026-03-01 09:00:00",
    updated_at: "2026-03-01 09:00:00",
  },
  {
    id: "service-2",
    organization_id: "org-1",
    nome: "Retorno",
    descricao: "Revisao de acompanhamento",
    duracao_minutos: 30,
    valor_padrao: 120,
    cor: "#0f6dd9",
    ativo: true,
    created_at: "2026-03-02 09:00:00",
    updated_at: "2026-03-02 09:00:00",
  },
  {
    id: "service-3",
    organization_id: "org-1",
    nome: "Teleconsulta",
    descricao: "Atendimento remoto",
    duracao_minutos: 45,
    valor_padrao: 150,
    cor: "#14b8a6",
    ativo: false,
    created_at: "2026-03-03 09:00:00",
    updated_at: "2026-03-03 09:00:00",
  },
  {
    id: "service-4",
    organization_id: "org-2",
    nome: "Design de sobrancelhas",
    descricao: "Servico do tenant 2",
    duracao_minutos: 50,
    valor_padrao: 95,
    cor: "#f97316",
    ativo: true,
    created_at: "2026-03-04 09:00:00",
    updated_at: "2026-03-04 09:00:00",
  },
];

const seedProfessionals = [
  {
    id: "professional-1",
    organization_id: "org-1",
    nome: "Joao",
    atividade: "Cabeleireiro",
    ativo: true,
    created_at: "2026-03-01 09:00:00",
    updated_at: "2026-03-01 09:00:00",
  },
  {
    id: "professional-2",
    organization_id: "org-1",
    nome: "Maria",
    atividade: "Manicure",
    ativo: true,
    created_at: "2026-03-01 09:10:00",
    updated_at: "2026-03-01 09:10:00",
  },
  {
    id: "professional-3",
    organization_id: "org-2",
    nome: "Fernanda",
    atividade: "Designer",
    ativo: true,
    created_at: "2026-03-01 09:20:00",
    updated_at: "2026-03-01 09:20:00",
  },
];

const seedProfessionalServices = [
  {
    id: "professional-service-1",
    organization_id: "org-1",
    professional_id: "professional-1",
    service_id: "service-1",
    created_at: "2026-03-01 09:30:00",
    updated_at: "2026-03-01 09:30:00",
  },
  {
    id: "professional-service-2",
    organization_id: "org-1",
    professional_id: "professional-1",
    service_id: "service-2",
    created_at: "2026-03-01 09:31:00",
    updated_at: "2026-03-01 09:31:00",
  },
  {
    id: "professional-service-3",
    organization_id: "org-1",
    professional_id: "professional-2",
    service_id: "service-3",
    created_at: "2026-03-01 09:32:00",
    updated_at: "2026-03-01 09:32:00",
  },
  {
    id: "professional-service-4",
    organization_id: "org-2",
    professional_id: "professional-3",
    service_id: "service-4",
    created_at: "2026-03-01 09:33:00",
    updated_at: "2026-03-01 09:33:00",
  },
];

const seedAppSettings = [
  {
    id: "setting-1",
    organization_id: "org-1",
    nome_negocio: "Clinica Centro",
    subtitulo: "Agenda principal",
    logo: null,
    cor_primaria: "#1d8cf8",
    hora_inicio_agenda: "08:00:00",
    hora_fim_agenda: "18:00:00",
    duracao_padrao: 30,
    moeda: "BRL",
    timezone: "America/Sao_Paulo",
    permitir_conflito: false,
    lembretes_ativos: true,
    lembrete_horas_antes: 24,
    lembrete_mensagem: "Lembrete da sua consulta",
    whatsapp_ativo: true,
    whatsapp_api_provider: "demo",
    whatsapp_api_url: null,
    whatsapp_api_token: null,
    whatsapp_instance_id: null,
    whatsapp_tempo_lembrete_minutos: 60,
    created_at: "2026-03-01 08:00:00",
    updated_at: "2026-03-01 08:00:00",
  },
  {
    id: "setting-2",
    organization_id: "org-2",
    nome_negocio: "Studio Beta",
    subtitulo: "Agenda alternativa",
    logo: null,
    cor_primaria: "#f97316",
    hora_inicio_agenda: "09:00:00",
    hora_fim_agenda: "19:00:00",
    duracao_padrao: 45,
    moeda: "BRL",
    timezone: "America/Sao_Paulo",
    permitir_conflito: true,
    lembretes_ativos: true,
    lembrete_horas_antes: 12,
    lembrete_mensagem: "Seu horario esta confirmado",
    whatsapp_ativo: true,
    whatsapp_api_provider: "demo",
    whatsapp_api_url: null,
    whatsapp_api_token: null,
    whatsapp_instance_id: null,
    whatsapp_tempo_lembrete_minutos: 45,
    created_at: "2026-03-01 08:00:00",
    updated_at: "2026-03-01 08:00:00",
  },
];

const seedAppointments = [
  {
    id: "appointment-1",
    organization_id: "org-1",
    cliente_id: "client-1",
    cliente_nome: "Maria Silva",
    cliente_email: "maria@email.com",
    servico_id: "service-1",
    servico_nome: "Consulta inicial",
    servico_cor: "#1d8cf8",
    profissional_id: "professional-1",
    profissional_nome: "Joao",
    data: "2026-03-16",
    horario_inicial: "09:00:00",
    horario_final: "10:00:00",
    valor: 180,
    status: "confirmado",
    payment_status: "pago",
    observacoes: "Primeira consulta do dia",
    confirmacao_cliente: "confirmado",
    lembrete_enviado: true,
    lembrete_confirmado: true,
    lembrete_cancelado: false,
    data_envio_lembrete: "2026-03-15 09:00:00",
    resposta_whatsapp: "Confirmado",
    created_at: "2026-03-10 08:00:00",
    updated_at: "2026-03-10 08:00:00",
  },
  {
    id: "appointment-2",
    organization_id: "org-1",
    cliente_id: "client-2",
    cliente_nome: "Joao Souza",
    cliente_email: "joao@email.com",
    servico_id: "service-2",
    servico_nome: "Retorno",
    servico_cor: "#0f6dd9",
    profissional_id: "professional-1",
    profissional_nome: "Joao",
    data: "2026-03-16",
    horario_inicial: "11:30:00",
    horario_final: "12:00:00",
    valor: 120,
    status: "pendente",
    payment_status: "pendente",
    observacoes: "",
    confirmacao_cliente: "pendente",
    lembrete_enviado: false,
    lembrete_confirmado: false,
    lembrete_cancelado: false,
    data_envio_lembrete: null,
    resposta_whatsapp: null,
    created_at: "2026-03-10 09:00:00",
    updated_at: "2026-03-10 09:00:00",
  },
  {
    id: "appointment-3",
    organization_id: "org-1",
    cliente_id: "client-3",
    cliente_nome: "Carla Mendes",
    cliente_email: "carla@email.com",
    servico_id: "service-3",
    servico_nome: "Teleconsulta",
    servico_cor: "#14b8a6",
    profissional_id: "professional-2",
    profissional_nome: "Maria",
    data: "2026-03-17",
    horario_inicial: "14:00:00",
    horario_final: "14:45:00",
    valor: 150,
    status: "cancelado",
    payment_status: "pendente",
    observacoes: "Remarcado para a proxima semana",
    confirmacao_cliente: "cancelado",
    lembrete_enviado: true,
    lembrete_confirmado: false,
    lembrete_cancelado: true,
    data_envio_lembrete: "2026-03-16 14:00:00",
    resposta_whatsapp: "Preciso remarcar",
    created_at: "2026-03-10 10:00:00",
    updated_at: "2026-03-10 10:00:00",
  },
  {
    id: "appointment-4",
    organization_id: "org-2",
    cliente_id: "client-4",
    cliente_nome: "Luciana Costa",
    cliente_email: "luciana@studio.com",
    servico_id: "service-4",
    servico_nome: "Design de sobrancelhas",
    servico_cor: "#f97316",
    profissional_id: "professional-3",
    profissional_nome: "Fernanda",
    data: "2026-03-16",
    horario_inicial: "13:00:00",
    horario_final: "13:50:00",
    valor: 95,
    status: "confirmado",
    payment_status: "pago",
    observacoes: "Tenant 2",
    confirmacao_cliente: "confirmado",
    lembrete_enviado: true,
    lembrete_confirmado: true,
    lembrete_cancelado: false,
    data_envio_lembrete: "2026-03-15 13:00:00",
    resposta_whatsapp: "Ok",
    created_at: "2026-03-10 11:00:00",
    updated_at: "2026-03-10 11:00:00",
  },
];

const seedOrganizationPayments = [
  {
    id: "payment-1",
    organization_id: "org-1",
    reference_month: "2026-03",
    amount: 199,
    status: "paid",
    paid_at: "2026-03-05 10:00:00",
    due_date: "2026-03-10",
    payment_method: "pix",
    notes: "Pagamento confirmado manualmente",
    created_at: "2026-03-05 10:00:00",
    updated_at: "2026-03-05 10:00:00",
  },
  {
    id: "payment-2",
    organization_id: "org-2",
    reference_month: "2026-03",
    amount: 99,
    status: "overdue",
    paid_at: null,
    due_date: "2026-03-10",
    payment_method: "boleto",
    notes: "Aguardando pagamento",
    created_at: "2026-03-01 09:00:00",
    updated_at: "2026-03-12 09:00:00",
  },
];

let initialized = false;

function toBoolean(value) {
  return Boolean(Number(value));
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function stripSeconds(value) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  return value.length >= 5 ? value.slice(0, 5) : value;
}

function normalizeDateTime(value) {
  if (!value) {
    return null;
  }

  return value.includes("T") ? value : value.replace(" ", "T");
}

function toMysqlDateTime(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).replace("T", " ").replace("Z", "");
  return normalized.slice(0, 19);
}

function mapOrganization(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    nome_empresa: row.nome_empresa,
    email_responsavel: row.email_responsavel,
    telefone: row.telefone,
    monthly_amount: Number(row.monthly_amount ?? 0),
    subscription_status: row.subscription_status,
    subscription_plan: row.subscription_plan,
    due_date: row.due_date,
    trial_end: row.trial_end,
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    nome: row.nome,
    email: row.email,
    google_id: row.google_id,
    apple_id: row.apple_id ?? null,
    auth_provider: row.auth_provider ?? "email",
    role: row.role,
    ativo: toBoolean(row.ativo),
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapUserForAuth(row) {
  const user = mapUser(row);

  if (!user) {
    return null;
  }

  return {
    ...user,
    password_hash: row.password_hash ?? null,
  };
}

function mapClient(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    nome: row.nome,
    telefone: row.telefone ?? "",
    email: row.email,
    observacoes: row.observacoes ?? "",
    ativo: toBoolean(row.ativo),
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapService(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    nome: row.nome,
    descricao: row.descricao ?? "",
    duracao_minutos: Number(row.duracao_minutos),
    valor_padrao: Number(row.valor_padrao),
    cor: row.cor ?? "",
    ativo: toBoolean(row.ativo),
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapProfessional(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    nome: row.nome,
    atividade: row.atividade ?? "",
    ativo: toBoolean(row.ativo),
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapAppointment(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    cliente_id: row.cliente_id,
    cliente_nome: row.cliente_nome,
    cliente_email: row.cliente_email,
    servico_id: row.servico_id,
    servico_nome: row.servico_nome,
    servico_cor: row.servico_cor ?? "",
    profissional_id: row.profissional_id ?? null,
    profissional_nome: row.profissional_nome ?? null,
    data: row.data,
    horario_inicial: stripSeconds(row.horario_inicial),
    horario_final: stripSeconds(row.horario_final),
    valor: Number(row.valor),
    status: row.status,
    payment_status: row.payment_status ?? "pendente",
    observacoes: row.observacoes ?? "",
    confirmacao_cliente: row.confirmacao_cliente,
    lembrete_enviado: toBoolean(row.lembrete_enviado),
    lembrete_confirmado: toBoolean(row.lembrete_confirmado),
    lembrete_cancelado: toBoolean(row.lembrete_cancelado),
    data_envio_lembrete: normalizeDateTime(row.data_envio_lembrete),
    resposta_whatsapp: row.resposta_whatsapp,
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapAppSettings(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    nome_negocio: row.nome_negocio,
    subtitulo: row.subtitulo,
    logo: row.logo,
    cor_primaria: row.cor_primaria,
    hora_inicio_agenda: stripSeconds(row.hora_inicio_agenda),
    hora_fim_agenda: stripSeconds(row.hora_fim_agenda),
    duracao_padrao: Number(row.duracao_padrao),
    moeda: row.moeda,
    timezone: row.timezone,
    permitir_conflito: toBoolean(row.permitir_conflito),
    lembretes_ativos: toBoolean(row.lembretes_ativos),
    lembrete_horas_antes: Number(row.lembrete_horas_antes),
    lembrete_mensagem: row.lembrete_mensagem,
    whatsapp_ativo: toBoolean(row.whatsapp_ativo),
    whatsapp_api_provider: row.whatsapp_api_provider,
    whatsapp_api_url: row.whatsapp_api_url,
    whatsapp_api_token: row.whatsapp_api_token,
    whatsapp_instance_id: row.whatsapp_instance_id,
    whatsapp_tempo_lembrete_minutos: Number(row.whatsapp_tempo_lembrete_minutos),
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapOrganizationPayment(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    reference_month: row.reference_month,
    amount: Number(row.amount),
    status: row.status,
    paid_at: normalizeDateTime(row.paid_at),
    due_date: row.due_date,
    payment_method: row.payment_method,
    notes: row.notes,
    customer_notified_paid_at: normalizeDateTime(row.customer_notified_paid_at),
    customer_payment_note: row.customer_payment_note ?? null,
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapPlatformSettings(row) {
  if (!row) {
    return {
      id: "default",
      pix_key: "",
      payment_grace_days: 5,
      payment_alert_days: 5,
      created_at: null,
      updated_at: null,
    };
  }

  return {
    id: row.id,
    pix_key: row.pix_key ?? "",
    payment_grace_days: Number(row.payment_grace_days ?? 5),
    payment_alert_days: Number(row.payment_alert_days ?? 5),
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function mapBlockedSlot(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organization_id: row.organization_id,
    professional_id: row.professional_id ?? null,
    data: row.data,
    horario_inicial: stripSeconds(row.horario_inicial),
    horario_final: stripSeconds(row.horario_final),
    motivo: row.motivo ?? "",
    created_at: normalizeDateTime(row.created_at),
    updated_at: normalizeDateTime(row.updated_at),
  };
}

function getFutureDate(daysAhead) {
  const value = new Date();
  value.setDate(value.getDate() + daysAhead);
  return value.toISOString().slice(0, 10);
}

function buildUpdateStatement(input, allowedFields) {
  const fields = allowedFields.filter((field) => input[field] !== undefined);

  if (!fields.length) {
    return null;
  }

  return {
    sql: fields.map((field) => `${field} = ?`).join(", "),
    params: fields.map((field) => input[field]),
  };
}

async function ensureTablesExist() {
  const rows = await query("SHOW TABLES LIKE 'organizations'");

  if (!rows.length) {
    const error = new Error(
      "As tabelas do AgendaPro nao foram encontradas no MySQL. Rode o SQL de criacao antes de iniciar o backend.",
    );
    error.statusCode = 500;
    throw error;
  }
}

async function hasTable(tableName) {
  const rows = await query(`SHOW TABLES LIKE ?`, [tableName]);
  return rows.length > 0;
}

async function hasColumn(tableName, columnName) {
  const rows = await query(
    `SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1`,
    [tableName, columnName],
  );

  return rows.length > 0;
}

async function ensurePlatformSettingsInfrastructure() {
  await execute(
    `CREATE TABLE IF NOT EXISTS platform_settings (
      id VARCHAR(64) PRIMARY KEY,
      pix_key TEXT NULL,
      payment_grace_days INT NOT NULL DEFAULT 5,
      payment_alert_days INT NOT NULL DEFAULT 5,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  );

  await execute(
    `INSERT IGNORE INTO platform_settings (
      id, pix_key, payment_grace_days, payment_alert_days
    ) VALUES ('default', '', 5, 5)`,
  );

  if (await hasTable("organization_payments")) {
    if (!(await hasColumn("organization_payments", "customer_notified_paid_at"))) {
      await execute(
        `ALTER TABLE organization_payments
          ADD COLUMN customer_notified_paid_at DATETIME NULL AFTER notes`,
      );
    }

    if (!(await hasColumn("organization_payments", "customer_payment_note"))) {
      await execute(
        `ALTER TABLE organization_payments
          ADD COLUMN customer_payment_note TEXT NULL AFTER customer_notified_paid_at`,
      );
    }
  }
}

async function ensureProfessionalsTablesExist() {
  const hasProfessionals = await hasTable("professionals");
  const hasProfessionalServices = await hasTable("professional_services");

  if (hasProfessionals && hasProfessionalServices) {
    return;
  }

  const error = new Error(
    "As tabelas de funcionarios nao foram encontradas no MySQL. Rode a migration 003_professionals_mysql.sql.",
  );
  error.statusCode = 500;
  throw error;
}

async function hasProfessionalsFeature() {
  const hasProfessionals = await hasTable("professionals");
  const hasProfessionalServices = await hasTable("professional_services");
  return hasProfessionals && hasProfessionalServices;
}

async function ensureBlockedSlotsTableExists() {
  if (await hasTable("blocked_slots")) {
    return;
  }

  const error = new Error(
    "A tabela de bloqueios nao foi encontrada no MySQL. Rode a migration 007_blocked_slots_mysql.sql.",
  );
  error.statusCode = 500;
  throw error;
}

async function ensureSeedData() {
  const rows = await query("SELECT COUNT(*) AS total FROM organizations");
  const total = Number(rows[0]?.total ?? 0);

  if (total > 0) {
    return;
  }

  const paymentsTableAvailable = await hasTable("organization_payments");
  const professionalsTableAvailable = await hasTable("professionals");
  const professionalServicesTableAvailable = await hasTable("professional_services");

  await withTransaction(async (connection) => {
    for (const organization of seedOrganizations) {
      await connection.execute(
        `INSERT INTO organizations (
          id, nome_empresa, email_responsavel, telefone, monthly_amount,
          subscription_status, subscription_plan, due_date, trial_end,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          organization.id,
          organization.nome_empresa,
          organization.email_responsavel,
          organization.telefone,
          organization.monthly_amount,
          organization.subscription_status,
          organization.subscription_plan,
          organization.due_date,
          organization.trial_end,
        ],
      );
    }

    for (const user of seedUsers) {
      await connection.execute(
        `INSERT INTO users (
          id, organization_id, nome, email, google_id, apple_id, auth_provider,
          password_hash, role, ativo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          user.id,
          user.organization_id,
          user.nome,
          user.email,
          user.google_id,
          user.apple_id,
          user.auth_provider,
          hashPassword(user.password),
          user.role,
          user.ativo ? 1 : 0,
        ],
      );
    }

    for (const client of seedClients) {
      await connection.execute(
        `INSERT INTO clients (
          id, organization_id, nome, telefone, email, observacoes, ativo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client.id,
          client.organization_id,
          client.nome,
          client.telefone || null,
          client.email,
          client.observacoes,
          client.ativo ? 1 : 0,
          client.created_at,
          client.updated_at,
        ],
      );
    }

    for (const service of seedServices) {
      await connection.execute(
        `INSERT INTO services (
          id, organization_id, nome, descricao, duracao_minutos, valor_padrao, cor, ativo, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          service.id,
          service.organization_id,
          service.nome,
          service.descricao,
          service.duracao_minutos,
          service.valor_padrao,
          service.cor,
          service.ativo ? 1 : 0,
          service.created_at,
          service.updated_at,
        ],
      );
    }

    if (professionalsTableAvailable) {
      for (const professional of seedProfessionals) {
        await connection.execute(
          `INSERT INTO professionals (
            id, organization_id, nome, atividade, ativo, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            professional.id,
            professional.organization_id,
            professional.nome,
            professional.atividade,
            professional.ativo ? 1 : 0,
            professional.created_at,
            professional.updated_at,
          ],
        );
      }
    }

    if (professionalServicesTableAvailable) {
      for (const professionalService of seedProfessionalServices) {
        await connection.execute(
          `INSERT INTO professional_services (
            id, organization_id, professional_id, service_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            professionalService.id,
            professionalService.organization_id,
            professionalService.professional_id,
            professionalService.service_id,
            professionalService.created_at,
            professionalService.updated_at,
          ],
        );
      }
    }

    for (const settings of seedAppSettings) {
      await connection.execute(
        `INSERT INTO app_settings (
          id, organization_id, nome_negocio, subtitulo, logo, cor_primaria,
          hora_inicio_agenda, hora_fim_agenda, duracao_padrao, moeda, timezone,
          permitir_conflito, lembretes_ativos, lembrete_horas_antes, lembrete_mensagem,
          whatsapp_ativo, whatsapp_api_provider, whatsapp_api_url, whatsapp_api_token,
          whatsapp_instance_id, whatsapp_tempo_lembrete_minutos, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settings.id,
          settings.organization_id,
          settings.nome_negocio,
          settings.subtitulo,
          settings.logo,
          settings.cor_primaria,
          settings.hora_inicio_agenda,
          settings.hora_fim_agenda,
          settings.duracao_padrao,
          settings.moeda,
          settings.timezone,
          settings.permitir_conflito ? 1 : 0,
          settings.lembretes_ativos ? 1 : 0,
          settings.lembrete_horas_antes,
          settings.lembrete_mensagem,
          settings.whatsapp_ativo ? 1 : 0,
          settings.whatsapp_api_provider,
          settings.whatsapp_api_url,
          settings.whatsapp_api_token,
          settings.whatsapp_instance_id,
          settings.whatsapp_tempo_lembrete_minutos,
          settings.created_at,
          settings.updated_at,
        ],
      );
    }

    for (const appointment of seedAppointments) {
      await connection.execute(
        `INSERT INTO appointments (
          id, organization_id, cliente_id, cliente_nome, cliente_email,
          servico_id, servico_nome, servico_cor, profissional_id, profissional_nome,
          data, horario_inicial, horario_final,
          valor, status, payment_status, observacoes, confirmacao_cliente, lembrete_enviado,
          lembrete_confirmado, lembrete_cancelado, data_envio_lembrete, resposta_whatsapp,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appointment.id,
          appointment.organization_id,
          appointment.cliente_id,
          appointment.cliente_nome,
          appointment.cliente_email,
          appointment.servico_id,
          appointment.servico_nome,
          appointment.servico_cor,
          appointment.profissional_id || null,
          appointment.profissional_nome || null,
          appointment.data,
          appointment.horario_inicial,
          appointment.horario_final,
          appointment.valor,
          appointment.status,
          appointment.payment_status,
          appointment.observacoes,
          appointment.confirmacao_cliente,
          appointment.lembrete_enviado ? 1 : 0,
          appointment.lembrete_confirmado ? 1 : 0,
          appointment.lembrete_cancelado ? 1 : 0,
          appointment.data_envio_lembrete,
          appointment.resposta_whatsapp,
          appointment.created_at,
          appointment.updated_at,
        ],
      );
    }

    if (paymentsTableAvailable) {
      for (const payment of seedOrganizationPayments) {
        await connection.execute(
          `INSERT INTO organization_payments (
            id, organization_id, reference_month, amount, status, paid_at,
            due_date, payment_method, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            payment.id,
            payment.organization_id,
            payment.reference_month,
            payment.amount,
            payment.status,
            payment.paid_at,
            payment.due_date,
            payment.payment_method,
            payment.notes,
            payment.created_at,
            payment.updated_at,
          ],
        );
      }
    }
  });
}

async function ensureInitialized() {
  if (initialized) {
    return;
  }

  await ensureTablesExist();
  await ensureSeedData();
  await ensurePlatformSettingsInfrastructure();
  initialized = true;
}

function getDateRangeForView(date, view) {
  const selectedDate = new Date(`${date}T12:00:00`);

  if (Number.isNaN(selectedDate.getTime())) {
    return { start: date, end: date };
  }

  if (view === "week") {
    const weekday = selectedDate.getDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() + mondayOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  }

  if (view === "month") {
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  }

  return { start: date, end: date };
}

export async function initDataStore() {
  await ensureInitialized();
}

export async function listTenants() {
  await ensureInitialized();
  const rows = await query("SELECT id, nome_empresa FROM organizations ORDER BY nome_empresa ASC");

  return rows.map((row) => ({
    id: row.id,
    name: row.nome_empresa,
  }));
}

export async function listOrganizations() {
  await ensureInitialized();
  const rows = await query("SELECT * FROM organizations ORDER BY nome_empresa ASC");
  return rows.map(mapOrganization);
}

export async function listAdminOrganizations() {
  await ensureInitialized();
  const paymentsTableAvailable = await hasTable("organization_payments");

  const paymentSelect = paymentsTableAvailable
    ? `(
        SELECT op.status
        FROM organization_payments op
        WHERE op.organization_id = o.id
        ORDER BY COALESCE(op.paid_at, op.created_at) DESC
        LIMIT 1
      ) AS latest_payment_status,
      (
        SELECT op.reference_month
        FROM organization_payments op
        WHERE op.organization_id = o.id
        ORDER BY COALESCE(op.paid_at, op.created_at) DESC
        LIMIT 1
      ) AS latest_reference_month,`
    : `NULL AS latest_payment_status, NULL AS latest_reference_month,`;

  const rows = await query(
    `SELECT
      o.*,
      ${paymentSelect}
      (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id AND u.ativo = 1) AS active_users
    FROM organizations o
    ORDER BY o.nome_empresa ASC`,
  );

  return rows.map((row) => ({
    ...mapOrganization(row),
    latest_payment_status: row.latest_payment_status ?? null,
    latest_reference_month: row.latest_reference_month ?? null,
    active_users: Number(row.active_users ?? 0),
  }));
}

export async function getPlatformSettings() {
  await ensureInitialized();
  const rows = await query("SELECT * FROM platform_settings WHERE id = 'default' LIMIT 1");
  return mapPlatformSettings(rows[0]);
}

export async function updatePlatformSettings(input) {
  await ensureInitialized();
  const statement = buildUpdateStatement(input, [
    "pix_key",
    "payment_grace_days",
    "payment_alert_days",
  ]);

  if (statement) {
    await execute(
      `UPDATE platform_settings SET ${statement.sql} WHERE id = 'default'`,
      statement.params,
    );
  }

  return getPlatformSettings();
}

export async function getAdminOrganizationDetails(organizationId) {
  await ensureInitialized();
  const organization = await getOrganizationById(organizationId);

  if (!organization) {
    return null;
  }

  const settings = await getAppSettingsByOrganization(organizationId);
  const members = await listUsersByOrganization(organizationId);
  const payments = (await hasTable("organization_payments"))
    ? await listOrganizationPayments(organizationId)
    : [];

  return {
    organization,
    settings,
    members,
    payments,
  };
}

export async function listOrganizationPayments(organizationId) {
  await ensureInitialized();

  if (!(await hasTable("organization_payments"))) {
    return [];
  }

  const rows = await query(
    `SELECT * FROM organization_payments
      WHERE organization_id = ?
      ORDER BY reference_month DESC, COALESCE(paid_at, created_at) DESC`,
    [organizationId],
  );

  return rows.map(mapOrganizationPayment);
}

export async function getLatestOrganizationPayment(organizationId) {
  const payments = await listOrganizationPayments(organizationId);
  return payments[0] ?? null;
}

export async function createOrganizationPayment(organizationId, input) {
  await ensureInitialized();

  if (!(await hasTable("organization_payments"))) {
    const error = new Error(
      "Tabela organization_payments nao encontrada. Rode a migration do Super Admin no MySQL.",
    );
    error.statusCode = 500;
    throw error;
  }

  const id = randomUUID();
  await execute(
    `INSERT INTO organization_payments (
      id, organization_id, reference_month, amount, status, paid_at,
      due_date, payment_method, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      organizationId,
      input.reference_month,
      Number(input.amount),
      input.status,
      toMysqlDateTime(input.paid_at),
      input.due_date || null,
      input.payment_method || null,
      input.notes || null,
    ],
  );

  const rows = await query("SELECT * FROM organization_payments WHERE id = ? LIMIT 1", [id]);
  return mapOrganizationPayment(rows[0]);
}

export async function notifyOrganizationPaymentPaid(organizationId, paymentId, note = null) {
  await ensureInitialized();

  if (!(await hasTable("organization_payments"))) {
    const error = new Error("Historico de pagamentos indisponivel no momento.");
    error.statusCode = 500;
    throw error;
  }

  await execute(
    `UPDATE organization_payments
      SET customer_notified_paid_at = CURRENT_TIMESTAMP,
          customer_payment_note = ?
      WHERE organization_id = ?
        AND id = ?
        AND status <> 'paid'`,
    [note || null, organizationId, paymentId],
  );

  const rows = await query(
    "SELECT * FROM organization_payments WHERE organization_id = ? AND id = ? LIMIT 1",
    [organizationId, paymentId],
  );

  return mapOrganizationPayment(rows[0]);
}

export async function createOrganization({
  emailResponsavel,
  nomeEmpresa,
  telefone,
  monthlyAmount,
  monthly_amount,
  subscriptionStatus,
  subscriptionPlan,
  dueDate,
  trialEnd,
}) {
  await ensureInitialized();

  const organization = {
    id: randomUUID(),
    nome_empresa: nomeEmpresa,
    email_responsavel: emailResponsavel,
    telefone: telefone ?? "",
    monthly_amount: Number(monthlyAmount ?? monthly_amount ?? 0),
    subscription_status: subscriptionStatus ?? "trial",
    subscription_plan: subscriptionPlan ?? "starter",
    due_date: dueDate ?? null,
    trial_end: trialEnd ?? getFutureDate(14),
  };

  await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO organizations (
        id, nome_empresa, email_responsavel, telefone, monthly_amount,
        subscription_status, subscription_plan, due_date, trial_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        organization.id,
        organization.nome_empresa,
        organization.email_responsavel,
        organization.telefone || null,
        organization.monthly_amount,
        organization.subscription_status,
        organization.subscription_plan,
        organization.due_date,
        organization.trial_end,
      ],
    );

    await connection.execute(
      `INSERT INTO app_settings (
        id, organization_id, nome_negocio, subtitulo, logo, cor_primaria,
        hora_inicio_agenda, hora_fim_agenda, duracao_padrao, moeda, timezone,
        permitir_conflito, lembretes_ativos, lembrete_horas_antes, lembrete_mensagem,
        whatsapp_ativo, whatsapp_api_provider, whatsapp_api_url, whatsapp_api_token,
        whatsapp_instance_id, whatsapp_tempo_lembrete_minutos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        organization.id,
        nomeEmpresa,
        null,
        null,
        "#1d8cf8",
        "08:00:00",
        "18:00:00",
        30,
        "BRL",
        "America/Sao_Paulo",
        0,
        1,
        24,
        "Lembrete do seu atendimento",
        0,
        "manual",
        null,
        null,
        null,
        60,
      ],
    );
  });

  return getOrganizationById(organization.id);
}

export async function createUser({
  email,
  nome,
  organizationId,
  role = "owner",
  authProvider = "email",
  passwordHash = null,
  googleId = null,
  appleId = null,
}) {
  await ensureInitialized();
  const id = randomUUID();

  await execute(
    `INSERT INTO users (
      id, organization_id, nome, email, google_id, apple_id, auth_provider,
      password_hash, role, ativo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, organizationId, nome, email, googleId, appleId, authProvider, passwordHash, role, 1],
  );

  return getUserById(id);
}

export async function getOrganizationById(organizationId) {
  await ensureInitialized();
  const rows = await query("SELECT * FROM organizations WHERE id = ? LIMIT 1", [organizationId]);
  return mapOrganization(rows[0]);
}

export async function updateOrganizationById(organizationId, input) {
  await ensureInitialized();
  const statement = buildUpdateStatement(input, [
    "nome_empresa",
    "email_responsavel",
    "telefone",
    "monthly_amount",
    "subscription_status",
    "subscription_plan",
    "due_date",
    "trial_end",
  ]);

  if (statement) {
    await execute(
      `UPDATE organizations SET ${statement.sql} WHERE id = ?`,
      [...statement.params, organizationId],
    );
  }

  return getOrganizationById(organizationId);
}

export async function listUsersByOrganization(organizationId) {
  await ensureInitialized();
  const rows = await query("SELECT * FROM users WHERE organization_id = ? ORDER BY nome ASC", [organizationId]);
  return rows.map(mapUser);
}

export async function getUserById(userId) {
  await ensureInitialized();
  const rows = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [userId]);
  return mapUser(rows[0]);
}

export async function getUserByEmail(email) {
  await ensureInitialized();
  const rows = await query("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1", [email]);
  return mapUserForAuth(rows[0]);
}

export async function updateUserPasswordById(userId, passwordHash) {
  await ensureInitialized();
  await execute(
    `UPDATE users
      SET password_hash = ?, auth_provider = 'email'
      WHERE id = ?`,
    [passwordHash, userId],
  );
  return getUserById(userId);
}

export async function deactivateUserById(userId) {
  await ensureInitialized();
  await execute("UPDATE users SET ativo = 0 WHERE id = ?", [userId]);
  return getUserById(userId);
}

export async function listClientsByOrganization(organizationId, search = "") {
  await ensureInitialized();
  const normalizedSearch = normalizeOptionalString(search).toLowerCase();

  if (!normalizedSearch) {
    const rows = await query("SELECT * FROM clients WHERE organization_id = ? ORDER BY nome ASC", [organizationId]);
    return rows.map(mapClient);
  }

  const like = `%${normalizedSearch}%`;
  const rows = await query(
    `SELECT * FROM clients
      WHERE organization_id = ?
        AND (
          LOWER(nome) LIKE ?
          OR LOWER(COALESCE(telefone, '')) LIKE ?
          OR LOWER(COALESCE(email, '')) LIKE ?
        )
      ORDER BY nome ASC`,
    [organizationId, like, like, like],
  );

  return rows.map(mapClient);
}

export async function getClientByIdForOrganization(organizationId, clientId) {
  await ensureInitialized();
  const rows = await query("SELECT * FROM clients WHERE organization_id = ? AND id = ? LIMIT 1", [organizationId, clientId]);
  return mapClient(rows[0]);
}

export async function createClientForOrganization(organizationId, input) {
  await ensureInitialized();
  const id = randomUUID();

  await execute(
    `INSERT INTO clients (
      id, organization_id, nome, telefone, email, observacoes, ativo
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      organizationId,
      input.nome,
      input.telefone || null,
      input.email || null,
      input.observacoes || null,
      input.ativo === false ? 0 : 1,
    ],
  );

  return getClientByIdForOrganization(organizationId, id);
}

export async function updateClientForOrganization(organizationId, clientId, input) {
  await ensureInitialized();
  const statement = buildUpdateStatement(
    {
      nome: input.nome,
      telefone: input.telefone || null,
      email: input.email || null,
      observacoes: input.observacoes || null,
      ativo: input.ativo === undefined ? undefined : input.ativo ? 1 : 0,
    },
    ["nome", "telefone", "email", "observacoes", "ativo"],
  );

  if (statement) {
    await execute(
      `UPDATE clients SET ${statement.sql} WHERE organization_id = ? AND id = ?`,
      [...statement.params, organizationId, clientId],
    );
  }

  return getClientByIdForOrganization(organizationId, clientId);
}

export async function removeClientForOrganization(organizationId, clientId) {
  await ensureInitialized();
  const result = await execute("DELETE FROM clients WHERE organization_id = ? AND id = ?", [organizationId, clientId]);
  return result.affectedRows > 0;
}

export async function listServicesByOrganization(organizationId, search = "") {
  await ensureInitialized();
  const normalizedSearch = normalizeOptionalString(search).toLowerCase();

  if (!normalizedSearch) {
    const rows = await query("SELECT * FROM services WHERE organization_id = ? ORDER BY nome ASC", [organizationId]);
    return rows.map(mapService);
  }

  const like = `%${normalizedSearch}%`;
  const rows = await query(
    `SELECT * FROM services
      WHERE organization_id = ?
        AND LOWER(nome) LIKE ?
      ORDER BY nome ASC`,
    [organizationId, like],
  );

  return rows.map(mapService);
}

export async function getServiceByIdForOrganization(organizationId, serviceId) {
  await ensureInitialized();
  const rows = await query("SELECT * FROM services WHERE organization_id = ? AND id = ? LIMIT 1", [organizationId, serviceId]);
  return mapService(rows[0]);
}

export async function createServiceForOrganization(organizationId, input) {
  await ensureInitialized();
  const id = randomUUID();

  await execute(
    `INSERT INTO services (
      id, organization_id, nome, descricao, duracao_minutos, valor_padrao, cor, ativo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      organizationId,
      input.nome,
      input.descricao || null,
      Number(input.duracao_minutos),
      Number(input.valor_padrao),
      input.cor || null,
      input.ativo === false ? 0 : 1,
    ],
  );

  return getServiceByIdForOrganization(organizationId, id);
}

export async function updateServiceForOrganization(organizationId, serviceId, input) {
  await ensureInitialized();
  const statement = buildUpdateStatement(
    {
      nome: input.nome,
      descricao: input.descricao || null,
      duracao_minutos: input.duracao_minutos === undefined ? undefined : Number(input.duracao_minutos),
      valor_padrao: input.valor_padrao === undefined ? undefined : Number(input.valor_padrao),
      cor: input.cor || null,
      ativo: input.ativo === undefined ? undefined : input.ativo ? 1 : 0,
    },
    ["nome", "descricao", "duracao_minutos", "valor_padrao", "cor", "ativo"],
  );

  if (statement) {
    await execute(
      `UPDATE services SET ${statement.sql} WHERE organization_id = ? AND id = ?`,
      [...statement.params, organizationId, serviceId],
    );
  }

  return getServiceByIdForOrganization(organizationId, serviceId);
}

export async function removeServiceForOrganization(organizationId, serviceId) {
  await ensureInitialized();
  const result = await execute("DELETE FROM services WHERE organization_id = ? AND id = ?", [organizationId, serviceId]);
  return result.affectedRows > 0;
}

export async function listProfessionalsByOrganization(organizationId) {
  await ensureInitialized();
  if (!(await hasProfessionalsFeature())) {
    return [];
  }
  const rows = await query(
    "SELECT * FROM professionals WHERE organization_id = ? ORDER BY nome ASC",
    [organizationId],
  );
  return rows.map(mapProfessional);
}

export async function getProfessionalByIdForOrganization(organizationId, professionalId) {
  await ensureInitialized();
  if (!(await hasProfessionalsFeature())) {
    return null;
  }
  const rows = await query(
    "SELECT * FROM professionals WHERE organization_id = ? AND id = ? LIMIT 1",
    [organizationId, professionalId],
  );
  return mapProfessional(rows[0]);
}

export async function listServiceIdsByProfessional(organizationId, professionalId) {
  await ensureInitialized();
  if (!(await hasProfessionalsFeature())) {
    return [];
  }
  const rows = await query(
    `SELECT service_id FROM professional_services
      WHERE organization_id = ? AND professional_id = ?
      ORDER BY service_id ASC`,
    [organizationId, professionalId],
  );
  return rows.map((row) => row.service_id);
}

export async function listProfessionalsByService(organizationId, serviceId) {
  await ensureInitialized();
  if (!(await hasProfessionalsFeature())) {
    return [];
  }
  const rows = await query(
    `SELECT p.*
      FROM professionals p
      INNER JOIN professional_services ps
        ON ps.organization_id = p.organization_id
       AND ps.professional_id = p.id
      WHERE p.organization_id = ?
        AND ps.service_id = ?
        AND p.ativo = 1
      ORDER BY p.nome ASC`,
    [organizationId, serviceId],
  );
  return rows.map(mapProfessional);
}

export async function createProfessionalForOrganization(organizationId, input) {
  await ensureInitialized();
  await ensureProfessionalsTablesExist();
  const id = randomUUID();

  await execute(
    `INSERT INTO professionals (
      id, organization_id, nome, atividade, ativo
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      organizationId,
      input.nome,
      input.atividade || null,
      input.ativo === false ? 0 : 1,
    ],
  );

  if (Array.isArray(input.service_ids) && input.service_ids.length) {
    for (const serviceId of input.service_ids) {
      await execute(
        `INSERT INTO professional_services (
          id, organization_id, professional_id, service_id
        ) VALUES (?, ?, ?, ?)`,
        [randomUUID(), organizationId, id, serviceId],
      );
    }
  }

  return getProfessionalByIdForOrganization(organizationId, id);
}

export async function updateProfessionalForOrganization(organizationId, professionalId, input) {
  await ensureInitialized();
  await ensureProfessionalsTablesExist();
  const statement = buildUpdateStatement(
    {
      nome: input.nome,
      atividade: input.atividade || null,
      ativo: input.ativo === undefined ? undefined : input.ativo ? 1 : 0,
    },
    ["nome", "atividade", "ativo"],
  );

  if (statement) {
    await execute(
      `UPDATE professionals SET ${statement.sql} WHERE organization_id = ? AND id = ?`,
      [...statement.params, organizationId, professionalId],
    );
  }

  if (Array.isArray(input.service_ids)) {
    await execute(
      "DELETE FROM professional_services WHERE organization_id = ? AND professional_id = ?",
      [organizationId, professionalId],
    );

    for (const serviceId of input.service_ids) {
      await execute(
        `INSERT INTO professional_services (
          id, organization_id, professional_id, service_id
        ) VALUES (?, ?, ?, ?)`,
        [randomUUID(), organizationId, professionalId, serviceId],
      );
    }
  }

  return getProfessionalByIdForOrganization(organizationId, professionalId);
}

export async function getAppSettingsByOrganization(organizationId) {
  await ensureInitialized();
  const rows = await query("SELECT * FROM app_settings WHERE organization_id = ? LIMIT 1", [organizationId]);
  return mapAppSettings(rows[0]);
}

export async function updateAppSettingsByOrganization(organizationId, input) {
  await ensureInitialized();
  const statement = buildUpdateStatement(input, [
    "nome_negocio",
    "subtitulo",
    "logo",
    "cor_primaria",
    "hora_inicio_agenda",
    "hora_fim_agenda",
    "duracao_padrao",
    "moeda",
    "timezone",
    "permitir_conflito",
    "lembretes_ativos",
    "lembrete_horas_antes",
    "lembrete_mensagem",
    "whatsapp_ativo",
    "whatsapp_api_provider",
    "whatsapp_api_url",
    "whatsapp_api_token",
    "whatsapp_instance_id",
    "whatsapp_tempo_lembrete_minutos",
  ]);

  if (statement) {
    await execute(
      `UPDATE app_settings SET ${statement.sql} WHERE organization_id = ?`,
      [...statement.params, organizationId],
    );
  }

  return getAppSettingsByOrganization(organizationId);
}

export async function listAllAppointmentsByOrganization(organizationId) {
  await ensureInitialized();
  const rows = await query(
    `SELECT * FROM appointments
      WHERE organization_id = ?
      ORDER BY data ASC, horario_inicial ASC`,
    [organizationId],
  );

  return rows.map(mapAppointment);
}

export async function listAppointmentsByOrganization(
  organizationId,
  { date, view = "day", professionalId } = {},
) {
  await ensureInitialized();
  const selectedDate = normalizeOptionalString(date) || new Date().toISOString().slice(0, 10);
  const range = getDateRangeForView(selectedDate, view);
  const normalizedProfessionalId = normalizeOptionalString(professionalId);
  const rows = normalizedProfessionalId
    ? await query(
        `SELECT * FROM appointments
          WHERE organization_id = ?
            AND data >= ?
            AND data <= ?
            AND profissional_id = ?
          ORDER BY data ASC, horario_inicial ASC`,
        [organizationId, range.start, range.end, normalizedProfessionalId],
      )
    : await query(
        `SELECT * FROM appointments
          WHERE organization_id = ?
            AND data >= ?
            AND data <= ?
          ORDER BY data ASC, horario_inicial ASC`,
        [organizationId, range.start, range.end],
      );

  return rows.map(mapAppointment);
}

export async function getAppointmentByIdForOrganization(organizationId, appointmentId) {
  await ensureInitialized();
  const rows = await query("SELECT * FROM appointments WHERE organization_id = ? AND id = ? LIMIT 1", [organizationId, appointmentId]);
  return mapAppointment(rows[0]);
}

export async function createAppointmentForOrganization(organizationId, input) {
  await ensureInitialized();
  const id = randomUUID();

  await execute(
    `INSERT INTO appointments (
      id, organization_id, cliente_id, cliente_nome, cliente_email,
      servico_id, servico_nome, servico_cor, profissional_id, profissional_nome,
      data, horario_inicial, horario_final,
      valor, status, payment_status, observacoes, confirmacao_cliente, lembrete_enviado,
      lembrete_confirmado, lembrete_cancelado, data_envio_lembrete, resposta_whatsapp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      organizationId,
      input.cliente_id,
      input.cliente_nome,
      input.cliente_email || null,
      input.servico_id,
      input.servico_nome,
      input.servico_cor || null,
      input.profissional_id || null,
      input.profissional_nome || null,
      input.data,
      `${stripSeconds(input.horario_inicial)}:00`,
      `${stripSeconds(input.horario_final)}:00`,
      Number(input.valor),
      input.status,
      input.payment_status,
      input.observacoes || null,
      input.confirmacao_cliente,
      input.lembrete_enviado ? 1 : 0,
      input.lembrete_confirmado ? 1 : 0,
      input.lembrete_cancelado ? 1 : 0,
      toMysqlDateTime(input.data_envio_lembrete),
      input.resposta_whatsapp || null,
    ],
  );

  return getAppointmentByIdForOrganization(organizationId, id);
}

export async function updateAppointmentForOrganization(organizationId, appointmentId, input) {
  await ensureInitialized();
  const statement = buildUpdateStatement(
    {
      cliente_id: input.cliente_id,
      cliente_nome: input.cliente_nome,
      cliente_email: input.cliente_email || null,
      servico_id: input.servico_id,
      servico_nome: input.servico_nome,
      servico_cor: input.servico_cor || null,
      profissional_id: input.profissional_id === undefined ? undefined : input.profissional_id || null,
      profissional_nome: input.profissional_nome === undefined ? undefined : input.profissional_nome || null,
      data: input.data,
      horario_inicial: input.horario_inicial === undefined ? undefined : `${stripSeconds(input.horario_inicial)}:00`,
      horario_final: input.horario_final === undefined ? undefined : `${stripSeconds(input.horario_final)}:00`,
      valor: input.valor === undefined ? undefined : Number(input.valor),
      status: input.status,
      payment_status: input.payment_status,
      observacoes: input.observacoes || null,
      confirmacao_cliente: input.confirmacao_cliente,
      lembrete_enviado: input.lembrete_enviado === undefined ? undefined : input.lembrete_enviado ? 1 : 0,
      lembrete_confirmado: input.lembrete_confirmado === undefined ? undefined : input.lembrete_confirmado ? 1 : 0,
      lembrete_cancelado: input.lembrete_cancelado === undefined ? undefined : input.lembrete_cancelado ? 1 : 0,
      data_envio_lembrete:
        input.data_envio_lembrete === undefined
          ? undefined
          : toMysqlDateTime(input.data_envio_lembrete),
      resposta_whatsapp: input.resposta_whatsapp === undefined ? undefined : input.resposta_whatsapp || null,
    },
    [
      "cliente_id",
      "cliente_nome",
      "cliente_email",
      "servico_id",
      "servico_nome",
      "servico_cor",
      "profissional_id",
      "profissional_nome",
      "data",
      "horario_inicial",
      "horario_final",
      "valor",
      "status",
      "payment_status",
      "observacoes",
      "confirmacao_cliente",
      "lembrete_enviado",
      "lembrete_confirmado",
      "lembrete_cancelado",
      "data_envio_lembrete",
      "resposta_whatsapp",
    ],
  );

  if (statement) {
    await execute(
      `UPDATE appointments SET ${statement.sql} WHERE organization_id = ? AND id = ?`,
      [...statement.params, organizationId, appointmentId],
    );
  }

  return getAppointmentByIdForOrganization(organizationId, appointmentId);
}

export async function removeAppointmentForOrganization(organizationId, appointmentId) {
  await ensureInitialized();
  const result = await execute("DELETE FROM appointments WHERE organization_id = ? AND id = ?", [organizationId, appointmentId]);
  return result.affectedRows > 0;
}

export async function listBlockedSlotsByOrganization(
  organizationId,
  { date, view = "day", professionalId } = {},
) {
  await ensureInitialized();

  if (!(await hasTable("blocked_slots"))) {
    return [];
  }

  const selectedDate = normalizeOptionalString(date) || new Date().toISOString().slice(0, 10);
  const range = getDateRangeForView(selectedDate, view);
  const normalizedProfessionalId = normalizeOptionalString(professionalId);
  const rows = normalizedProfessionalId
    ? await query(
        `SELECT * FROM blocked_slots
          WHERE organization_id = ?
            AND data >= ?
            AND data <= ?
            AND (professional_id IS NULL OR professional_id = ?)
          ORDER BY data ASC, horario_inicial ASC`,
        [organizationId, range.start, range.end, normalizedProfessionalId],
      )
    : await query(
        `SELECT * FROM blocked_slots
          WHERE organization_id = ?
            AND data >= ?
            AND data <= ?
          ORDER BY data ASC, horario_inicial ASC`,
        [organizationId, range.start, range.end],
      );

  return rows.map(mapBlockedSlot);
}

export async function createBlockedSlotForOrganization(organizationId, input) {
  await ensureInitialized();
  await ensureBlockedSlotsTableExists();
  const id = randomUUID();

  await execute(
    `INSERT INTO blocked_slots (
      id, organization_id, professional_id, data, horario_inicial, horario_final, motivo
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      organizationId,
      input.professional_id || null,
      input.data,
      `${stripSeconds(input.horario_inicial)}:00`,
      `${stripSeconds(input.horario_final)}:00`,
      input.motivo || null,
    ],
  );

  const rows = await query(
    "SELECT * FROM blocked_slots WHERE organization_id = ? AND id = ? LIMIT 1",
    [organizationId, id],
  );
  return mapBlockedSlot(rows[0]);
}

export async function removeBlockedSlotForOrganization(organizationId, blockedSlotId) {
  await ensureInitialized();
  await ensureBlockedSlotsTableExists();
  const result = await execute(
    "DELETE FROM blocked_slots WHERE organization_id = ? AND id = ?",
    [organizationId, blockedSlotId],
  );
  return result.affectedRows > 0;
}
