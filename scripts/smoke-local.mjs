import assert from 'node:assert/strict';
import { loadEnvironment } from '../backend/src/lib/env.js';
import { query, getPool } from '../backend/src/lib/database.js';
loadEnvironment();
assert.equal(process.env.DB_HOST, '127.0.0.1', 'Teste permitido apenas no banco local');
assert.equal(process.env.DB_PORT, '3307');
let token;
async function api(path, method = 'GET', body, expected = 200) {
  const response = await fetch(`http://127.0.0.1:3333/api${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = response.status === 204 ? null : await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}
let appointmentId;
let profileId;
try {
  await api('/health');
  const login = await api('/auth/login', 'POST', { email: 'contato@agendapro.app', password: 'Agenda123!' });
  token = login.token;
  assert.ok(token);
  for (const path of ['/auth/session', '/clients', '/services', '/organizations/current/professionals', '/quotes', '/recurring/profiles', '/recurring/charges', '/dashboard/summary']) await api(path);
  const date = new Date(); date.setDate(date.getDate() + 3);
  const day = date.toISOString().slice(0, 10);
  const input = { cliente_id: 'client-1', profissional_id: 'professional-1', data: day, horario_inicial: '15:00', status: 'pendente', payment_status: 'pendente',
    items: [{ servico_id: 'service-1', duracao_minutos: 60, valor_unitario: 180 }, { servico_id: 'service-2', duracao_minutos: 30, valor_unitario: 120 }], valor: 300 };
  const created = await api('/agenda', 'POST', input, 201);
  appointmentId = created.data.id;
  const detail = (await api(`/agenda/${appointmentId}`)).data;
  assert.equal(detail.items.length, 2);
  assert.equal(detail.horario_final, '16:30');
  assert.equal(Number(detail.valor), 300);
  const edited = (await api(`/agenda/${appointmentId}`, 'PUT', { ...input, horario_inicial: '14:00' })).data;
  assert.equal(edited.horario_final, '15:30');
  await api(`/agenda/${appointmentId}`, 'DELETE', undefined, 204); appointmentId = null;
  const profile = await api('/recurring/profiles', 'POST', { clientId: 'client-1', serviceId: 'service-1', descricao: 'Teste local de exclusao', valor: 150, dataInicio: day, diaCobranca1: 10, ativo: false }, 201);
  profileId = profile.data.id;
  const deletedId = profileId;
  await api(`/recurring/profiles/${profileId}`, 'DELETE', undefined, 204); profileId = null;
  const logs = await query("SELECT organization_id, recurring_profile_id FROM recurring_logs WHERE tipo_evento = 'recorrencia_excluida' AND descricao = ?", [`Recorrencia excluida: ${deletedId}.`]);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].organization_id, 'org-1');
  assert.equal(logs[0].recurring_profile_id, null);
  console.log('OK: login, consultas principais, criar/editar/excluir agenda multi-servico e excluir recorrencia preservando auditoria e tenant.');
} finally {
  if (appointmentId) await api(`/agenda/${appointmentId}`, 'DELETE', undefined, 204);
  if (profileId) await api(`/recurring/profiles/${profileId}`, 'DELETE', undefined, 204);
  await (await getPool()).end();
}
